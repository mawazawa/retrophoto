/**
 * Rate Limiting Utility
 *
 * Simple in-memory sliding window rate limiter.
 * Can be upgraded to Redis/Upstash for distributed rate limiting.
 *
 * NOTE: This is per-process rate limiting. In serverless environments,
 * each function invocation may have its own store. For production,
 * consider using Redis/Upstash for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Track last cleanup time to avoid excessive cleanup operations
let lastCleanupTime = Date.now()
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute

/**
 * Lazy cleanup of expired entries (called during rate limit checks)
 * This avoids setInterval which causes memory leaks in serverless environments
 */
function lazyCleanup(): void {
  const now = Date.now()

  // Only cleanup once per minute to avoid performance overhead
  if (now - lastCleanupTime < CLEANUP_INTERVAL) {
    return
  }

  lastCleanupTime = now

  // Remove expired entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Identifier prefix (e.g., 'restore', 'checkout') */
  prefix: string
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of remaining requests in the window */
  remaining: number
  /** Total limit for the window */
  limit: number
  /** Time (in seconds) until the rate limit resets */
  resetInSeconds: number
}

/**
 * Check and consume rate limit for a given identifier
 *
 * @param identifier - Unique identifier (fingerprint, IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Lazy cleanup to prevent memory buildup
  lazyCleanup()

  const key = `${config.prefix}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000

  const entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })

    return {
      allowed: true,
      remaining: config.limit - 1,
      limit: config.limit,
      resetInSeconds: config.windowSeconds,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000)

    return {
      allowed: false,
      remaining: 0,
      limit: config.limit,
      resetInSeconds,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    limit: config.limit,
    resetInSeconds: Math.ceil((entry.resetTime - now) / 1000),
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // /api/restore - 5 requests per minute per fingerprint
  restore: {
    limit: 5,
    windowSeconds: 60,
    prefix: 'restore',
  } as RateLimitConfig,

  // /api/quota - 30 requests per minute per fingerprint
  quota: {
    limit: 30,
    windowSeconds: 60,
    prefix: 'quota',
  } as RateLimitConfig,

  // /api/create-checkout-session - 10 requests per minute per fingerprint
  checkout: {
    limit: 10,
    windowSeconds: 60,
    prefix: 'checkout',
  } as RateLimitConfig,

  // /api/analytics - 60 requests per minute per fingerprint
  analytics: {
    limit: 60,
    windowSeconds: 60,
    prefix: 'analytics',
  } as RateLimitConfig,
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetInSeconds.toString(),
  }
}

/**
 * Create a rate limited response
 */
export function rateLimitedResponse(result: RateLimitResult) {
  return {
    error: `Rate limit exceeded. Try again in ${result.resetInSeconds} seconds.`,
    error_code: 'RATE_LIMITED',
    retry_after: result.resetInSeconds,
  }
}
