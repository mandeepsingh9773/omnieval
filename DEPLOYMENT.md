# OmniEval — Production Deployment Guide

OmniEval is a Next.js 15 (App Router) benchmarking app that runs on serverless
infrastructure. This guide walks you through a production deploy on **Vercel**
with:

- **PostgreSQL** on **Neon** or **Supabase** (the Prisma datastore)
- **Upstash Redis** for per-IP API rate limiting and telemetry (leaderboard) caching
- **BYOK** (bring-your-own-key): provider API keys never touch our servers —
  they are AES-encrypted in the visitor's browser only

> The generated Prisma client (`src/generated/prisma`) is `.gitignore`d and
> regenerated automatically during `npm install` via the `postinstall` script,
> so you do **not** need to commit it.

---

## Architecture at a glance

```
Browser (React)
  ├─ BYOK keys -> encrypted in localStorage (Web Crypto, never uploaded)
  ├─ /api/eval/stream  ──> provider APIs (OpenAI/Anthropic/Gemini/Groq) via AI SDK
  ├─ /api/arena/vote   ──> Neon/Supabase Postgres (Prisma, Elo transaction)
  └─ /api/arena/leaderboard ──> Upstash Redis (30s cache) ──> Postgres (miss)

Vercel Edge/Functions:
  └─ @upstash/ratelimit  ──> per-IP sliding-window limits on every API route
```

| Route                     | Rate limit (per IP, sliding window) | Purpose                          |
| ------------------------- | ----------------------------------- | -------------------------------- |
| `POST /api/eval/stream`   | 30 / minute                         | BYOK model streaming (abuse target) |
| `POST /api/arena/vote`    | 20 / minute                         | Elo vote submission              |
| `GET /api/arena/leaderboard` | 120 / minute                     | Read-only polling (also cached 30s) |

Limits are compiled in; there is no runtime knob (see “Tuning” below to change them).

---

## Prerequisites

