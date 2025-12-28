/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals and reports them to analytics.
 * Constitutional SLO: First interactive <1.5s on mid-tier devices.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - loading performance
 * - FID (First Input Delay) - interactivity
 * - CLS (Cumulative Layout Shift) - visual stability
 * - FCP (First Contentful Paint) - perceived load speed
 * - TTFB (Time to First Byte) - server response time
 * - INP (Interaction to Next Paint) - responsiveness
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals'

// Threshold definitions for good/needs improvement/poor
const thresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
}

type MetricRating = 'good' | 'needs-improvement' | 'poor'

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): MetricRating {
  const threshold = thresholds[name as keyof typeof thresholds]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Report metric to analytics endpoint
 */
async function reportMetric(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    // Add device context
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
    url: window.location.pathname,
  }

  // Use sendBeacon for reliability (works even on page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', JSON.stringify({
      event_type: 'web_vital',
      ...body,
    }))
  } else {
    // Fallback to fetch
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'web_vital',
        ...body,
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail - analytics shouldn't break the app
    })
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, {
      value: metric.value.toFixed(2),
      rating: body.rating,
    })
  }
}

/**
 * Get device type based on screen width
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Get connection type if available
 */
function getConnectionType(): string {
  if (typeof navigator === 'undefined') return 'unknown'

  // @ts-expect-error - Navigator.connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return 'unknown'

  return connection.effectiveType || 'unknown'
}

/**
 * Initialize Web Vitals monitoring
 *
 * Call this in your app's entry point or layout.
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Report all core web vitals
  onCLS(reportMetric)
  onFCP(reportMetric)
  onFID(reportMetric)
  onINP(reportMetric)
  onLCP(reportMetric)
  onTTFB(reportMetric)
}

/**
 * Check if performance meets SLO thresholds
 */
export function checkSLOCompliance(metrics: Record<string, number>): {
  compliant: boolean
  violations: string[]
} {
  const violations: string[] = []

  // Constitutional SLO: First interactive <1.5s
  if (metrics.FCP && metrics.FCP > 1500) {
    violations.push(`FCP ${metrics.FCP}ms exceeds 1.5s SLO`)
  }

  // LCP should be under 2.5s for good rating
  if (metrics.LCP && metrics.LCP > 2500) {
    violations.push(`LCP ${metrics.LCP}ms exceeds 2.5s threshold`)
  }

  // CLS should be under 0.1 for good rating
  if (metrics.CLS && metrics.CLS > 0.1) {
    violations.push(`CLS ${metrics.CLS} exceeds 0.1 threshold`)
  }

  return {
    compliant: violations.length === 0,
    violations,
  }
}
