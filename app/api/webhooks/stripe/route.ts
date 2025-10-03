import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Payment is successful and the subscription is created
        // Store subscription info in database
        console.log('Checkout completed:', {
          userId: session.metadata?.userId,
          customerId: session.customer,
          subscriptionId: session.subscription,
        })

        // TODO: Update user's subscription status in database
        // await updateUserSubscription(session.metadata?.userId, {
        //   stripeCustomerId: session.customer as string,
        //   stripeSubscriptionId: session.subscription as string,
        //   subscriptionStatus: 'active',
        //   tier: 'premium',
        // })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          userId: subscription.metadata?.userId,
        })

        // TODO: Update subscription status in database
        // await updateUserSubscription(subscription.metadata?.userId, {
        //   subscriptionStatus: subscription.status,
        // })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription cancelled:', {
          subscriptionId: subscription.id,
          userId: subscription.metadata?.userId,
        })

        // TODO: Update user to free tier in database
        // await updateUserSubscription(subscription.metadata?.userId, {
        //   subscriptionStatus: 'cancelled',
        //   tier: 'free',
        // })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Invoice payment succeeded:', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('Invoice payment failed:', {
          invoiceId: invoice.id,
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
