/**
 * Rate limiter using in-memory Map with sliding window.
 * Resets on Vercel cold starts (serverless limitation).
 * For persistent rate limiting, use Supabase-backed implementation.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [key, entry] of rateLimits.entries()) {
      if (now - entry.windowStart > 60000) {
        rateLimits.delete(key);
      }
    }
    lastCleanup = now;
  }
}

/**
 * Check if a request is within rate limit.
 * Uses sliding window counter per key.
 * @param key - Unique identifier (IP, user ID, API key)
 * @param limit - Max requests per window (default 20)
 * @param windowMs - Window duration in ms (default 60s)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  cleanup(now);

  const entry = rateLimits.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get remaining requests for a key.
 */
export function getRemainingRequests(key: string, limit = 20, windowMs = 60000): number {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    return limit;
  }

  return Math.max(0, limit - entry.count);
}
