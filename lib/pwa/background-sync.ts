/**
 * Background Sync for PWA
 *
 * Queues failed uploads to retry when connection is restored.
 * Constitutional requirement: FR-022 (Offline PWA with queued uploads)
 */

export interface QueuedUpload {
  id: string
  file: File
  fingerprint: string
  timestamp: number
}

const QUEUE_KEY = 'retrophoto_upload_queue'

/**
 * Add upload to background sync queue
 */
export async function queueUpload(file: File, fingerprint: string): Promise<string> {
  const id = crypto.randomUUID()
  const upload: QueuedUpload = {
    id,
    file,
    fingerprint,
    timestamp: Date.now(),
  }

  // Store in IndexedDB (for larger file support)
  const queue = await getQueue()
  queue.push(upload)
  await saveQueue(queue)

  // Request background sync if supported
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      // @ts-ignore - sync API is experimental but widely supported
      if (registration.sync) {
        // @ts-ignore
        await registration.sync.register('upload-queue')
      }
    } catch (error) {
      console.warn('Background sync not available:', error)
    }
  }

  return id
}

/**
 * Get all queued uploads
 */
export async function getQueue(): Promise<QueuedUpload[]> {
  if (typeof window === 'undefined') return []

  try {
    const db = await openDB()
    const transaction = db.transaction('uploads', 'readonly')
    const store = transaction.objectStore('uploads')
    const request = store.getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as QueuedUpload[])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get queue:', error)
    return []
  }
}

/**
 * Save queue to IndexedDB
 */
async function saveQueue(queue: QueuedUpload[]): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction('uploads', 'readwrite')
  const store = transaction.objectStore('uploads')

  // Clear existing
  await store.clear()

  // Add all items
  for (const item of queue) {
    await store.add(item)
  }
}

/**
 * Remove upload from queue
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction('uploads', 'readwrite')
  const store = transaction.objectStore('uploads')
  await store.delete(id)
}

/**
 * Process queued uploads
 */
export async function processQueue(): Promise<void> {
  const queue = await getQueue()

  for (const upload of queue) {
    try {
      const formData = new FormData()
      formData.append('file', upload.file)
      formData.append('fingerprint', upload.fingerprint)

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await removeFromQueue(upload.id)

        // Notify user of success
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('RetroPhoto', {
            body: 'Your photo has been restored!',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          })
        }
      } else {
        // Leave in queue for next sync
        console.error('Upload failed, will retry:', upload.id)
      }
    } catch (error) {
      console.error('Failed to process queued upload:', error)
    }
  }
}

/**
 * Open IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('retrophoto_db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('uploads')) {
        const store = db.createObjectStore('uploads', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  // @ts-ignore - sync API is experimental
  return 'sync' in ServiceWorkerRegistration.prototype
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue()
  return queue.length
}
