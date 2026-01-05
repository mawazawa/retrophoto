/**
 * API Error Utilities
 *
 * Custom error classes and error factories for consistent error handling
 */

import { ErrorWithStatus } from './types'

/**
 * Custom API error class with status code and error code
 */
export class ApiError extends Error implements ErrorWithStatus {
  statusCode: number
  errorCode: string

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

/**
 * Error factory: 400 Bad Request
 */
export function badRequest(message: string, errorCode: string = 'BAD_REQUEST'): ApiError {
  return new ApiError(message, 400, errorCode)
}

/**
 * Error factory: 401 Unauthorized
 */
export function unauthorized(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED'): ApiError {
  return new ApiError(message, 401, errorCode)
}

/**
 * Error factory: 403 Forbidden
 */
export function forbidden(message: string = 'Forbidden', errorCode: string = 'FORBIDDEN'): ApiError {
  return new ApiError(message, 403, errorCode)
}

/**
 * Error factory: 404 Not Found
 */
export function notFound(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND'): ApiError {
  return new ApiError(message, 404, errorCode)
}

/**
 * Error factory: 409 Conflict
 */
export function conflict(message: string, errorCode: string = 'CONFLICT'): ApiError {
  return new ApiError(message, 409, errorCode)
}

/**
 * Error factory: 422 Unprocessable Entity
 */
export function unprocessableEntity(message: string, errorCode: string = 'UNPROCESSABLE_ENTITY'): ApiError {
  return new ApiError(message, 422, errorCode)
}

/**
 * Error factory: 429 Too Many Requests
 */
export function tooManyRequests(message: string = 'Too many requests', errorCode: string = 'RATE_LIMIT_EXCEEDED'): ApiError {
  return new ApiError(message, 429, errorCode)
}

/**
 * Error factory: 500 Internal Server Error
 */
export function internalError(message: string = 'Internal server error', errorCode: string = 'INTERNAL_ERROR'): ApiError {
  return new ApiError(message, 500, errorCode)
}

/**
 * Error factory: 503 Service Unavailable
 */
export function serviceUnavailable(message: string = 'Service unavailable', errorCode: string = 'SERVICE_UNAVAILABLE'): ApiError {
  return new ApiError(message, 503, errorCode)
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
