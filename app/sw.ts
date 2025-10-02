/**
 * Service Worker for RetroPhoto PWA
 *
 * Handles:
 * - Background sync for queued uploads
 * - Push notifications for restore completion
 * - Offline shell caching
 *
 * Constitutional requirements:
 * - FR-022: PWA with offline shell and queued upload capability
 * - Principle X: Mobile-First Design Specs
 */

/// <reference lib="webworker" />

import { processQueue } from '@/lib/pwa/background-sync'

declare const self: ServiceWorkerGlobalScope

// Listen for background sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-queue') {
    event.waitUntil(processQueue())
  }
})

// Listen for push notifications (future: restoration complete)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const options: NotificationOptions = {
    body: data.body || 'Your photo has been restored!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'RetroPhoto', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  )
})

export {}
