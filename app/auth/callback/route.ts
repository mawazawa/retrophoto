import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/observability/logger'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors from provider
  if (error) {
    logger.error('OAuth callback error from provider', {
      error,
      errorDescription,
      operation: 'auth',
    })
    // Redirect with error indicator
    const redirectUrl = new URL(requestUrl.origin)
    redirectUrl.searchParams.set('auth_error', error)
    return NextResponse.redirect(redirectUrl.toString())
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        logger.error('Failed to exchange code for session', {
          error: authError.message,
          code: authError.status,
          operation: 'auth',
        })
        // Redirect with error indicator
        const redirectUrl = new URL(requestUrl.origin)
        redirectUrl.searchParams.set('auth_error', 'exchange_failed')
        return NextResponse.redirect(redirectUrl.toString())
      }

      logger.info('OAuth callback successful', { operation: 'auth' })
    } catch (err) {
      logger.error('Unexpected error in auth callback', {
        error: err instanceof Error ? err.message : String(err),
        operation: 'auth',
      })
      const redirectUrl = new URL(requestUrl.origin)
      redirectUrl.searchParams.set('auth_error', 'unexpected')
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