- A GitHub/GitLab/Bitbucket account and a repository containing this code
- Node.js 20.19+ and npm locally (for migrations)
- Accounts (free tiers are fine) for:
  - [Vercel](https://vercel.com)
  - **Either** [Neon](https://neon.tech) **or** [Supabase](https://supabase.com)
  - [Upstash](https://upstash.com)

---

## Step 1 — Provision PostgreSQL (Neon or Supabase)

### Option A: Neon (recommended for serverless)

1. Create a project at [neon.tech](https://neon.tech). Choose a region near your
   Vercel deployment (ideally `us-east-1` / `us-east-2` for Vercel default).
2. Open **Dashboard → Connect**.
3. For serverless workloads, enable the **pooled connection string** (PGBouncer).
   Copy the URI — it looks like:

   ```text
   postgresql://neondb_owner:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   Use this as `DATABASE_URL`. The `-pooler` host multiplexes connections, which
   matters because serverless functions open many short-lived connections.

### Option B: Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string → Prisma/URI**.
3. Copy the **transaction/pooler** URI (port `6543`, PGBouncer):

   ```text
   postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```

   Use this as `DATABASE_URL`. The `pgbouncer=true` flag is required for
   serverless connection pooling.

### Migrate the schema

Run the migration against the **production** database once, from your machine:

```bash
# 1. Point a local shell at the production DB
#    (PowerShell)
$env:DATABASE_URL = "postgresql://..."
#    (bash/zsh)
# export DATABASE_URL="postgresql://..."

# 2. Apply schema
npx prisma migrate deploy
```

> **Note:** the repo has no checked-in migration files yet. If `migrate deploy`
> reports “no migrations”, run `npx prisma db push` instead to sync the schema
> directly, then run `npx prisma migrate dev` locally once to capture an initial
> migration you can commit for future `migrate deploy` runs.

The client is generated for you automatically by `postinstall` — no action needed.

---

## Step 2 — Provision Upstash Redis

1. Create an account at [upstash.com](https://upstash.com).
2. **Create database** → choose **Global** (recommended) or a region near your
   Vercel function. Enable **REST API**.
3. From the **Details** page copy:

   - `UPSTASH_REDIS_REST_URL` — e.g. `https://xxxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — the REST API token

This single Redis is used for both rate limiting (`@upstash/ratelimit`) and the
leaderboard cache. It is optional locally: without it the app runs unthrottled
and skips caching, which is the intended dev behavior.

---

## Step 3 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **import** your repository.
2. Vercel auto-detects Next.js. Confirm:

   - **Framework preset:** Next.js
   - **Build command:** `npm run build` (default)
   - **Install command:** `npm install` (default — runs Prisma generate)
3. Add the **Environment Variables** (add them to **Production** at minimum;
   use **Preview** for staging):

   | Variable                    | Value                                   | Required |
   | --------------------------- | --------------------------------------- | -------- |
   | `DATABASE_URL`              | Pooled Postgres URI from Step 1         | ✅       |
   | `UPSTASH_REDIS_REST_URL`    | Upstash REST URL from Step 2            | ✅       |
   | `UPSTASH_REDIS_REST_TOKEN`  | Upstash REST token from Step 2          | ✅       |
   | `NEXT_PUBLIC_BYOK_PEPPER`   | Fresh random string (see below)         | ✅       |

   Generate a unique pepper per environment:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   `NEXT_PUBLIC_BYOK_PEPPER` ships to the browser, so it is **obfuscation**, not a
   secret — but it must differ between production and other environments so vaults
   are not cross-compatible.
4. Click **Deploy**. On success Vercel prints the production URL and runs
   `npm run build` (which includes `prisma generate` via `postinstall`).

---

## Step 4 — Verify the production deploy

1. Open your production URL and run a benchmark in the model arena — streams
   should complete and the **Latency comparison** chart should render.
2. Open **Arena Mode**, battle two models, and vote — the leaderboard should
   refresh.
3. Export a session via the **Export** button (JSON / CSV / Markdown).
4. Confirm rate limiting is live. From a terminal, hit the leaderboard 130 times
   in quick succession:

   ```bash
   for i in $(seq 1 130); do
     curl -s -o /dev/null -w "%{http_code}\n" https://<your-app>.vercel.app/api/arena/leaderboard
   done | sort | uniq -c
   ```

   You should see ~120 `200` responses followed by `429` responses carrying a
   `Retry-After` header and `X-RateLimit-*` headers.

5. Confirm caching: `GET /api/arena/leaderboard` returns `"cached": false` on the
   first call, then `"cached": true` for 30 seconds. (Absent Redis, it always
   returns `false` — that is fine in dev.)

---

## Environment variable reference

| Variable                     | Description                                                                 | Example                                    |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`               | Pooled PostgreSQL connection string (Neon/Supabase). Server-side only.       | `postgresql://...?sslmode=require`         |
| `UPSTASH_REDIS_REST_URL`     | Upstash Redis REST endpoint. Enables rate limiting + caching.                | `https://xxxx.upstash.io`                  |
| `UPSTASH_REDIS_REST_TOKEN`   | Upstash Redis REST token.                                                    | `AQRSAA…`                                  |
| `NEXT_PUBLIC_BYOK_PEPPER`    | Browser-shipped seed for vault key derivation. Unique per environment.       | 64-hex-char random string                  |

### Tuning rate limits

Limits are set inline in each route via `checkRateLimit(...)` in
`src/lib/ratelimit.ts`. To adjust:

- `src/app/api/eval/stream/route.ts` → `namespace: "eval/stream", limit: 30, window: "1 m"`
- `src/app/api/arena/vote/route.ts` → `limit: 20, window: "1 m"`
- `src/app/api/arena/leaderboard/route.ts` → `limit: 120, window: "1 m"` and `LEADERBOARD_TTL_SECONDS`

Rate-limit behavior is fail-open: if Redis is unreachable the request proceeds
(and an error is logged) rather than taking the API down.

---

## Local development

```bash
# 1. Install deps (runs prisma generate)
npm install

# 2. Copy env + fill in a local Postgres
cp .env.example .env
#   DATABASE_URL="postgresql://..."
#   (Upstash vars optional — rate limiting/caching are skipped without them)

# 3. Sync schema
npm run db:push

# 4. Run
npm run dev
```

---

## Troubleshooting

| Symptom                                                      | Fix                                                                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Build fails on Vercel with “Prisma Client could not be created” | `postinstall` regenerates the client; if you disabled install scripts, run `npx prisma generate` before build. |
| `DATABASE_URL` connection errors / connection pool exhausted | Use the **pooled** URI (Neon `-pooler`, Supabase port `6543` + `pgbouncer=true`). |
| All API calls return `429` instantly                        | Another client on the same egress IP (office/VPN) is consuming the window — raise the limit or key by a stronger identifier. |
| Leaderboard always returns `cached: false`                  | `UPSTASH_REDIS_REST_URL`/`TOKEN` missing or wrong — the cache degrades to a no-op on purpose. |
| Streaming requests time out                                 | `eval/stream` uses `maxDuration = 300` (Vercel Hobby = 60s). Upgrade the plan or lower `timeoutMs` per request. |
| `NEXT_PUBLIC_*` changes don’t take effect                   | `NEXT_PUBLIC_*` vars are inlined at build time — trigger a fresh deployment.              |

---

## Security notes

- **BYOK keys never reach the server.** `/api/eval/stream` accepts the key per
  request, uses it in-flight against the provider, and never logs or persists it.
  The browser vault is AES-256-GCM encrypted with a PBKDF2-derived key.
- **Rate limiting is per IP** and derived from `x-forwarded-for` (trusted on
  Vercel). Behind proxies that do not sanitize this header, clients could spoof it —
  if you expect hostile traffic, add Vercel WAF rules or an auth layer.
- Set `NEXT_PUBLIC_BYOK_PEPPER` differently per environment and rotate it if you
  suspect vault compromise.
