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

// Track processed events to prevent duplicate processing (idempotency)
const processedEvents = new Map<string, number>()

// Clean up old processed events (keep last 1000 events)
function cleanupProcessedEvents() {
  if (processedEvents.size > 1000) {
    const entries = Array.from(processedEvents.entries())
    entries.sort((a, b) => a[1] - b[1])
    entries.slice(0, 500).forEach(([key]) => processedEvents.delete(key))
  }
}

export async function POST(request: Request) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Idempotency check - prevent duplicate event processing
    if (processedEvents.has(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Mark event as processed
    processedEvents.set(event.id, Date.now())
    cleanupProcessedEvents()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Payment successful - add credits to user account
        console.log('Checkout completed:', {
          sessionId: session.id,
          userId: session.client_reference_id,
          customerId: session.customer,
          amountTotal: session.amount_total,
        })

        // Determine number of credits based on price
        // Default: 10 credits for the credit pack
        const creditsToAdd = 10

        // Add credits to user account
        if (session.client_reference_id) {
          const { data, error } = await supabase.rpc('add_credits', {
            p_user_id: session.client_reference_id,
            p_fingerprint: session.client_reference_id, // Use user ID as fingerprint for logged-in users
            p_credits_to_add: creditsToAdd,
            p_stripe_customer_id: session.customer as string,
          })

          if (error) {
            console.error('Error adding credits:', error)
            throw new Error(`Failed to add credits: ${error.message}`)
          }

          console.log('Credits added successfully:', {
            userId: session.client_reference_id,
            creditsAdded: creditsToAdd,
            newBalance: data?.[0]?.new_balance,
          })
        } else {
          console.warn('No user ID in checkout session metadata')
        }

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

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
