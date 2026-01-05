/**
 * Rate Limiting Utility
 *
 * Hybrid rate limiting system with automatic fallback:
 * - Uses Upstash Redis for distributed rate limiting when available
 * - Falls back to in-memory limiting when Redis is not configured
 *
 * Redis is used when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * environment variables are set.
 *
 * NOTE: In-memory limiting is per-process and resets on serverless cold starts.
 * For production deployments, configure Upstash Redis for consistent rate limiting.
 */

import { logger } from '@/lib/observability/logger'

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
 * In-memory rate limit implementation (fallback)
 */
function checkRateLimitInMemory(
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
 * Check and consume rate limit for a given identifier
 *
 * Automatically uses Redis if available, otherwise falls back to in-memory.
 *
 * @param identifier - Unique identifier (fingerprint, IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result (Promise if using Redis, sync if in-memory)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Check if Redis is available and feature flag is enabled
  const useRedis =
    process.env.USE_REDIS_RATE_LIMIT !== 'false' && // Allow disabling via flag
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN

  if (useRedis) {
    try {
      // Lazy import to avoid loading Redis client when not needed
      const { checkRateLimitUpstash } = await import('./upstash')
      return await checkRateLimitUpstash(identifier, config)
    } catch (error) {
      // Log error and fallback to in-memory
      logger.warn('Redis rate limit check failed, falling back to in-memory', {
        error: error instanceof Error ? error.message : String(error)
      })
      return checkRateLimitInMemory(identifier, config)
    }
  }

  // Use in-memory rate limiting
  return checkRateLimitInMemory(identifier, config)
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
