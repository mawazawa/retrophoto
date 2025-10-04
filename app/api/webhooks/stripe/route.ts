import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

// Use service role key for webhook handler (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: Request) {
  let event: Stripe.Event | undefined

  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured', error_code: 'STRIPE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured', error_code: 'SUPABASE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature', error_code: 'MISSING_SIGNATURE' },
        { status: 400 }
      )
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature', error_code: 'INVALID_SIGNATURE' },
        { status: 400 }
      )
    }

    // Database-backed idempotency check
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('id, processing_status')
      .eq('event_id', event.id)
      .single()

    if (existingEvent) {
      console.log(`Event ${event.id} already processed (status: ${existingEvent.processing_status})`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Log webhook event for idempotency and audit
    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event as any,
        processing_status: 'pending',
      })

    if (insertError) {
      // If insert fails due to unique constraint, event is duplicate
      if (insertError.code === '23505') {
        console.log(`Event ${event.id} duplicate detected via DB constraint`)
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.error('Error logging webhook event:', insertError)
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout completed:', {
          sessionId: session.id,
          userId: session.client_reference_id,
          customerId: session.customer,
          amountTotal: session.amount_total,
        })

        if (!session.client_reference_id) {
          console.warn('No user ID in checkout session')
          break
        }

        const creditsToAdd = 10
        const userId = session.client_reference_id

        // Create payment transaction record
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_customer_id: session.customer as string,
            amount: session.amount_total!,
            currency: session.currency!,
            credits_purchased: creditsToAdd,
            status: 'completed',
            metadata: {
              mode: session.mode,
              payment_status: session.payment_status,
            },
          })
          .select('id')
          .single()

        if (txError) {
          console.error('Error creating transaction:', txError)
          throw new Error(`Failed to create transaction: ${txError.message}`)
        }

        // Add credits with batch tracking
        const { data: creditData, error: creditError } = await supabase.rpc('add_credits', {
          p_user_id: userId,
          p_credits_to_add: creditsToAdd,
          p_transaction_id: transaction.id,
        })

        if (creditError) {
          console.error('Error adding credits:', creditError)
          throw new Error(`Failed to add credits: ${creditError.message}`)
        }

        console.log('Payment processed successfully:', {
          userId,
          transactionId: transaction.id,
          creditsAdded: creditsToAdd,
          newBalance: creditData?.new_balance,
          batchId: creditData?.batch_id,
        })

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('Payment intent succeeded:', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          customerId: paymentIntent.customer,
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.error('Payment intent failed:', {
          paymentIntentId: paymentIntent.id,
          lastError: paymentIntent.last_payment_error,
        })

        // TODO: Send payment failure notification to user

        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription created:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription cancelled:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Invoice payment succeeded:', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          customerId: invoice.customer,
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Invoice payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        })

        // TODO: Send payment failure notification to user

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        console.log('Charge refunded:', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          paymentIntent: charge.payment_intent,
        })

        // Find transaction by payment intent or charge ID
        const { data: transactions } = await supabase
          .from('payment_transactions')
          .select('id')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .limit(1)

        if (transactions && transactions.length > 0) {
          const transactionId = transactions[0].id

          // Process refund using database function
          const { data: refundData, error: refundError } = await supabase.rpc('process_refund', {
            p_transaction_id: transactionId,
            p_stripe_refund_id: charge.id,
            p_amount_refunded: charge.amount_refunded,
            p_currency: charge.currency,
          })

          if (refundError) {
            console.error('Error processing refund:', refundError)
            throw new Error(`Failed to process refund: ${refundError.message}`)
          }

          console.log('Refund processed successfully:', {
            transactionId,
            newBalance: refundData?.new_balance,
            creditsDeducted: refundData?.credits_deducted,
          })
        } else {
          console.warn('No transaction found for refunded charge:', charge.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as successfully processed
    await supabase
      .from('stripe_webhook_events')
      .update({
        processing_status: 'success',
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)

    // Mark event as failed (if event was logged)
    try {
      if (supabase && event?.id) {
        await supabase
          .from('stripe_webhook_events')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('event_id', event.id)
      }
    } catch {
      // Ignore errors in error handler
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', error_code: 'WEBHOOK_PROCESSING_FAILED' },
      { status: 500 }
    )
  }
}
