/**
 * Upstash Redis Rate Limiting
 *
 * Distributed rate limiting using Upstash Redis with sliding window algorithm.
 * Provides consistent rate limiting across serverless function invocations.
 *
 * Requires environment variables:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import type { RateLimitConfig, RateLimitResult } from './index'
import { logger } from '@/lib/observability/logger'

// Initialize Redis client (lazy loaded on first use)
let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'Missing Upstash Redis credentials: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
      )
    }

    redis = new Redis({
      url,
      token,
    })
  }

  return redis
}

// Cache rate limiters by config key to avoid recreating them
const rateLimiters = new Map<string, Ratelimit>()

/**
 * Get or create a rate limiter for a specific configuration
 */
function getRateLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.prefix}:${config.limit}:${config.windowSeconds}`

  if (!rateLimiters.has(cacheKey)) {
    const client = getRedisClient()

    const limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      analytics: true, // Enable analytics for insights
      prefix: config.prefix,
    })

    rateLimiters.set(cacheKey, limiter)
  }

  return rateLimiters.get(cacheKey)!
}

/**
 * Check and consume rate limit using Upstash Redis
 *
 * @param identifier - Unique identifier (fingerprint, IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimitUpstash(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const limiter = getRateLimiter(config)
    const result = await limiter.limit(identifier)

    // Convert Upstash result to our interface
    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      resetInSeconds: Math.ceil((result.reset - Date.now()) / 1000),
    }
  } catch (error) {
    // Log error but don't throw - this allows graceful fallback
    logger.error('Upstash rate limit error', {
      error: error instanceof Error ? error.message : String(error)
    })

    // Re-throw to allow fallback to in-memory
    throw error
  }
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisAvailable(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

/**
 * Get analytics for a specific prefix (useful for monitoring)
 */
export async function getRateLimitAnalytics(prefix: string): Promise<unknown> {
  try {
    const client = getRedisClient()
    // Fetch analytics data for the prefix
    const pattern = `${prefix}:*`
    const keys = await client.keys(pattern)
    return { prefix, keyCount: keys.length }
  } catch (error) {
    logger.error('Failed to fetch rate limit analytics', {
      prefix,
      error: error instanceof Error ? error.message : String(error)
    })
    return { prefix, keyCount: 0, error: String(error) }
  }
}
