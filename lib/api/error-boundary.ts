/**
 * API Error Boundary
 *
 * Wrapper for API route handlers that provides:
 * - Consistent error handling and responses
 * - Request ID generation for tracing
 * - Structured logging
 * - Error type mapping (Supabase, Stripe, Zod, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/observability/logger'
import { ApiHandler, ApiErrorResponse } from './types'
import { ApiError, isApiError } from './errors'
import { PostgrestError } from '@supabase/supabase-js'
import Stripe from 'stripe'

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Map known error types to appropriate status codes and error codes
 */
function mapErrorToResponse(error: unknown, requestId: string): { statusCode: number; errorCode: string; message: string } {
  // ApiError - use as-is
  if (isApiError(error)) {
    return {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    }
  }

  // Supabase/PostgrestError
  if (isPostgrestError(error)) {
    logger.error('Supabase error', {
      requestId,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })

    // Map common Supabase error codes
    switch (error.code) {
      case 'PGRST116': // Row not found
        return {
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: 'Resource not found',
        }
      case '23505': // Unique violation
        return {
          statusCode: 409,
          errorCode: 'CONFLICT',
          message: 'Resource already exists',
        }
      case '23503': // Foreign key violation
        return {
          statusCode: 400,
          errorCode: 'INVALID_REFERENCE',
          message: 'Invalid reference to related resource',
        }
      case '42501': // Insufficient privilege
        return {
          statusCode: 403,
          errorCode: 'FORBIDDEN',
          message: 'Insufficient permissions',
        }
      default:
        return {
          statusCode: 500,
          errorCode: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }
    }
  }

  // Stripe errors
  if (isStripeError(error)) {
    logger.error('Stripe error', {
      requestId,
      error: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    })

    switch (error.type) {
      case 'StripeCardError':
        return {
          statusCode: 402,
          errorCode: 'PAYMENT_FAILED',
          message: error.message || 'Payment card error',
        }
      case 'StripeRateLimitError':
        return {
          statusCode: 429,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests to payment provider',
        }
      case 'StripeInvalidRequestError':
        return {
          statusCode: 400,
          errorCode: 'INVALID_PAYMENT_REQUEST',
          message: error.message || 'Invalid payment request',
        }
      case 'StripeAPIError':
      case 'StripeConnectionError':
      case 'StripeAuthenticationError':
        return {
          statusCode: 503,
          errorCode: 'PAYMENT_SERVICE_UNAVAILABLE',
          message: 'Payment service temporarily unavailable',
        }
      default:
        return {
          statusCode: 500,
          errorCode: 'PAYMENT_ERROR',
          message: 'Payment processing failed',
        }
    }
  }

  // Zod validation errors
  if (isZodError(error)) {
    logger.error('Validation error', {
      requestId,
      errors: error.errors,
    })

    return {
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      statusCode: 500,
      errorCode: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    }
  }

  // Unknown error type
  return {
    statusCode: 500,
    errorCode: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  }
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * Type guard for Stripe errors
 */
function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return false
  }
  const errorType = (error as { type: unknown }).type
  return typeof errorType === 'string' && errorType.startsWith('Stripe')
}

/**
 * Type guard for Zod errors
 */
function isZodError(error: unknown): error is { errors: Array<{ path: string[]; message: string }> } {
  if (typeof error !== 'object' || error === null || !('errors' in error)) {
    return false
  }
  return Array.isArray((error as { errors: unknown }).errors)
}

/**
 * Higher-order function that wraps API handlers with error boundary
 *
 * @example
 * ```typescript
 * export const POST = withErrorBoundary(async (request) => {
 *   const data = await processRequest(request)
 *   return NextResponse.json({ success: true, data })
 * })
 * ```
 */
export function withErrorBoundary(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    try {
      // Add request ID to headers for tracing
      const response = await handler(request, context)

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)

      // Log successful request
      const duration = Date.now() - startTime
      logger.debug('API request completed', {
        requestId,
        path: request.nextUrl.pathname,
        method: request.method,
        status: response.status,
        duration_ms: duration,
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Map error to response
      const { statusCode, errorCode, message } = mapErrorToResponse(error, requestId)

      // Log error with full context
      logger.error('API request failed', {
        requestId,
        path: request.nextUrl.pathname,
        method: request.method,
        status: statusCode,
        errorCode,
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
      })

      // Build error response
      const errorResponse: ApiErrorResponse = {
        error: message,
        error_code: errorCode,
        request_id: requestId,
      }

      return NextResponse.json(errorResponse, {
        status: statusCode,
        headers: {
          'X-Request-ID': requestId,
        },
      })
    }
  }
}
