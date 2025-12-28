/**
 * CSRF Protection Utilities
 *
 * Implements Origin-based CSRF validation for API routes.
 * This approach validates that requests come from allowed origins.
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

/**
 * Validate request origin against allowed origins
 * Returns true if the request origin is allowed, false otherwise
 */
export function validateCsrf(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // If no origin header (same-origin request or server-side), check referer
  if (!origin) {
    // If no referer either, it might be a server-side request or curl
    // Allow if there's no origin AND no referer (likely API client)
    if (!referer) {
      return true
    }

    // Check if referer starts with an allowed origin
    return ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))
  }

  // Check if origin is in allowed list
  return ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))
}

/**
 * Get CSRF validation result with error details
 */
export function validateCsrfWithDetails(request: Request): {
  valid: boolean
  origin?: string
  referer?: string
  error?: string
} {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) {
    return { valid: true, origin: undefined, referer: undefined }
  }

  if (origin && ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    return { valid: true, origin, referer: referer || undefined }
  }

  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) {
    return { valid: true, origin: origin || undefined, referer }
  }

  return {
    valid: false,
    origin: origin || undefined,
    referer: referer || undefined,
    error: `Request origin '${origin || referer}' is not allowed`
  }
}

/**
 * CSRF error response
 */
export const csrfErrorResponse = {
  error: 'CSRF validation failed',
  error_code: 'CSRF_ERROR',
}
