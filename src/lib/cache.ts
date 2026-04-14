import { Redis } from "@upstash/redis";

// Singleton Redis client (connection via HTTP REST — serverless-friendly)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Default TTL: 5 minutes (in seconds)
const DEFAULT_TTL = 60 * 5;

/**
 * Cache key builder — ensures consistent, namespaced keys.
 * Examples:
 *   cacheKey("workspaces", userId)         → "workspaces:abc-123"
 *   cacheKey("tasks", userId, workspaceId) → "tasks:abc-123:ws-456"
 *   cacheKey("workspace", userId, wsId)    → "workspace:abc-123:ws-456"
 */
export function cacheKey(...parts: string[]): string {
  return parts.join(":");
}

/**
 * Fetch data from cache or execute the fetcher if cache miss.
 * Uses a stale-while-revalidate-like pattern:
 *   - On HIT: returns cached data immediately
 *   - On MISS: executes fetcher, caches result, then returns
 *
 * @param key - The cache key
 * @param fetcher - Async function that fetches fresh data
 * @param ttl - Time-to-live in seconds (default: 5 min)
 * @param tags - Optional tags to associate with this key (for group invalidation)
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
  tags?: string[],
): Promise<T> {
  try {
    // Try to get from cache
    const cachedData = await redis.get<T>(key);

    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }
  } catch (error) {
    // If Redis fails, fall through to fetcher (graceful degradation)
    console.warn("[Cache] Redis read error, falling back to DB:", error);
  }

  // Cache miss — fetch fresh data
  const freshData = await fetcher();

  try {
    // Store in cache with TTL
    await redis.set(key, JSON.stringify(freshData), { ex: ttl });

    // Register key under tags for group invalidation
    if (tags?.length) {
      const pipeline = redis.pipeline();
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, key);
        // Tags expire after 24h to prevent stale tag entries
        pipeline.expire(`tag:${tag}`, 60 * 60 * 24);
      }
      await pipeline.exec();
    }
  } catch (error) {
    console.warn("[Cache] Redis write error:", error);
  }

  return freshData;
}

/**
 * Invalidate specific cache keys.
 * Use after mutations (create/update/delete).
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn("[Cache] Redis invalidation error:", error);
  }
}

/**
 * Invalidate all cache keys associated with a tag.
 * Example: invalidateTag("user:abc-123") will clear all cached data for that user.
 */
export async function invalidateTag(tag: string): Promise<void> {
  try {
    const tagKey = `tag:${tag}`;
    const keys = await redis.smembers(tagKey);

    if (keys.length > 0) {
      await redis.del(...keys, tagKey);
    }
  } catch (error) {
    console.warn("[Cache] Redis tag invalidation error:", error);
  }
}

export { redis };
