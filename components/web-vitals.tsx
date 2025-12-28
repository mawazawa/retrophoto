'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/metrics/web-vitals'

/**
 * Web Vitals Reporter Component
 *
 * Initializes Core Web Vitals monitoring on mount.
 * Add this to your root layout to enable metrics collection.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals()
  }, [])

  return null
}
