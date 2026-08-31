import { Redis } from "@upstash/redis";

/**
 * Thin Redis-backed cache for telemetry reads (e.g. the Elo leaderboard).
 *
 * Read-heavy endpoints that recompute aggregate data from Postgres on every
 * hit get a short TTL here to cut database load. Like the rate limiter, this
 * degrades gracefully: when Upstash credentials are absent the cache is a
 * no-op and callers fall straight through to the database.
 */

const CACHE_KEY_PREFIX = "omnieval:cache";

const instances = new Map<string, Redis>();

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  let redis = instances.get("default");
  if (!redis) {
    redis = Redis.fromEnv();
    instances.set("default", redis);
  }
  return redis;
}

function prefixed(key: string): string {
  return key.startsWith(CACHE_KEY_PREFIX) ? key : `${CACHE_KEY_PREFIX}:${key}`;
}

/** Fetch a cached value. Returns `null` on miss, error, or missing Redis. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.get<T>(prefixed(key))) ?? null;
  } catch (error) {
    console.error(`[cache] get "${key}" failed:`, error);
    return null;
  }
}

/** Store a value with a TTL (seconds). Errors are swallowed — cache is best-effort. */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(prefixed(key), value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[cache] set "${key}" failed:`, error);
  }
}

/** Delete a key. Used when the underlying data changes and must be invalidated. */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(prefixed(key));
  } catch (error) {
    console.error(`[cache] del "${key}" failed:`, error);
  }
}
