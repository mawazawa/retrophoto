/**
 * Credit-based quota system
 * Uses FIFO credit deduction from credit_batches
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Check if user has available credits
 * @param userId - User ID from auth
 * @returns true if user has credits available
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_balance')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // No credit record means 0 credits
    return false
  }

  return data.credits_balance > 0
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
    .select('credits_balance')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return 0
  }

  return data.credits_balance
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
