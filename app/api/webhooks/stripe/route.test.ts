/**
 * Contract Test: POST /api/webhooks/stripe
 * Feature: 002-implement-payment-processing
 * Contract: specs/002-implement-payment-processing/contracts/stripe-webhook.json
 *
 * Tests Stripe webhook signature verification and event processing
 *
 * Note: Environment variables (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.)
 * are set in tests/setup.ts before any modules are loaded.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { NextRequest } from 'next/server'

// Store mock function reference at module level
const mockConstructEvent = vi.fn()

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

// Mock Stripe with hoisted reference
vi.mock('stripe', async () => {
  return {
    default: class MockStripe {
      webhooks = {
        constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
      }
    },
  }
})

// Mock Supabase service role client
const mockSupabaseFrom = vi.fn()
const mockSupabaseRpc = vi.fn()
vi.mock('@/lib/supabase/service-role', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  })),
}))

// Mock email functions
vi.mock('@/lib/email', () => ({
  sendPaymentSuccessEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPaymentFailureEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock logger
vi.mock('@/lib/observability/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Import after mocks are set up
import { POST } from './route'
import { headers } from 'next/headers'
import { sendPaymentSuccessEmail, sendPaymentFailureEmail } from '@/lib/email'
import { logger } from '@/lib/observability/logger'

describe('POST /api/webhooks/stripe', () => {
  const mockHeaders = headers as Mock
  const testWebhookSecret = 'whsec_test_secret'
  const testStripeSignature = 'test_signature_123'

  // Helper to create mock Stripe event
  const createMockEvent = (type: string, data: Record<string, unknown> = {}) => ({
    id: `evt_${Date.now()}`,
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
  })

  // Helper to create request
  const createRequest = (body: string, signature?: string) => {
    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body,
    })
    return request
  }

  // Helper to set up supabase mock chain
  const setupSupabaseMock = (options: {
    selectResult?: { data: unknown; error: unknown }
    insertResult?: { data: unknown; error: unknown }
    updateResult?: { data: unknown; error: unknown }
    rpcResult?: { data: unknown; error: unknown }
  }) => {
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(options.selectResult || { data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue(options.selectResult || { data: null, error: null }),
    }

    // Override specific methods if needed
    if (options.insertResult) {
      chainMock.insert = vi.fn().mockReturnValue({
        ...chainMock,
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(options.insertResult),
        }),
      })
    }

    mockSupabaseFrom.mockReturnValue(chainMock)
    mockSupabaseRpc.mockResolvedValue(options.rpcResult || { data: null, error: null })

    return chainMock
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default header mock returns signature
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === 'stripe-signature') return testStripeSignature
        return null
      }),
    })
  })

  it('should return 200 with received:true for valid checkout.session.completed event', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_test_123',
      client_reference_id: 'user_123',
      customer: 'cus_123',
      payment_intent: 'pi_123',
      amount_total: 999,
      currency: 'usd',
      mode: 'payment',
      payment_status: 'paid',
      customer_details: { email: 'test@example.com' },
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    // Set up successful database operations
    const chainMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    let callCount = 0
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'payment_transactions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'tx_123' }, error: null }),
            }),
          }),
        }
      }
      return chainMock
    })

    mockSupabaseRpc.mockResolvedValue({
      data: { new_balance: 10, batch_id: 'batch_123' },
      error: null,
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('received', true)
    expect(mockConstructEvent).toHaveBeenCalled()
  })

  it('should return 200 with duplicate:true for already processed event (idempotency)', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_test_123',
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    // Mock that event already exists
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'existing_123', processing_status: 'success' },
        error: null,
      }),
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual({ received: true, duplicate: true })
    expect(logger.debug).toHaveBeenCalledWith(
      'Webhook event already processed',
      expect.objectContaining({ eventId: mockEvent.id })
    )
  })

  it('should return 400 with error_code MISSING_SIGNATURE when stripe-signature header missing', async () => {
    // Arrange
    mockHeaders.mockResolvedValue({
      get: vi.fn(() => null), // No signature header
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({
      error: 'Missing signature',
      error_code: 'MISSING_SIGNATURE',
    })
  })

  it('should return 400 with error_code INVALID_SIGNATURE for invalid signature', async () => {
    // Arrange
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data).toEqual({
      error: 'Invalid signature',
      error_code: 'INVALID_SIGNATURE',
    })
    expect(logger.error).toHaveBeenCalledWith(
      'Webhook signature verification failed',
      expect.objectContaining({ error: 'Signature verification failed' })
    )
  })

  it('should create credit_batches record on successful payment', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_test_credit_batch',
      client_reference_id: 'user_456',
      customer: 'cus_456',
      payment_intent: 'pi_456',
      amount_total: 999,
      currency: 'usd',
      mode: 'payment',
      payment_status: 'paid',
      customer_details: { email: 'credits@example.com' },
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'payment_transactions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'tx_456' }, error: null }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    mockSupabaseRpc.mockResolvedValue({
      data: { new_balance: 10, batch_id: 'batch_credit_123' },
      error: null,
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    // Verify add_credits RPC was called (which creates credit batch)
    expect(mockSupabaseRpc).toHaveBeenCalledWith('add_credits', {
      p_user_id: 'user_456',
      p_credits_to_add: 10,
      p_transaction_id: 'tx_456',
    })
    expect(logger.info).toHaveBeenCalledWith(
      'Payment processed successfully',
      expect.objectContaining({
        userId: 'user_456',
        creditsAdded: 10,
        batchId: 'batch_credit_123',
      })
    )
  })

  it('should create payment_transactions record on checkout completion', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_test_tx_record',
      client_reference_id: 'user_789',
      customer: 'cus_789',
      payment_intent: 'pi_789',
      amount_total: 1999,
      currency: 'usd',
      mode: 'payment',
      payment_status: 'paid',
      customer_details: { email: 'tx@example.com' },
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    let insertedTransaction: Record<string, unknown> | null = null
    const mockTransactionInsert = vi.fn().mockImplementation((data) => {
      insertedTransaction = data
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'tx_789' }, error: null }),
        }),
      }
    })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'payment_transactions') {
        return { insert: mockTransactionInsert }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    mockSupabaseRpc.mockResolvedValue({
      data: { new_balance: 10, batch_id: 'batch_tx' },
      error: null,
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockTransactionInsert).toHaveBeenCalledWith({
      user_id: 'user_789',
      stripe_session_id: 'cs_test_tx_record',
      stripe_payment_intent_id: 'pi_789',
      stripe_customer_id: 'cus_789',
      amount: 1999,
      currency: 'usd',
      credits_purchased: 10,
      status: 'completed',
      metadata: {
        mode: 'payment',
        payment_status: 'paid',
      },
    })
  })

  it('should log webhook event to stripe_webhook_events table', async () => {
    // Arrange
    const mockEvent = createMockEvent('payment_intent.succeeded', {
      id: 'pi_log_test',
      amount: 999,
      customer: 'cus_log',
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    let insertedEvent: Record<string, unknown> | null = null
    const mockWebhookInsert = vi.fn().mockImplementation((data) => {
      insertedEvent = data
      return {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: mockWebhookInsert,
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockWebhookInsert).toHaveBeenCalledWith({
      event_id: mockEvent.id,
      event_type: 'payment_intent.succeeded',
      payload: mockEvent,
      processing_status: 'pending',
    })
  })

  it('should handle charge.refunded event and deduct credits', async () => {
    // Arrange
    const mockEvent = createMockEvent('charge.refunded', {
      id: 'ch_refund_test',
      payment_intent: 'pi_refund',
      amount_refunded: 999,
      currency: 'usd',
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'payment_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'tx_to_refund' }],
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    mockSupabaseRpc.mockResolvedValue({
      data: { new_balance: 5, credits_deducted: 5 },
      error: null,
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockSupabaseRpc).toHaveBeenCalledWith('process_refund', {
      p_transaction_id: 'tx_to_refund',
      p_stripe_refund_id: 'ch_refund_test',
      p_amount_refunded: 999,
      p_currency: 'usd',
    })
    expect(logger.info).toHaveBeenCalledWith(
      'Refund processed successfully',
      expect.objectContaining({
        transactionId: 'tx_to_refund',
        creditsDeducted: 5,
      })
    )
  })

  it('should send payment success email on checkout completion', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_email_test',
      client_reference_id: 'user_email',
      customer: 'cus_email',
      payment_intent: 'pi_email',
      amount_total: 999,
      currency: 'usd',
      mode: 'payment',
      payment_status: 'paid',
      customer_details: { email: 'success@example.com' },
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'payment_transactions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'tx_email' }, error: null }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    mockSupabaseRpc.mockResolvedValue({
      data: { new_balance: 10, batch_id: 'batch_email' },
      error: null,
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(sendPaymentSuccessEmail).toHaveBeenCalledWith(
      'success@example.com',
      999,
      10,
      'tx_email'
    )
  })

  it('should send payment failure email on payment_intent.payment_failed', async () => {
    // Arrange
    const mockEvent = createMockEvent('payment_intent.payment_failed', {
      id: 'pi_failed_test',
      receipt_email: 'failed@example.com',
      last_payment_error: { message: 'Card declined' },
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(sendPaymentFailureEmail).toHaveBeenCalledWith('failed@example.com', 'Card declined')
    expect(logger.error).toHaveBeenCalledWith(
      'Payment intent failed',
      expect.objectContaining({
        paymentIntentId: 'pi_failed_test',
        lastError: 'Card declined',
      })
    )
  })

  it('should return 500 when audit log insertion fails (fail-closed)', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_audit_fail',
      client_reference_id: 'user_audit',
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST500', message: 'Database error' },
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Failed to log webhook event',
      error_code: 'AUDIT_LOG_FAILED',
    })
  })

  it('should mark event as duplicate when unique constraint is violated', async () => {
    // Arrange
    const mockEvent = createMockEvent('checkout.session.completed', {
      id: 'cs_unique_violation',
    })
    mockConstructEvent.mockReturnValue(mockEvent)

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'Unique constraint violation' },
          }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const request = createRequest('{"test": "body"}')

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual({ received: true, duplicate: true })
  })
})
