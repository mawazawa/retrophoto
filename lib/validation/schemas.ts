/**
 * Input Validation Schemas
 *
 * Zod schemas for API request validation
 */

import { z } from 'zod'

/**
 * Analytics event schema
 */
export const analyticsEventSchema = z.object({
  event_type: z.enum(['upload_start', 'restore_complete', 'share_click', 'upgrade_view', 'web_vital']),
  session_id: z.string().uuid().optional().nullable(),
  ttm_seconds: z.number().positive().optional().nullable(),
  nsm_seconds: z.number().positive().optional().nullable(),
  fingerprint: z.string().min(20).optional(),
  // Web Vitals fields
  name: z.string().optional(),
  value: z.number().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  connectionType: z.string().optional(),
  url: z.string().optional(),
})

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>

/**
 * Fingerprint validation
 */
export const fingerprintSchema = z.string().min(20, 'Fingerprint must be at least 20 characters')

/**
 * Quota check request schema
 */
export const quotaRequestSchema = z.object({
  fingerprint: fingerprintSchema,
})

export type QuotaRequest = z.infer<typeof quotaRequestSchema>

/**
 * Restore request validation (for formData)
 */
export const restoreRequestSchema = z.object({
  fingerprint: fingerprintSchema,
  // File validation is done separately via validateImageFile
})

/**
 * Checkout session request schema
 */
export const checkoutRequestSchema = z.object({
  fingerprint: z.string().min(1).optional(),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

/**
 * Parse and validate request body
 */
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  error: string
  issues: z.ZodIssue[]
} {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: result.error.issues.map(i => i.message).join(', '),
    issues: result.error.issues,
  }
}

/**
 * Standard validation error response
 */
export function validationErrorResponse(error: string) {
  return {
    error,
    error_code: 'VALIDATION_ERROR',
  }
}
