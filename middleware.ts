import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { securityHeaders, apiSecurityHeaders } from '@/lib/security/headers'
import { logger } from '@/lib/observability/logger'

/**
 * Apply security headers to response
 */
function applyHeaders(response: NextResponse, isApi: boolean = false): NextResponse {
  const headers = isApi ? apiSecurityHeaders : securityHeaders

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export async function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth check if Supabase is not configured
  if (!supabaseUrl || !supabaseKey) {
    logger.warn('Supabase credentials not configured, skipping auth middleware')
    return applyHeaders(supabaseResponse, isApiRoute)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to sign in if not authenticated and trying to access protected routes
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    // Allow /app without auth (guest mode with fingerprint)
    // But you can uncomment below to require auth:
    // const redirectUrl = new URL('/', request.url)
    // return NextResponse.redirect(redirectUrl)
  }

  // Apply security headers to response
  return applyHeaders(supabaseResponse, isApiRoute)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

