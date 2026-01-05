/**
 * Typed Supabase Mock Factories
 *
 * Provides type-safe mock factories for testing Supabase client interactions.
 * All factories return objects that match the database schema types.
 */

import { vi } from 'vitest'
import type { Database, Tables, TablesInsert } from '@/lib/supabase/types'

// Type aliases for commonly used table types
export type AnalyticsEvent = Tables<'analytics_events'>
export type AnalyticsEventInsert = TablesInsert<'analytics_events'>
export type CreditBatch = Tables<'credit_batches'>
export type PaymentTransaction = Tables<'payment_transactions'>
export type PaymentRefund = Tables<'payment_refunds'>
export type RestorationResult = Tables<'restoration_results'>
export type StripeWebhookEvent = Tables<'stripe_webhook_events'>
export type UploadSession = Tables<'upload_sessions'>
export type UserCredits = Tables<'user_credits'>
export type UserQuota = Tables<'user_quota'>

/**
 * Mock factory for analytics events
 */
export function createMockAnalyticsEvent(
  overrides?: Partial<AnalyticsEvent>
): AnalyticsEvent {
  return {
    id: 'evt_' + Math.random().toString(36).substring(7),
    event_type: 'restore_complete',
    session_id: 'session_' + Math.random().toString(36).substring(7),
    ttm_seconds: 5.2,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for user credits
 */
export function createMockUserCredits(
  overrides?: Partial<UserCredits>
): UserCredits {
  return {
    id: 'cred_' + Math.random().toString(36).substring(7),
    user_id: 'user_' + Math.random().toString(36).substring(7),
    fingerprint: 'fp_' + Math.random().toString(36).substring(16),
    available_credits: 10,
    credits_used: 0,
    credits_purchased: 10,
    credits_expired: 0,
    total_credits_purchased: 10,
    stripe_customer_id: null,
    last_purchase_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for upload sessions
 */
export function createMockUploadSession(
  overrides?: Partial<UploadSession>
): UploadSession {
  return {
    id: 'session_' + Math.random().toString(36).substring(7),
    user_fingerprint: 'fp_' + Math.random().toString(36).substring(16),
    original_url: 'https://example.com/original.jpg',
    status: 'complete',
    retry_count: 0,
    created_at: new Date().toISOString(),
    ttl_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for restoration results
 */
export function createMockRestorationResult(
  overrides?: Partial<RestorationResult>
): RestorationResult {
  return {
    id: 'result_' + Math.random().toString(36).substring(7),
    session_id: 'session_' + Math.random().toString(36).substring(7),
    restored_url: 'https://example.com/restored.jpg',
    og_card_url: 'https://example.com/og-card.jpg',
    gif_url: 'https://example.com/comparison.gif',
    deep_link: 'retrophoto://result/abc123',
    watermark_applied: false,
    cdn_cached: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for payment transactions
 */
export function createMockPaymentTransaction(
  overrides?: Partial<PaymentTransaction>
): PaymentTransaction {
  return {
    id: 'tx_' + Math.random().toString(36).substring(7),
    user_id: 'user_' + Math.random().toString(36).substring(7),
    stripe_session_id: 'cs_' + Math.random().toString(36).substring(7),
    stripe_payment_intent_id: 'pi_' + Math.random().toString(36).substring(7),
    stripe_customer_id: 'cus_' + Math.random().toString(36).substring(7),
    amount: 999,
    currency: 'usd',
    credits_purchased: 10,
    status: 'completed',
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for credit batches
 */
export function createMockCreditBatch(
  overrides?: Partial<CreditBatch>
): CreditBatch {
  const purchaseDate = new Date()
  const expirationDate = new Date(purchaseDate)
  expirationDate.setFullYear(expirationDate.getFullYear() + 1)

  return {
    id: 'batch_' + Math.random().toString(36).substring(7),
    user_id: 'user_' + Math.random().toString(36).substring(7),
    transaction_id: 'tx_' + Math.random().toString(36).substring(7),
    credits_purchased: 10,
    credits_remaining: 10,
    purchase_date: purchaseDate.toISOString(),
    expiration_date: expirationDate.toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for stripe webhook events
 */
export function createMockStripeWebhookEvent(
  overrides?: Partial<StripeWebhookEvent>
): StripeWebhookEvent {
  return {
    id: 'whevt_' + Math.random().toString(36).substring(7),
    event_id: 'evt_' + Math.random().toString(36).substring(7),
    event_type: 'checkout.session.completed',
    payload: {},
    processing_status: 'success',
    error_message: null,
    retry_count: 0,
    created_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for user quota
 */
export function createMockUserQuota(overrides?: Partial<UserQuota>): UserQuota {
  return {
    fingerprint: 'fp_' + Math.random().toString(36).substring(16),
    restore_count: 0,
    last_restore_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock factory for payment refunds
 */
export function createMockPaymentRefund(
  overrides?: Partial<PaymentRefund>
): PaymentRefund {
  return {
    id: 'refund_' + Math.random().toString(36).substring(7),
    transaction_id: 'tx_' + Math.random().toString(36).substring(7),
    stripe_refund_id: 're_' + Math.random().toString(36).substring(7),
    amount_refunded: 999,
    currency: 'usd',
    credits_deducted: 10,
    reason: null,
    metadata: null,
    refund_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Creates a typed mock Supabase client for testing
 *
 * @example
 * ```typescript
 * const mockSupabase = createMockSupabaseClient({
 *   from: vi.fn(() => ({
 *     select: vi.fn(() => ({
 *       eq: vi.fn(() => ({ data: [createMockUserCredits()], error: null }))
 *     }))
 *   }))
 * })
 * ```
 */
export function createMockSupabaseClient(overrides?: any) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(),
        neq: vi.fn(),
        gt: vi.fn(),
        gte: vi.fn(),
        lt: vi.fn(),
        lte: vi.fn(),
        like: vi.fn(),
        ilike: vi.fn(),
        is: vi.fn(),
        in: vi.fn(),
        contains: vi.fn(),
        containedBy: vi.fn(),
        rangeGt: vi.fn(),
        rangeGte: vi.fn(),
        rangeLt: vi.fn(),
        rangeLte: vi.fn(),
        rangeAdjacent: vi.fn(),
        overlaps: vi.fn(),
        textSearch: vi.fn(),
        match: vi.fn(),
        not: vi.fn(),
        or: vi.fn(),
        filter: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        range: vi.fn(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
        select: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
      upsert: vi.fn(),
    })),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    ...overrides,
  }
}

/**
 * Creates a mock RPC response for common database functions
 */
export const mockRpcResponses = {
  check_quota: (remaining = 5) => ({
    last_restore_at: new Date().toISOString(),
    limit_value: 5,
    remaining,
    requires_upgrade: remaining === 0,
    upgrade_url: remaining === 0 ? '/pricing' : '',
  }),

  deduct_credit: (newBalance = 9) => ({
    new_balance: newBalance,
    success: true,
  }),

  add_credits: (newBalance = 10, batchId = 'batch_123') => ({
    new_balance: newBalance,
    batch_id: batchId,
  }),

  process_refund: (newBalance = 0, creditsDeducted = 10) => ({
    new_balance: newBalance,
    credits_deducted: creditsDeducted,
  }),

  expire_credits: (expiredCount = 0, totalExpired = 0) => ({
    expired_batches: expiredCount,
    total_credits_expired: totalExpired,
  }),

  get_credit_balance: (balance = 10) => balance,

  consume_credit: (remainingBalance = 9, success = true) => ({
    remaining_balance: remainingBalance,
    success,
  }),
}

/**
 * Helper to create a successful Supabase query response
 */
export function createSuccessResponse<T>(data: T) {
  return { data, error: null }
}

/**
 * Helper to create a failed Supabase query response
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      details: '',
      hint: '',
    },
  }
}
