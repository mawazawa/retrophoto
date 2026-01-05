import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit'
import { validateCsrf, csrfErrorResponse } from '@/lib/security/csrf'
import { logger } from '@/lib/observability/logger'
import { withErrorBoundary } from '@/lib/api/error-boundary'
import { badRequest, forbidden, serviceUnavailable } from '@/lib/api/errors'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_CREDITS_PRICE_ID

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export const POST = withErrorBoundary(async (request: NextRequest) => {
  // CSRF protection - validate request origin
  if (!validateCsrf(request)) {
    throw forbidden('CSRF validation failed', 'CSRF_VALIDATION_FAILED')
  }

  if (!stripe || !stripePriceId) {
    throw serviceUnavailable('Stripe is not configured', 'STRIPE_UNAVAILABLE')
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
    throw badRequest('Missing user ID or fingerprint', 'MISSING_IDENTIFIER')
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
});
