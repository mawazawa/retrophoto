/**
 * CSRF Protection Utilities
 *
 * Implements Origin-based CSRF validation for API routes.
 * This approach validates that requests come from allowed origins.
 *
 * SECURITY: Uses strict origin matching to prevent bypasses.
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

/**
 * Check if a URL's origin exactly matches an allowed origin
 */
function isOriginAllowed(urlOrOrigin: string): boolean {
  // For full URLs (referer), extract origin
  try {
    const url = new URL(urlOrOrigin)
    const origin = url.origin
    return ALLOWED_ORIGINS.includes(origin)
  } catch {
    // If not a valid URL, treat as origin and check directly
    return ALLOWED_ORIGINS.includes(urlOrOrigin)
  }
}

/**
 * Validate request origin against allowed origins
 * Returns true if the request origin is allowed, false otherwise
 *
 * SECURITY NOTES:
 * - Requests with no origin AND no referer are REJECTED (fail-closed)
 * - Uses exact origin matching to prevent subdomain bypasses
 */
export function validateCsrf(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // SECURITY: If no origin header, check referer
  if (!origin) {
    // SECURITY: Reject requests with no origin AND no referer
    // This prevents CSRF attacks that strip both headers
    if (!referer) {
      return false
    }

    // Check if referer origin is in allowed list (exact match)
    return isOriginAllowed(referer)
  }

  // Check if origin is in allowed list (exact match)
  return isOriginAllowed(origin)
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

  // SECURITY: Reject requests with no origin AND no referer (fail-closed)
  if (!origin && !referer) {
    return {
      valid: false,
      origin: undefined,
      referer: undefined,
      error: 'Missing origin and referer headers',
    }
  }

  // Check origin with exact matching
  if (origin && isOriginAllowed(origin)) {
    return { valid: true, origin, referer: referer || undefined }
  }

  // Check referer with exact matching
  if (referer && isOriginAllowed(referer)) {
    return { valid: true, origin: origin || undefined, referer }
  }

  return {
    valid: false,
    origin: origin || undefined,
    referer: referer || undefined,
    error: `Request origin '${origin || referer}' is not allowed`,
  }
}

/**
 * CSRF error response
 */
export const csrfErrorResponse = {
  error: 'CSRF validation failed',
  error_code: 'CSRF_ERROR',
}
