import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { getServiceRoleClient } from '@/lib/supabase/service-role'
import { sendPaymentSuccessEmail, sendPaymentFailureEmail } from '@/lib/email'
import { logger } from '@/lib/observability/logger'
import { Database } from '@/lib/supabase/types'

// Type alias for JSON payload storage
type Json = Database['public']['Tables']['stripe_webhook_events']['Insert']['payload']

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  let event: Stripe.Event | undefined

  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured', error_code: 'STRIPE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    // Get cached service role client for optimal performance
    const supabase = getServiceRoleClient()
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
      logger.error('Webhook signature verification failed', {
        error: err instanceof Error ? err.message : String(err),
        operation: 'stripe_webhook',
      })
      return NextResponse.json(
        { error: 'Invalid signature', error_code: 'INVALID_SIGNATURE' },
        { status: 400 }
      )
    }

    // Database-backed idempotency check - use maybeSingle to handle zero rows gracefully
    const { data: existingEvent, error: checkError } = await supabase
      .from('stripe_webhook_events')
      .select('id, processing_status')
      .eq('event_id', event.id)
      .maybeSingle()

    // If check fails (not "no rows" but actual DB error), we must fail closed
    if (checkError) {
      logger.error('Failed to check webhook idempotency', {
        eventId: event.id,
        error: checkError.message,
        operation: 'stripe_webhook',
      })
      return NextResponse.json(
        { error: 'Database error during idempotency check', error_code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    if (existingEvent) {
      logger.debug('Webhook event already processed', {
        eventId: event.id,
        status: existingEvent.processing_status,
        operation: 'stripe_webhook',
      })
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Log webhook event for idempotency and audit
    // Convert Stripe.Event to Json type for database storage
    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event as unknown as Json,
        processing_status: 'pending',
      })

    if (insertError) {
      // If insert fails due to unique constraint, event is duplicate
      if (insertError.code === '23505') {
        logger.debug('Webhook event duplicate via DB constraint', { eventId: event.id })
        return NextResponse.json({ received: true, duplicate: true })
      }
      // For any other insert error, fail closed to prevent processing without audit trail
      logger.error('Failed to log webhook event - failing closed', {
        eventId: event.id,
        error: insertError.message,
        code: insertError.code,
        operation: 'stripe_webhook',
      })
      return NextResponse.json(
        { error: 'Failed to log webhook event', error_code: 'AUDIT_LOG_FAILED' },
        { status: 500 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        logger.info('Checkout completed', {
          sessionId: session.id,
          userId: session.client_reference_id,
          customerId: session.customer,
          amountTotal: session.amount_total,
          operation: 'stripe_webhook',
        })

        if (!session.client_reference_id) {
          logger.warn('No user ID in checkout session', { sessionId: session.id })
          break
        }

        const creditsToAdd = 10
        const userId = session.client_reference_id

        // Safely extract Stripe fields with null checks
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id || null

        // Create payment transaction record
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            stripe_customer_id: customerId,
            amount: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
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
          logger.error('Error creating transaction', { userId, error: txError.message })
          throw new Error(`Failed to create transaction: ${txError.message}`)
        }

        // Validate transaction was returned (should not be null after successful insert)
        if (!transaction || !transaction.id) {
          logger.error('Transaction insert succeeded but no data returned', { userId })
          throw new Error('Transaction created but ID not returned')
        }

        // Add credits with batch tracking
        const { data: creditData, error: creditError } = await supabase.rpc('add_credits', {
          p_user_id: userId,
          p_credits_to_add: creditsToAdd,
          p_transaction_id: transaction.id,
        })

        if (creditError) {
          logger.error('Error adding credits', { userId, error: creditError.message })
          throw new Error(`Failed to add credits: ${creditError.message}`)
        }

        // Type the RPC response
        const creditResult = creditData as { new_balance?: number; batch_id?: string } | null

        logger.info('Payment processed successfully', {
          userId,
          transactionId: transaction.id,
          creditsAdded: creditsToAdd,
          newBalance: creditResult?.new_balance,
          batchId: creditResult?.batch_id,
          operation: 'stripe_webhook',
        })

        // Send payment success email if customer email is available
        if (session.customer_details?.email) {
          await sendPaymentSuccessEmail(
            session.customer_details.email,
            session.amount_total || 0,
            creditsToAdd,
            transaction.id
          ).catch((err) => logger.error('Failed to send success email', { error: err.message }))
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        logger.info('Payment intent succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          customerId: paymentIntent.customer,
          operation: 'stripe_webhook',
        })

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        logger.error('Payment intent failed', {
          paymentIntentId: paymentIntent.id,
          lastError: paymentIntent.last_payment_error?.message,
          operation: 'stripe_webhook',
        })

        // Send payment failure notification if email available
        const failureReceipt = paymentIntent.receipt_email
        if (failureReceipt) {
          const errorMessage = paymentIntent.last_payment_error?.message
          await sendPaymentFailureEmail(failureReceipt, errorMessage).catch((err) =>
            logger.error('Failed to send failure email', { error: err.message })
          )
        }

        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        logger.info('Subscription created', {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          operation: 'stripe_webhook',
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        logger.info('Subscription updated', {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          operation: 'stripe_webhook',
        })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        logger.info('Subscription cancelled', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          operation: 'stripe_webhook',
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        logger.info('Invoice payment succeeded', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          customerId: invoice.customer,
          operation: 'stripe_webhook',
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        logger.warn('Invoice payment failed', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          operation: 'stripe_webhook',
        })

        // Send payment failure notification for invoice
        if (invoice.customer_email) {
          await sendPaymentFailureEmail(
            invoice.customer_email,
            'Invoice payment failed'
          ).catch((err) => logger.error('Failed to send invoice failure email', { error: err.message }))
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        logger.info('Charge refunded', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          paymentIntent: charge.payment_intent,
          operation: 'stripe_webhook',
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
            logger.error('Error processing refund', { transactionId, error: refundError.message })
            throw new Error(`Failed to process refund: ${refundError.message}`)
          }

          // Type the RPC response
          const refundResult = refundData as { new_balance?: number; credits_deducted?: number } | null

          logger.info('Refund processed successfully', {
            transactionId,
            newBalance: refundResult?.new_balance,
            creditsDeducted: refundResult?.credits_deducted,
            operation: 'stripe_webhook',
          })
        } else {
          logger.warn('No transaction found for refunded charge', { chargeId: charge.id })
        }

        break
      }

      default:
        logger.debug('Unhandled webhook event type', { eventType: event.type })
    }

    // Mark event as successfully processed
    const { error: updateError } = await supabase
      .from('stripe_webhook_events')
      .update({
        processing_status: 'success',
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', event.id)

    if (updateError) {
      // Log but don't fail - processing already completed successfully
      // Failing here would cause Stripe to retry and potentially duplicate processing
      logger.warn('Failed to mark webhook as processed', {
        eventId: event.id,
        error: updateError.message,
        operation: 'stripe_webhook',
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook', {
      eventId: event?.id,
      eventType: event?.type,
      error: error instanceof Error ? error.message : String(error),
      operation: 'stripe_webhook',
    })

    // Mark event as failed (if event was logged)
    try {
      const errorSupabase = getServiceRoleClient()
      if (errorSupabase && event?.id) {
        await errorSupabase
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
