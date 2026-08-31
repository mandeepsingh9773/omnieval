import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Per-IP API rate limiting backed by Upstash Redis.
 *
 * The limiter is created lazily and memoized per namespace. When the Upstash
 * credentials are missing (e.g. a local dev box without Redis), every request
 * passes and a one-time warning is logged — the app stays fully usable without
 * Redis, but rate limiting is only enforced in deployments that set
 * `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
 */

export interface RateLimitOptions {
  /** Route-scoped key prefix (e.g. "eval/stream"). */
  namespace: string;
  /** Maximum requests allowed per window. */
  limit: number;
  /** Duration string accepted by @upstash/ratelimit (e.g. "10 s", "1 m"). */
  window: Duration;
  /** Human-readable message returned on 429. */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Window capacity. */
  limit: number;
  /** Unix ms timestamp at which the window resets. */
  resetMs: number;
  /** Seconds until the window resets (for the Retry-After header). */
  retryAfterSeconds: number;
  /** The IP (or fallback identifier) this window belongs to. */
  identifier: string;
}

const instances = new Map<string, Ratelimit | null>();
let warned = false;

function isConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRatelimiter(options: RateLimitOptions): Ratelimit | null {
  if (!isConfigured()) {
    if (!warned) {
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — rate limiting disabled.",
      );
      warned = true;
    }
    return null;
  }

  const key = `${options.namespace}:${options.limit}:${options.window}`;
  let instance = instances.get(key);
  if (instance === undefined) {
    instance = new Ratelimit({
      redis: Redis.fromEnv(),
      prefix: `omnieval:ratelimit:${options.namespace}`,
      limiter: Ratelimit.slidingWindow(options.limit, options.window),
      // Fail-open quickly if Redis is unreachable instead of piling up requests.
      timeout: 1_000,
      ephemeralCache: new Map<string, number>(),
    });
    instances.set(key, instance);
  }
  return instance;
}

/**
 * Best-effort extraction of the client IP from common reverse-proxy headers.
 * On Vercel the trusted source is `x-forwarded-for` (leftmost = original client).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  return "unknown";
}

/** Always-passing result used when Redis is not configured. */
function passThrough(identifier: string): RateLimitResult {
  const now = Date.now();
  return {
    success: true,
    remaining: Number.POSITIVE_INFINITY,
    limit: Number.POSITIVE_INFINITY,
    resetMs: now,
    retryAfterSeconds: 0,
    identifier,
  };
}

/**
 * Enforce a per-IP sliding-window limit for the current request.
 * Returns `success: false` once the IP has exceeded `limit` requests in `window`.
 */
export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const identifier = getClientIp(request);
  const ratelimiter = getRatelimiter(options);
  if (!ratelimiter) return passThrough(identifier);

  try {
    const response = await ratelimiter.limit(identifier);
    const now = Date.now();
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((response.reset - now) / 1000),
    );
    return {
      success: response.success,
      remaining: response.remaining,
      limit: response.limit,
      resetMs: response.reset,
      retryAfterSeconds,
      identifier,
    };
  } catch (error) {
    // Fail open: a Redis outage must not take the whole API down.
    console.error("[ratelimit] limit check failed, allowing request:", error);
    return passThrough(identifier);
  }
}

/** Standard `429 Too Many Requests` response with Retry-After + X-RateLimit-* headers. */
export function rateLimitResponse(
  result: RateLimitResult,
  message = "Too many requests. Please slow down and try again shortly.",
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

/** 429 variant shaped like the `EvalError` the eval stream client understands. */
export function rateLimitEvalResponse(
  result: RateLimitResult,
  message = "Too many requests. Please slow down and try again shortly.",
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "rate_limited",
        message,
        retryAfterMs: result.retryAfterSeconds * 1000,
      },
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

/** The `X-RateLimit-*` + `Retry-After` header set attached to rate-limited responses. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  };
}
