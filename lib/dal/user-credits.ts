/**
 * Data Access Layer: User Credits
 *
 * Centralized data access for credit operations with authorization checks.
 * Uses FIFO credit deduction from credit_batches.
 *
 * Following Next.js 15 best practices for server-side data access:
 * - All functions are server-only
 * - Proper error handling with fail-closed security
 * - Typed return values
 * - Structured logging
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'
import type { Database } from '@/lib/supabase/types'

type UserCreditsRow = Database['public']['Tables']['user_credits']['Row']

/**
 * Get user's current credit balance
 *
 * @param userId - User ID from authenticated session
 * @returns Credit balance (0 if no record exists)
 * @throws Error if database query fails (excluding PGRST116)
 *
 * @example
 * const credits = await getCredits(user.id)
 * console.log(`User has ${credits} credits available`)
 */
export async function getCredits(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('available_credits')
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" - user has no credit record yet (expected for new users)
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get user credits', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'dal.getCredits',
    })
    throw new Error(`Failed to get credits: ${error.message}`)
  }

  if (error || !data) {
    // No credit record means 0 credits (fail-closed)
    return 0
  }

  return data.available_credits
}

/**
 * Check if user has available credits
 *
 * @param userId - User ID from authenticated session
 * @returns true if user has at least 1 credit available
 *
 * @example
 * const canRestore = await hasCredits(user.id)
 * if (!canRestore) {
 *   return { error: 'Insufficient credits' }
 * }
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('available_credits')
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" - user has no credit record yet
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to check user credits', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'dal.hasCredits',
    })
    // Fail-closed: deny access on error
    return false
  }

  if (error || !data) {
    // No credit record or error means 0 credits (fail-closed)
    return false
  }

  return data.available_credits > 0
}

/**
 * Deduct one credit using FIFO (oldest batch first)
 *
 * Uses the `deduct_credit` database function which:
 * - Finds oldest unexpired credit batch
 * - Deducts 1 credit from batch
 * - Updates user_credits.available_credits
 * - Returns batch info
 *
 * @param userId - User ID from authenticated session
 * @returns Result with success status and batch info
 *
 * @example
 * const result = await deductCredit(user.id)
 * if (!result.success) {
 *   return { error: result.error, error_code: 'CREDIT_DEDUCTION_FAILED' }
 * }
 */
export async function deductCredit(userId: string): Promise<{
  success: boolean
  error?: string
  batchId?: string
  remainingInBatch?: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id: userId,
  })

  if (error) {
    logger.error('Failed to deduct credit', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'dal.deductCredit',
    })
    return {
      success: false,
      error: error.message,
    }
  }

  // RPC returns JSON with batch info
  const result = data as any

  return {
    success: true,
    batchId: result?.batch_id,
    remainingInBatch: result?.remaining_in_batch,
  }
}

/**
 * Get detailed credit information for a user
 *
 * @param userId - User ID from authenticated session
 * @returns Full credit record or null if not found
 *
 * @example
 * const creditInfo = await getCreditDetails(user.id)
 * if (creditInfo) {
 *   console.log(`Total purchased: ${creditInfo.total_credits_purchased}`)
 *   console.log(`Available: ${creditInfo.available_credits}`)
 * }
 */
export async function getCreditDetails(
  userId: string
): Promise<UserCreditsRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" - expected for new users
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get credit details', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'dal.getCreditDetails',
    })
    throw new Error(`Failed to get credit details: ${error.message}`)
  }

  return data || null
}
