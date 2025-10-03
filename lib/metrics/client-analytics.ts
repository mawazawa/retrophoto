/**
 * Client-side analytics tracking
 *
 * This file is safe to import in client components
 */

// Client-side NSM tracking
export function setupNSMTracking() {
  if (typeof window === 'undefined') return null

  performance.mark('page-load')

  return {
    markPreviewVisible: () => {
      performance.mark('preview-visible')
      const measure = performance.measure(
        'nsm',
        'page-load',
        'preview-visible'
      )

      // Beacon to analytics endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics',
          JSON.stringify({
            event_type: 'upload',
            nsm_seconds: measure.duration / 1000,
          })
        )
      }
    },
  }
}
