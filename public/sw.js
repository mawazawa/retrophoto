/**
 * RetroPhoto Service Worker
 *
 * Provides offline support, caching, and background sync.
 * Constitutional requirement: FR-022 (PWA with offline capability)
 */

const CACHE_NAME = 'retrophoto-v1';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/offline',
  '/manifest.json',
  '/site.webmanifest',
  '/logo-192.png',
  '/logo-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Failed to cache some assets:', error);
        // Don't fail installation if some assets fail
        return Promise.resolve();
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // Fetch in background to update cache
        fetchAndCache(request);
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && shouldCache(request)) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          // Return empty response for other failed requests
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for failed uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-queue') {
    event.waitUntil(processUploadQueue());
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PROCESS_QUEUE') {
    processUploadQueue();
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Your photo restoration is ready!',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/app',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RetroPhoto', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/app';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Fetch and update cache in background
 */
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok && shouldCache(request)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response);
    }
  } catch {
    // Ignore fetch errors for background updates
  }
}

/**
 * Check if request should be cached
 */
function shouldCache(request) {
  const url = new URL(request.url);

  // Cache static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
    return true;
  }

  // Cache navigation requests
  if (request.mode === 'navigate') {
    return true;
  }

  return false;
}

/**
 * Process queued uploads when online
 */
async function processUploadQueue() {
  // Open IndexedDB to get queued uploads
  const db = await openDB();
  const transaction = db.transaction('uploads', 'readonly');
  const store = transaction.objectStore('uploads');

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = async () => {
      const queue = request.result;

      for (const upload of queue) {
        try {
          const formData = new FormData();
          formData.append('file', upload.file);
          formData.append('fingerprint', upload.fingerprint);

          const response = await fetch('/api/restore', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            // Remove from queue
            const deleteDb = await openDB();
            const deleteTx = deleteDb.transaction('uploads', 'readwrite');
            const deleteStore = deleteTx.objectStore('uploads');
            deleteStore.delete(upload.id);

            // Show notification
            self.registration.showNotification('RetroPhoto', {
              body: 'Your photo has been restored!',
              icon: '/logo-192.png',
              badge: '/logo-192.png',
              data: { url: '/app' },
            });
          }
        } catch (error) {
          console.error('Failed to process upload:', error);
        }
      }

      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('retrophoto_db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('uploads')) {
        const store = db.createObjectStore('uploads', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}
