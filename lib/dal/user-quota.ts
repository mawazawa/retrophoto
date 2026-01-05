/**
 * Data Access Layer: User Quota
 *
 * Centralized data access for free tier quota operations.
 * Tracks anonymous users via browser fingerprint.
 *
 * Following Next.js 15 best practices:
 * - Server-only data access
 * - Fail-closed security (deny on error)
 * - Proper error handling
 * - Structured logging
 *
 * Constitutional requirement: Fail-closed quota checks
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'
import type { Database } from '@/lib/supabase/types'

type UserQuotaRow = Database['public']['Tables']['user_quota']['Row']
type CheckQuotaResult = Database['public']['Functions']['check_quota']['Returns'][number]

/**
 * Check if user has remaining free tier quota
 *
 * Uses the `check_quota` database function which:
 * - Returns current usage and remaining quota
 * - Includes limit information
 * - Handles first-time users automatically
 *
 * Security: Fail-closed - denies access if quota data is unavailable
 *
 * @param fingerprint - Browser fingerprint from client
 * @returns true if user has remaining quota
 * @throws Error if quota data unavailable (security requirement)
 *
 * @example
 * const hasQuota = await checkQuota(fingerprint)
 * if (!hasQuota) {
 *   return { error: 'Free tier quota exceeded', error_code: 'QUOTA_EXCEEDED' }
 * }
 */
export async function checkQuota(fingerprint: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_quota', {
    user_fingerprint: fingerprint,
  })

  if (error) {
    logger.error('Quota check failed', {
      fingerprint,
      error: error.message,
      code: error.code,
      operation: 'dal.checkQuota',
    })
    throw new Error(`Quota check failed: ${error.message}`)
  }

  // Function returns array with one result
  const result = data?.[0] as CheckQuotaResult | undefined

  // Fail closed: deny access if no quota data returned (security)
  // This prevents bypassing quota limits when DB fails or returns unexpected data
  if (!result) {
    logger.error('Quota data not available - failing closed', {
      fingerprint,
      operation: 'dal.checkQuota',
    })
    throw new Error('Quota data not available - denying access for security')
  }

  const hasRemaining = result.remaining > 0

  logger.debug('Quota check completed', {
    fingerprint,
    remaining: result.remaining,
    limit: result.limit_value,
    hasRemaining,
    operation: 'dal.checkQuota',
  })

  return hasRemaining
}

/**
 * Get detailed quota information for a fingerprint
 *
 * @param fingerprint - Browser fingerprint from client
 * @returns Quota details including usage and limits
 * @throws Error if quota check fails
 *
 * @example
 * const quotaInfo = await getQuotaDetails(fingerprint)
 * console.log(`Used ${quotaInfo.remaining} of ${quotaInfo.limit_value}`)
 */
export async function getQuotaDetails(
  fingerprint: string
): Promise<CheckQuotaResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_quota', {
    user_fingerprint: fingerprint,
  })

  if (error) {
    logger.error('Failed to get quota details', {
      fingerprint,
      error: error.message,
      code: error.code,
      operation: 'dal.getQuotaDetails',
    })
    throw new Error(`Failed to get quota details: ${error.message}`)
  }

  const result = data?.[0] as CheckQuotaResult | undefined

  if (!result) {
    throw new Error('Quota data not available')
  }

  return result
}

/**
 * Increment quota usage for a fingerprint
 *
 * Creates new quota record for first-time users or updates existing record.
 * Should be called AFTER successful restoration to track usage.
 *
 * @param fingerprint - Browser fingerprint from client
 * @throws Error if database operation fails
 *
 * @example
 * // After successful restoration
 * await incrementQuota(fingerprint)
 */
export async function incrementQuota(fingerprint: string): Promise<void> {
  const supabase = await createClient()

  // Get existing quota or create new one, then increment
  const { data: existing, error: fetchError } = await supabase
    .from('user_quota')
    .select('fingerprint, restore_count')
    .eq('fingerprint', fingerprint)
    .single()

  // PGRST116 = "no rows returned" which is expected for new users
  // Any other error is a real database error that should be thrown
  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('Failed to fetch quota record', {
      fingerprint,
      error: fetchError.message,
      code: fetchError.code,
      operation: 'dal.incrementQuota',
    })
    throw new Error(`Failed to fetch quota: ${fetchError.message}`)
  }

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('user_quota')
      .update({
        restore_count: existing.restore_count + 1,
        last_restore_at: new Date().toISOString(),
      })
      .eq('fingerprint', fingerprint)

    if (error) {
      logger.error('Failed to update quota', {
        fingerprint,
        error: error.message,
        code: error.code,
        operation: 'dal.incrementQuota',
      })
      throw new Error(`Failed to update quota: ${error.message}`)
    }

    logger.debug('Quota incremented', {
      fingerprint,
      newCount: existing.restore_count + 1,
      operation: 'dal.incrementQuota',
    })
  } else {
    // Create new record for first-time user
    const { error } = await supabase.from('user_quota').insert({
      fingerprint,
      restore_count: 1,
      last_restore_at: new Date().toISOString(),
    })

    if (error) {
      logger.error('Failed to create quota record', {
        fingerprint,
        error: error.message,
        code: error.code,
        operation: 'dal.incrementQuota',
      })
      throw new Error(`Failed to create quota: ${error.message}`)
    }

    logger.debug('Quota record created', {
      fingerprint,
      operation: 'dal.incrementQuota',
    })
  }
}

/**
 * Get raw quota record for a fingerprint
 *
 * @param fingerprint - Browser fingerprint from client
 * @returns Quota record or null if not found
 *
 * @example
 * const quota = await getQuotaRecord(fingerprint)
 * if (quota) {
 *   console.log(`User has restored ${quota.restore_count} times`)
 * }
 */
export async function getQuotaRecord(
  fingerprint: string
): Promise<UserQuotaRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_quota')
    .select('*')
    .eq('fingerprint', fingerprint)
    .single()

  // PGRST116 = "no rows returned" - expected for new users
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get quota record', {
      fingerprint,
      error: error.message,
      code: error.code,
      operation: 'dal.getQuotaRecord',
    })
    throw new Error(`Failed to get quota record: ${error.message}`)
  }

  return data || null
}
