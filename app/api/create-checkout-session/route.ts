import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit'
import { validateCsrf, csrfErrorResponse } from '@/lib/security/csrf'
import { logger } from '@/lib/observability/logger'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_CREDITS_PRICE_ID

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  try {
    // CSRF protection - validate request origin
    if (!validateCsrf(request)) {
      return NextResponse.json(csrfErrorResponse, { status: 403 })
    }

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

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, rateLimitConfigs.checkout)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(rateLimitedResponse(rateLimitResult), {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      })
    }

    const { origin } = new URL(request.url)
    const priceId = stripePriceId

    // Create Stripe checkout session for credit purchase
    // Supports both authenticated users and guest users (via fingerprint)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
        isGuest: String(!user),
        fingerprint: fingerprint || '',
      },
    }

    // Add customer email if available
    if (userEmail) {
      sessionParams.customer_email = userEmail
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    logger.error('Checkout session creation failed', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'checkout',
    })
    return NextResponse.json(
      { error: 'Failed to create checkout session', error_code: 'CHECKOUT_FAILED' },
      { status: 500 }
    )
  }
}
