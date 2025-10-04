/**
 * Cron Job: Expire Old Credits
 * Schedule: Daily at midnight UTC
 * Purpose: Expire credit batches older than 1 year and update user balances
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret'

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized', error_code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase not configured', error_code: 'SUPABASE_UNAVAILABLE' },
      { status: 503 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('[CRON] Starting credit expiration job...')

    // Call expire_credits database function
    const { data, error } = await supabase.rpc('expire_credits')

    if (error) {
      console.error('[CRON] Error expiring credits:', error)
      return NextResponse.json(
        {
          error: 'Failed to expire credits',
          error_code: 'EXPIRATION_FAILED',
          details: error.message,
        },
        { status: 500 }
      )
    }

    console.log('[CRON] Credit expiration completed:', data)

    return NextResponse.json({
      success: true,
      users_affected: data?.users_affected || 0,
      total_credits_expired: data?.total_credits_expired || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Support POST for manual triggers (with authentication)
export async function POST(request: Request) {
  return GET(request)
}
