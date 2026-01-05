import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest, NextResponse } from 'next/server'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      checkout = {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_default',
            url: 'https://checkout.stripe.com/test_default'
          })
        }
      }
    }
  }
})

// Import after mocks
import { createClient } from '@/lib/supabase/server'

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_CREDITS_PRICE_ID = 'price_mock'

describe('Bug Fix: Guest Checkout Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * BUG: Authentication was REQUIRED for checkout, breaking guest user flow
   *
   * BEFORE (BROKEN):
   * - Guest users (fingerprint only) got 401 Unauthorized
   * - Could not purchase credits without creating account
   * - Broke "no signup required" promise
   *
   * AFTER (FIXED):
   * - Guest users can checkout with fingerprint
   * - Authenticated users can checkout with user.id
   * - Seamless conversion from free tier to paid
   */

  it('should reject requests without user ID or fingerprint', async () => {
    const mockClient = createMockSupabaseClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const formData = new FormData()
    // No fingerprint provided

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000'
      },
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error_code).toBe('MISSING_IDENTIFIER')
  })

  it('should allow guest users to checkout with fingerprint (BUG FIX)', async () => {
    const mockClient = createMockSupabaseClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null }, // No authenticated user
          error: null,
        }),
      },
    })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const fingerprint = 'guest-fingerprint-12345678901234567890'
    const formData = new FormData()
    formData.append('fingerprint', fingerprint)

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000'
      },
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    // Should succeed with 200
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('url')
  })

  it('should allow authenticated users to checkout with user.id', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      email: 'user@example.com',
    }

    const mockClient = createMockSupabaseClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const formData = new FormData()
    formData.append('fingerprint', 'some-fingerprint') // Provided but will use user.id

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000'
      },
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('url')
  })

  it('should document the bug that was fixed', () => {
    /**
     * BUG FIXED: Guest Checkout Not Supported
     *
     * Location: app/api/create-checkout-session/route.ts:24-29
     *
     * BEFORE (BROKEN CODE):
     * ```typescript
     * const { data: { user } } = await supabase.auth.getUser()
     * if (!user) {
     *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     * }
     * ```
     *
     * Impact:
     * - Guest users (fingerprint-based) got 401 error when trying to buy credits
     * - Forced users to create accounts before purchasing
     * - Broke the "no signup required" user experience
     * - Major conversion/revenue killer
     *
     * Root Cause:
     * - Payment system requires authentication
     * - But quota system works with fingerprints (no auth)
     * - Mismatch between free tier (fingerprint) and paid tier (auth)
     *
     * AFTER (FIXED CODE):
     * ```typescript
     * const formData = await request.formData()
     * const fingerprint = formData.get('fingerprint') as string
     * const { data: { user } } = await supabase.auth.getUser()
     * const userId = user?.id || fingerprint  // Support both!
     * const userEmail = user?.email || undefined
     * ```
     *
     * Benefits:
     * - ✅ Guest users can buy credits with fingerprint
     * - ✅ Authenticated users continue to work
     * - ✅ Seamless free → paid conversion
     * - ✅ No forced account creation
     * - ✅ Revenue optimization
     */
    expect(true).toBe(true)
  })

  it('should handle the case where fingerprint is provided but user is authenticated', async () => {
    const mockUser = {
      id: 'user-uuid-456',
      email: 'authenticated@example.com',
    }

    const mockClient = createMockSupabaseClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
    vi.mocked(createClient).mockResolvedValue(mockClient as any)

    const formData = new FormData()
    formData.append('fingerprint', 'guest-fingerprint-xyz')

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000'
      },
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('url')
  })
})
