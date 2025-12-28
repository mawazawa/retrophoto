'use client'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center text-foreground">
          <div className="mb-6 text-6xl">💥</div>
          <h2 className="mb-2 text-2xl font-bold">Critical Error</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            Something went very wrong. Please refresh the page.
          </p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-md border border-input bg-background px-4 py-2 hover:bg-accent"
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
