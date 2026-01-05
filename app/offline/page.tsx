'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Offline fallback page
 *
 * Displayed when user is offline and the requested page isn't cached.
 * Constitutional requirement: FR-022 (PWA with offline capability)
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Redirect if online
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/'
    }
  }, [isOnline])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-6xl">
        {isOnline ? '...' : ''}
      </div>
      <h1 className="mb-2 text-2xl font-bold">
        {isOnline ? 'Reconnecting...' : "You're Offline"}
      </h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        {isOnline
          ? 'Connection restored! Redirecting...'
          : 'No internet connection. Your uploads will be queued and processed automatically when you reconnect.'}
      </p>
      {!isOnline && (
        <div className="flex flex-col gap-4">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <p className="text-sm text-muted-foreground">
            Queued uploads will sync automatically when online
          </p>
        </div>
      )}
    </div>
  )
}
