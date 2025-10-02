'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 *
 * Registers the service worker and handles background sync.
 * Constitutional requirement: FR-022 (PWA with offline capability)
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)

          // Request notification permission
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              console.log('Notification permission:', permission)
            })
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for online event to process queue
      window.addEventListener('online', () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'PROCESS_QUEUE' })
        }
      })
    }
  }, [])

  return null
}
