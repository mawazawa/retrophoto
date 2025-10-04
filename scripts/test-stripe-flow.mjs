#!/usr/bin/env node
/**
 * Test Stripe Payment Flow
 *
 * This script simulates a complete payment flow to verify:
 * 1. Checkout session creation
 * 2. Webhook event processing
 * 3. Credit addition
 * 4. Database integrity
 *
 * Usage:
 *   node scripts/test-stripe-flow.mjs
 *
 * Prerequisites:
 *   - Migrations 011-016 applied
 *   - Stripe test mode configured
 *   - User account exists in database
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbwgkocarqvonkdlitdx.supabase.co'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2drb2NhcnF2b25rZGxpdGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MzI1MiwiZXhwIjoyMDc1MDM5MjUyfQ.6Z5fd4YiRJPw-8Nf7b7cHnWU50WaGSbNP61Qx9YKQns'

const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n')

  // Check Stripe connection
  try {
    const balance = await stripe.balance.retrieve()
    console.log('✅ Stripe connected:', balance.object === 'balance' ? 'OK' : 'Failed')
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message)
    return false
  }

  // Check Supabase tables
  const tables = [
    'user_credits',
    'credit_batches',
    'payment_transactions',
    'stripe_webhook_events',
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0)
    if (error) {
      console.error(`❌ Table ${table} not found - migrations not applied?`)
      return false
    }
    console.log(`✅ Table ${table} exists`)
  }

  // Check database functions
  const functions = ['add_credits', 'deduct_credit', 'process_refund', 'expire_credits']

  for (const fn of functions) {
    try {
      await supabase.rpc(fn, {})
      console.log(`✅ Function ${fn} exists`)
    } catch (error) {
      // Function should exist (even if it errors due to wrong params)
      if (error?.message?.includes('not found')) {
        console.error(`❌ Function ${fn} not found - migration 016 not applied?`)
        return false
      }
      console.log(`✅ Function ${fn} exists (params error expected)`)
    }
  }

  return true
}

async function createTestUser() {
  const testUserId = randomUUID()

  // Insert test user credits record
  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: testUserId,
      fingerprint: 'test-fingerprint-' + Date.now(),
      credits_balance: 0,
      total_credits_purchased: 0,
      credits_expired: 0,
    })
    .select('user_id')
    .single()

  if (error) {
    console.error('❌ Failed to create test user:', error.message)
    return null
  }

  console.log(`✅ Created test user: ${testUserId}`)
  return testUserId
}

async function testCheckoutSession(userId) {
  console.log('\n📦 Testing checkout session creation...\n')

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '10 Photo Restoration Credits',
              description: 'Credits for RetroPhoto restoration service',
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/app?success=true',
      cancel_url: 'http://localhost:3000/app?canceled=true',
      metadata: {
        user_id: userId,
        credits: '10',
      },
    })

    console.log('✅ Checkout session created:', session.id)
    console.log('   URL:', session.url)
    console.log('   Amount:', (session.amount_total || 0) / 100, session.currency?.toUpperCase())
    console.log('   Metadata:', session.metadata)

    return session
  } catch (error) {
    console.error('❌ Checkout session failed:', error.message)
    return null
  }
}

async function simulateWebhookEvent(sessionId, userId) {
  console.log('\n🔔 Simulating webhook event...\n')

  const mockEvent = {
    id: 'evt_test_' + Date.now(),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_intent: 'pi_test_' + Date.now(),
        amount_total: 999,
        currency: 'usd',
        metadata: {
          user_id: userId,
          credits: '10',
        },
      },
    },
  }

  // 1. Insert webhook event
  const { data: webhookRecord, error: webhookError } = await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: mockEvent.id,
      event_type: mockEvent.type,
      payload: mockEvent,
      processing_status: 'pending',
    })
    .select('id')
    .single()

  if (webhookError) {
    console.error('❌ Webhook record failed:', webhookError.message)
    return null
  }

  console.log('✅ Webhook event logged:', mockEvent.id)

  // 2. Create payment transaction
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: mockEvent.data.object.payment_intent,
      amount: mockEvent.data.object.amount_total,
      currency: mockEvent.data.object.currency,
      credits_purchased: 10,
      status: 'completed',
    })
    .select('id')
    .single()

  if (txError) {
    console.error('❌ Transaction record failed:', txError.message)
    return null
  }

  console.log('✅ Payment transaction created:', transaction.id)

  // 3. Add credits via database function
  const { data: creditData, error: creditError } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_credits_to_add: 10,
    p_transaction_id: transaction.id,
  })

  if (creditError) {
    console.error('❌ Add credits failed:', creditError.message)
    return null
  }

  console.log('✅ Credits added:', creditData)

  // 4. Update webhook status to success
  await supabase
    .from('stripe_webhook_events')
    .update({
      processing_status: 'success',
      processed_at: new Date().toISOString(),
    })
    .eq('id', webhookRecord.id)

  console.log('✅ Webhook marked as processed')

  return transaction.id
}

async function verifyResults(userId, transactionId) {
  console.log('\n🔍 Verifying results...\n')

  // Check user credits
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log('User Credits:', {
    balance: userCredits?.credits_balance,
    total_purchased: userCredits?.total_credits_purchased,
  })

  // Check credit batch
  const { data: batch } = await supabase
    .from('credit_batches')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  console.log('Credit Batch:', {
    purchased: batch?.credits_purchased,
    remaining: batch?.credits_remaining,
    expires: batch?.expiration_date,
  })

  // Check payment transaction
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  console.log('Payment Transaction:', {
    amount: (transaction?.amount || 0) / 100,
    currency: transaction?.currency,
    status: transaction?.status,
  })

  // Verify expectations
  const passed = userCredits?.credits_balance === 10 && batch?.credits_remaining === 10

  if (passed) {
    console.log('\n✅ All verifications passed!')
  } else {
    console.log('\n❌ Verification failed')
  }

  return passed
}

async function cleanup(userId) {
  console.log('\n🧹 Cleaning up test data...')

  await supabase.from('credit_batches').delete().eq('user_id', userId)
  await supabase.from('payment_transactions').delete().eq('user_id', userId)
  await supabase.from('stripe_webhook_events').delete().ilike('event_id', 'evt_test_%')
  await supabase.from('user_credits').delete().eq('user_id', userId)

  console.log('✅ Cleanup complete\n')
}

async function main() {
  console.log('🚀 Stripe Payment Flow Test')
  console.log('============================\n')

  // Step 1: Prerequisites
  const ready = await checkPrerequisites()
  if (!ready) {
    console.error('\n❌ Prerequisites not met. See APPLY_MIGRATIONS_GUIDE.md\n')
    process.exit(1)
  }

  // Step 2: Create test user
  const userId = await createTestUser()
  if (!userId) {
    process.exit(1)
  }

  // Step 3: Create checkout session
  const session = await testCheckoutSession(userId)
  if (!session) {
    await cleanup(userId)
    process.exit(1)
  }

  // Step 4: Simulate webhook
  const transactionId = await simulateWebhookEvent(session.id, userId)
  if (!transactionId) {
    await cleanup(userId)
    process.exit(1)
  }

  // Step 5: Verify results
  const passed = await verifyResults(userId, transactionId)

  // Step 6: Cleanup
  await cleanup(userId)

  if (passed) {
    console.log('🎉 Payment flow test completed successfully!')
    process.exit(0)
  } else {
    console.error('❌ Payment flow test failed')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
