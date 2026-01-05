/**
 * API Type Definitions
 *
 * Type definitions for API handlers and responses
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * API handler function type
 */
export type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string
  error_code: string
  request_id?: string
  [key: string]: unknown // Allow additional fields like upgrade_url
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  [key: string]: T
}

/**
 * API response type (success or error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Error with HTTP status code
 */
export interface ErrorWithStatus extends Error {
  statusCode?: number
  errorCode?: string
}
