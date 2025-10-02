import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Server-side specific configuration
  beforeSend(event, hint) {
    // Don't send quota exceeded errors (expected behavior)
    if (event.exception?.values?.[0]?.value?.includes('quota exceeded')) {
      return null
    }

    // Add session context for debugging
    if (hint.originalException instanceof Error) {
      const error = hint.originalException
      if ('sessionId' in error) {
        event.tags = {
          ...event.tags,
          session_id: (error as any).sessionId,
        }
      }
    }

    return event
  },
})
