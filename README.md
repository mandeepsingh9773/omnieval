# OmniEval — Multi-model LLM benchmarking

OmniEval benchmarks the same prompt across multiple LLM providers side-by-side.
Built with Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma +
PostgreSQL, the Vercel AI SDK, and an encrypted **bring-your-own-key (BYOK)**
vault that keeps provider keys in the browser — never on our servers.

## Features

- **Model Arena** — run one prompt across up to 4 models in parallel and compare
  quality, TTFT, tokens/sec, latency, and estimated cost.
- **Arena Mode** — blind head-to-head battles, Elo ratings (K=32) updated
  server-side in a single Prisma transaction, and a live leaderboard.
- **BYOK Key Vault** — provider keys AES-256-GCM encrypted in `localStorage`
  with Web Crypto; only used in-flight against the provider.
- **Latency comparison chart** — Recharts bar charts of time-to-first-token and
  generation speed across every completed model.
- **Session export** — download an evaluation session as JSON, CSV, or a
  formatted Markdown report.
- **Per-IP rate limiting** — `@upstash/ratelimit` sliding windows on every API
  route (falls back to disabled when Redis is not configured).
- **Telemetry caching** — the Elo leaderboard is cached in Upstash Redis for 30s
  to keep read-heavy polling off Postgres.

## Getting started

```bash
# 1a. Option A — start local Postgres + Redis with Docker:
docker compose up -d

# 1b. Option B — or provide your own DATABASE_URL in .env

npm install
cp .env.example .env   # DATABASE_URL already points at the Docker defaults
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add API keys via the vault
dialog, then run the arena.

> The app's rate limiting + leaderboard cache use the Upstash Redis **REST**
> protocol, so they are off locally unless you set `UPSTASH_REDIS_REST_URL` /
> `UPSTASH_REDIS_REST_TOKEN` (see DEPLOYMENT.md). The `redis` container is
> provided for convenience/development and is a no-op otherwise.

## Environment variables

| Variable                   | Required | Notes                                        |
| -------------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`             | ✅       | PostgreSQL connection string (server-side).  |
| `NEXT_PUBLIC_BYOK_PEPPER`  | ✅       | Pepper for vault key derivation (browser).   |
| `UPSTASH_REDIS_REST_URL`   | prod     | Enables rate limiting + leaderboard caching. |
| `UPSTASH_REDIS_REST_TOKEN` | prod     | Upstash REST token.                          |

## Scripts

| Script           | Description                                    |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | Next.js dev server (Turbopack).                |
| `npm run build`  | Production build.                              |
| `npm run lint`   | ESLint.                                        |
| `npm run db:push`| Push the Prisma schema to Postgres.            |
| `npm run db:studio` | Open Prisma Studio.                        |

## Data model

`User` · `PromptHistory` · `ModelRun` (output, TTFT, latency, tokens, cost) ·
`ArenaMatchup` · `ModelElo`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for end-to-end instructions on shipping to
Vercel with Neon or Supabase PostgreSQL and Upstash Redis.
