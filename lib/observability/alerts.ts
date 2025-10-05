/**
 * Sentry Alerts for TTM Threshold Monitoring
 *
 * Constitutional requirement: PR-001 (TTM p95 ≤12s)
 * Alerts when Time-to-Magic exceeds thresholds
 */

import * as Sentry from '@sentry/nextjs'

export interface TTMMetric {
  sessionId: string
  ttmSeconds: number
  p50Threshold: number // 6s
  p95Threshold: number // 12s
}

/**
 * Track TTM metric and alert if threshold exceeded
 */
export function trackTTMAlert(metric: TTMMetric): void {
  // Record span for performance monitoring (Sentry v8+ uses startSpan)
  Sentry.startSpan(
    {
      name: 'photo-restoration',
      op: 'ai.restore',
      attributes: {
        session_id: metric.sessionId,
        ttm_seconds: metric.ttmSeconds,
      },
    },
    () => {
      // Span body
    }
  )

  // Check thresholds
  if (metric.ttmSeconds > metric.p95Threshold) {
    // P95 threshold exceeded - critical alert
    Sentry.captureMessage('TTM p95 threshold exceeded', {
      level: 'warning',
      tags: {
        ttm_exceeded: 'p95',
        threshold: metric.p95Threshold,
      },
      extra: {
        session_id: metric.sessionId,
        ttm_seconds: metric.ttmSeconds,
        threshold_seconds: metric.p95Threshold,
        delta_seconds: metric.ttmSeconds - metric.p95Threshold,
      },
    })
  } else if (metric.ttmSeconds > metric.p50Threshold) {
    // P50 threshold exceeded - warning
    Sentry.captureMessage('TTM p50 threshold exceeded', {
      level: 'info',
      tags: {
        ttm_exceeded: 'p50',
        threshold: metric.p50Threshold,
      },
      extra: {
        session_id: metric.sessionId,
        ttm_seconds: metric.ttmSeconds,
        threshold_seconds: metric.p50Threshold,
        delta_seconds: metric.ttmSeconds - metric.p50Threshold,
      },
    })
  }
}

/**
 * Track restoration failure
 */
export function trackRestorationFailure(
  sessionId: string,
  error: Error,
  retryCount: number
): void {
  Sentry.captureException(error, {
    tags: {
      session_id: sessionId,
      retry_count: retryCount,
    },
    contexts: {
      restoration: {
        session_id: sessionId,
        retry_count: retryCount,
        max_retries: 1,
      },
    },
  })
}

/**
 * Track quota exceeded event
 */
export function trackQuotaExceeded(fingerprint: string): void {
  // Don't send to Sentry (expected behavior)
  // Just log for local debugging
  console.info('Quota exceeded for fingerprint:', fingerprint)
}

/**
 * Track upload validation error
 */
export function trackValidationError(
  error: string,
  fileSize?: number,
  fileType?: string
): void {
  Sentry.captureMessage('Upload validation error', {
    level: 'info',
    tags: {
      validation_type: error,
    },
    extra: {
      error_message: error,
      file_size_bytes: fileSize,
      file_type: fileType,
    },
  })
}
