import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/auth/server'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_CREDITS_PRICE_ID

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  try {
    if (!stripe || !stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { origin } = new URL(request.url)
    const priceId = stripePriceId

    // Create Stripe checkout session for credit purchase
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${origin}/app?success=true`,
      cancel_url: `${origin}/app?canceled=true`,
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
