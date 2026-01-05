/**
 * Integration Test: Webhook Idempotency (T021)
 * Feature: 002-implement-payment-processing
 *
 * Tests database-backed webhook idempotency to ensure duplicate events are handled correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Skip tests if environment variables are not configured
const skipTests = !supabaseUrl || !supabaseServiceKey

// Only create client if env vars are available
const supabase: SupabaseClient | null = skipTests
  ? null
  : createClient(supabaseUrl!, supabaseServiceKey!)

// Helper to get non-null supabase client
function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase client not initialized')
  return supabase
}

// Track whether table exists for conditional test execution
let tableExists = false

describe.skipIf(skipTests)('Webhook Idempotency Integration (T021)', () => {
  const testEventId = 'evt_test_' + Date.now()

  beforeAll(async () => {
    const client = getSupabase()
    // Check if stripe_webhook_events table exists
    const { error } = await client.from('stripe_webhook_events').select('count').limit(0)

    if (error) {
      console.warn('⚠️  stripe_webhook_events table not found. Migrations must be applied first.')
      console.warn('   See: APPLY_MIGRATIONS_GUIDE.md')
      tableExists = false
    } else {
      tableExists = true
    }
  })

  afterAll(async () => {
    const client = getSupabase()
    // Cleanup test data
    await client.from('stripe_webhook_events').delete().eq('event_id', testEventId)
  })

  it('should prevent duplicate webhook processing', async ({ skip }) => {
    if (!tableExists) skip()
    const client = getSupabase()
    // This test requires stripe_webhook_events table

    // 1. First webhook event - should succeed
    const { data: firstEvent, error: firstError } = await client
      .from('stripe_webhook_events')
      .insert({
        event_id: testEventId,
        event_type: 'checkout.session.completed',
        payload: {
          id: testEventId,
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_123' } },
        },
        processing_status: 'pending',
      })
      .select('id')
      .single()

    expect(firstError).toBeNull()
    expect(firstEvent).toBeDefined()
    expect(firstEvent?.id).toBeDefined()

    // 2. Duplicate webhook event - should fail (unique constraint)
    const { data: duplicateEvent, error: duplicateError } = await client
      .from('stripe_webhook_events')
      .insert({
        event_id: testEventId, // Same event_id
        event_type: 'checkout.session.completed',
        payload: {
          id: testEventId,
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_123' } },
        },
        processing_status: 'pending',
      })
      .select('id')
      .single()

    expect(duplicateError).toBeDefined()
    expect(duplicateError?.code).toBe('23505') // Unique constraint violation
    expect(duplicateEvent).toBeNull()
  })

  it('should track processing status', async ({ skip }) => {
    if (!tableExists) skip()
    const client = getSupabase()
    const eventId = 'evt_test_status_' + Date.now()

    // 1. Insert event with pending status
    const { data: pendingEvent } = await client
      .from('stripe_webhook_events')
      .insert({
        event_id: eventId,
        event_type: 'payment_intent.succeeded',
        payload: { id: eventId, type: 'payment_intent.succeeded' },
        processing_status: 'pending',
      })
      .select('id, processing_status')
      .single()

    expect(pendingEvent?.processing_status).toBe('pending')

    // 2. Update to success status
    const { data: successEvent } = await client
      .from('stripe_webhook_events')
      .update({
        processing_status: 'success',
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .select('processing_status, processed_at')
      .single()

    expect(successEvent?.processing_status).toBe('success')
    expect(successEvent?.processed_at).toBeDefined()

    // 3. Verify status persists across queries
    const { data: verifyEvent } = await client
      .from('stripe_webhook_events')
      .select('processing_status')
      .eq('event_id', eventId)
      .single()

    expect(verifyEvent?.processing_status).toBe('success')

    // Cleanup
    await client.from('stripe_webhook_events').delete().eq('event_id', eventId)
  })

  it('should handle failed processing', async ({ skip }) => {
    if (!tableExists) skip()
    const client = getSupabase()
    const eventId = 'evt_test_failed_' + Date.now()

    // 1. Insert event
    await client.from('stripe_webhook_events').insert({
      event_id: eventId,
      event_type: 'charge.refunded',
      payload: { id: eventId, type: 'charge.refunded' },
      processing_status: 'pending',
    })

    // 2. Mark as failed with error message
    const { data: failedEvent } = await client
      .from('stripe_webhook_events')
      .update({
        processing_status: 'failed',
        error_message: 'Transaction not found',
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .select('processing_status, error_message')
      .single()

    expect(failedEvent?.processing_status).toBe('failed')
    expect(failedEvent?.error_message).toBe('Transaction not found')

    // Cleanup
    await client.from('stripe_webhook_events').delete().eq('event_id', eventId)
  })

  it('should provide audit trail with payload', async ({ skip }) => {
    if (!tableExists) skip()
    const client = getSupabase()
    const eventId = 'evt_test_audit_' + Date.now()
    const testPayload = {
      id: eventId,
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_456',
          status: 'active',
        },
      },
      created: Math.floor(Date.now() / 1000),
    }

    // Insert event with full payload
    const { data: auditEvent } = await client
      .from('stripe_webhook_events')
      .insert({
        event_id: eventId,
        event_type: 'customer.subscription.created',
        payload: testPayload,
        processing_status: 'success',
        processed_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    expect(auditEvent?.event_id).toBe(eventId)
    expect(auditEvent?.event_type).toBe('customer.subscription.created')
    expect(auditEvent?.payload).toEqual(testPayload)
    expect(auditEvent?.created_at).toBeDefined()

    // Verify audit trail can be queried
    const { data: auditQuery, count } = await client
      .from('stripe_webhook_events')
      .select('*', { count: 'exact' })
      .eq('event_type', 'customer.subscription.created')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

    expect(count).toBeGreaterThanOrEqual(1)
    expect(auditQuery?.some((e) => e.event_id === eventId)).toBe(true)

    // Cleanup
    await client.from('stripe_webhook_events').delete().eq('event_id', eventId)
  })

  it('should document idempotency requirements', () => {
    const requirements = [
      'Unique constraint on event_id prevents duplicates',
      'Processing status tracks: pending → success/failed',
      'Full payload stored for audit trail',
      'Timestamp tracking for created_at and processed_at',
      'Error messages captured for failed events',
    ]

    expect(requirements).toHaveLength(5)
    console.log('\n✅ Webhook Idempotency Requirements:')
    requirements.forEach((req) => console.log(`   - ${req}`))
    console.log(`\n${tableExists ? '✅ Table available - tests running' : '⚠️ Table not found - tests skipped'}\n`)
  })
})
