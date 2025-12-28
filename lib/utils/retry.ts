/**
 * Retry Utilities
 *
 * Provides retry logic with exponential backoff for external API calls.
 */

import pRetry, { AbortError } from 'p-retry'

export interface RetryOptions {
  /** Number of retry attempts (default: 3) */
  retries?: number
  /** Minimum timeout in ms between retries (default: 1000) */
  minTimeout?: number
  /** Maximum timeout in ms between retries (default: 10000) */
  maxTimeout?: number
  /** Factor by which timeout increases (default: 2) */
  factor?: number
  /** Callback when a retry occurs */
  onRetry?: (error: Error, attemptNumber: number) => void
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 *
 * @example
 * const data = await withRetry(
 *   async () => {
 *     const res = await fetch(url)
 *     if (!res.ok) throw new Error('Fetch failed')
 *     return res.json()
 *   },
 *   { retries: 3 }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 10000,
    factor = 2,
    onRetry,
  } = options

  return pRetry(fn, {
    retries,
    minTimeout,
    maxTimeout,
    factor,
    onFailedAttempt: (error) => {
      console.warn(
        `Retry attempt ${error.attemptNumber} failed. ` +
          `${error.retriesLeft} retries left.`,
        error.message
      )
      onRetry?.(error, error.attemptNumber)
    },
  })
}

/**
 * Fetch with automatic retry
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, options)

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new AbortError(`Client error: ${response.status}`)
      }

      // Retry on server errors (5xx)
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      return response
    },
    { retries: 3, ...retryOptions }
  )
}

/**
 * Fetch and return array buffer with retry
 * Useful for image downloads
 */
export async function fetchBufferWithRetry(
  url: string,
  retryOptions: RetryOptions = {}
): Promise<ArrayBuffer> {
  const response = await fetchWithRetry(url, undefined, retryOptions)
  return response.arrayBuffer()
}

/**
 * Timeout wrapper for promises
 *
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds
 * @param message - Error message on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message))
    }, ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

// Re-export AbortError for consumers who want to prevent retries
export { AbortError }
