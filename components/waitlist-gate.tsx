'use client'

import { cn } from '@/lib/utils'

interface WaitlistGateProps {
  className?: string
}

export function WaitlistGate({ className }: WaitlistGateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 text-center',
        className
      )}
    >
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">
        You&apos;re on the waitlist
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        We&apos;re rolling out access gradually. You&apos;ll be notified when
        it&apos;s your turn to purchase credits.
      </p>
      <a
        href="/contact"
        className={cn(
          'inline-flex h-11 items-center justify-center rounded-md',
          'bg-primary px-6 text-sm font-medium text-primary-foreground',
          'transition-colors hover:bg-primary/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        Request Early Access
      </a>
    </div>
  )
}
