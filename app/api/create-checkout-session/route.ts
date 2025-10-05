import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_CREDITS_PRICE_ID

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  try {
    if (!stripe || !stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe is not configured', error_code: 'STRIPE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const formData = await request.formData()
    const fingerprint = formData.get('fingerprint') as string

    // Get user if authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser()

    // Use authenticated user ID OR fingerprint for guest checkout
    const userId = user?.id || fingerprint
    const userEmail = user?.email || undefined

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID or fingerprint', error_code: 'MISSING_IDENTIFIER' },
        { status: 400 }
      )
    }

    const { origin } = new URL(request.url)
    const priceId = stripePriceId

    // Create Stripe checkout session for credit purchase
    // Supports both authenticated users and guest users (via fingerprint)
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
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
        userId: userId,
        isGuest: !user,
        fingerprint: fingerprint || undefined,
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
