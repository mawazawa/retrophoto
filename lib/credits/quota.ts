/**
 * Credit-based quota system
 * Uses FIFO credit deduction from credit_batches
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'

/**
 * Check if user has available credits
 * @param userId - User ID from auth
 * @returns true if user has credits available
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('available_credits')
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" which means user has no credit record yet
  if (error && error.code !== 'PGRST116') {
    // Log actual database errors for debugging
    logger.error('Failed to check credits', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'credits',
    })
  }

  if (error || !data) {
    // No credit record or error means 0 credits (fail-closed)
    return false
  }

  return data.available_credits > 0
}

/**
 * Deduct one credit using FIFO (oldest batch first)
 * @param userId - User ID from auth
 * @returns Object with success status and remaining balance
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
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    batchId: (data as any)?.batch_id,
    remainingInBatch: (data as any)?.remaining_in_batch,
  }
}

/**
 * Get user's current credit balance
 * @param userId - User ID from auth
 * @returns Credit balance (can be negative after refund)
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('available_credits')
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" which means user has no credit record yet
  if (error && error.code !== 'PGRST116') {
    // Log actual database errors for debugging
    logger.error('Failed to get credit balance', {
      userId,
      error: error.message,
      code: error.code,
      operation: 'credits',
    })
  }

  if (error || !data) {
    return 0
  }

  return data.available_credits
}

/**
 * Check if user is authenticated (has userId)
 * If not, fall back to fingerprint-based quota
 */
export async function checkAuthOrFallback(): Promise<{
  isAuthenticated: boolean
  userId?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    isAuthenticated: !!user,
    userId: user?.id,
  }
}
