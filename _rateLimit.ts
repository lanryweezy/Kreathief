const rateLimits = new Map<string, { count: number; resetTime: number }>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, state] of rateLimits.entries()) {
      if (now > state.resetTime) {
        rateLimits.delete(k);
      }
    }
    lastCleanup = now;
  }

  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/**
 * S-7: Check rate limit by both IP and email for password resets.
 * Callers should check BOTH keys: checkRateLimit('reset:' + ip) AND checkRateLimit('reset:' + email).
 */
export function checkPasswordResetRateLimit(ip: string, email: string): boolean {
  const limit = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  return checkRateLimit(`reset:${ip}`, limit, windowMs) && checkRateLimit(`reset:${email}`, limit, windowMs);
}
