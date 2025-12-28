/**
 * Cron Job: Expire Old Credits
 * Schedule: Daily at midnight UTC
 * Purpose: Expire credit batches older than 1 year and update user balances
 */

import { NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/service-role'
import { logger } from '@/lib/observability/logger'

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

  // Use cached service role client
  const supabase = getServiceRoleClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured', error_code: 'SUPABASE_UNAVAILABLE' },
      { status: 503 }
    )
  }

  try {
    logger.info('Starting credit expiration job', { operation: 'cron_expire_credits' })

    // Call expire_credits database function
    const { data, error } = await supabase.rpc('expire_credits')

    if (error) {
      logger.error('Error expiring credits', {
        error: error.message,
        operation: 'cron_expire_credits',
      })
      return NextResponse.json(
        {
          error: 'Failed to expire credits',
          error_code: 'EXPIRATION_FAILED',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Type the RPC response
    const result = data as { users_affected?: number; total_credits_expired?: number } | null

    logger.info('Credit expiration completed', {
      operation: 'cron_expire_credits',
      users_affected: result?.users_affected || 0,
      total_credits_expired: result?.total_credits_expired || 0,
    })

    return NextResponse.json({
      success: true,
      users_affected: result?.users_affected || 0,
      total_credits_expired: result?.total_credits_expired || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Unexpected error in credit expiration', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'cron_expire_credits',
    })
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
