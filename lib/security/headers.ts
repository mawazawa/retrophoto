/**
 * HTTP Security Headers Configuration
 *
 * Implements OWASP recommended security headers for production.
 * Reference: https://owasp.org/www-project-secure-headers/
 */

/**
 * Content Security Policy directives
 * Allows necessary external resources while blocking malicious scripts
 */
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for Next.js dev mode - remove in strict CSP
    'https://va.vercel-scripts.com', // Vercel Analytics
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co', // Supabase Storage
    'https://*.supabase.in',
    'https://replicate.delivery', // Replicate AI outputs
    'https://*.replicate.delivery',
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co', // Supabase API
    'https://*.supabase.in',
    'https://api.replicate.com', // Replicate API
    'https://*.sentry.io', // Sentry error tracking
    'https://va.vercel-scripts.com', // Vercel Analytics
    'https://vitals.vercel-insights.com', // Vercel Web Vitals
  ],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
}

/**
 * Build CSP header string from directives
 */
function buildCSP(): string {
  return Object.entries(cspDirectives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive
      }
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * Security headers for all responses
 */
export const securityHeaders: Record<string, string> = {
  // Content Security Policy
  'Content-Security-Policy': buildCSP(),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Enforce HTTPS (1 year with subdomains)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent XSS attacks (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Permissions Policy (disable unused browser features)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
  ].join(', '),

  // DNS prefetch control
  'X-DNS-Prefetch-Control': 'on',
}

/**
 * Headers for API routes (less restrictive CSP)
 */
export const apiSecurityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, max-age=0',
}

/**
 * Apply security headers to a Response object
 */
export function applySecurityHeaders(
  response: Response,
  isApi: boolean = false
): Response {
  const headers = isApi ? apiSecurityHeaders : securityHeaders

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Get security headers for Next.js config
 * Use in next.config.ts for static headers
 */
export function getNextConfigHeaders() {
  return [
    {
      source: '/:path*',
      headers: Object.entries(securityHeaders).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ]
}
