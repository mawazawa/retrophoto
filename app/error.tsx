'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console
    console.error('Route error:', error)

    // Report to Sentry if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-6xl">😓</div>
      <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-6 max-w-lg overflow-auto rounded bg-muted p-4 text-left text-sm">
          {error.message}
        </pre>
      )}
    </div>
  )
}
