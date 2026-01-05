'use client'

import { cn } from '@/lib/utils'

/**
 * Skip Link Component
 *
 * Allows keyboard users to skip to main content.
 * Hidden visually until focused.
 */
export function SkipLink({ href = '#main', children = 'Skip to main content' }: {
  href?: string
  children?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50',
        'focus:rounded-md focus:bg-primary focus:px-4 focus:py-2',
        'focus:text-primary-foreground focus:outline-none focus:ring-2',
        'focus:ring-ring focus:ring-offset-2'
      )}
    >
      {children}
    </a>
  )
}
