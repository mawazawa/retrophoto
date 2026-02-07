/**
 * Example Usage of API Error Boundary
 *
 * This file demonstrates how to use the error boundary wrapper
 * in API routes for consistent error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorBoundary } from './error-boundary'
import { badRequest, unauthorized, notFound } from './errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Example 1: Basic usage with automatic error handling
 */
export const GET = withErrorBoundary(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    // Throws ApiError which is automatically caught and formatted
    throw badRequest('Missing required parameter: session_id', 'MISSING_PARAMETER')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  // Supabase errors are automatically mapped to appropriate status codes
  if (error) {
    throw error
  }

  if (!data) {
    throw notFound('Session not found', 'SESSION_NOT_FOUND')
  }

  return NextResponse.json({ success: true, data })
})

/**
 * Example 2: Authenticated endpoint
 */
export const POST = withErrorBoundary(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw unauthorized('Authentication required', 'AUTH_REQUIRED')
  }

  const body = await request.json()

  // Validation errors are automatically caught
  if (!body.name) {
    throw badRequest('Name is required', 'INVALID_INPUT')
  }

  // Process the request
  const result = await processData(body)

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Data processed successfully',
  })
})

/**
 * Example 3: Using standard Error (automatically handled)
 */
export const DELETE = withErrorBoundary(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw badRequest('Missing ID parameter')
  }

  // Generic errors are automatically caught and mapped to 500
  const result = await dangerousOperation(id)

  return NextResponse.json({ success: true, deleted: true })
})

// Example helper functions
async function processData(data: any) {
  // Simulate processing
  return { processed: true, data }
}

async function dangerousOperation(id: string) {
  // This might throw any kind of error
  // The error boundary will catch and format it
  if (Math.random() > 0.5) {
    throw new Error('Operation failed unexpectedly')
  }
  return { success: true }
}

/**
 * Benefits of using withErrorBoundary:
 *
 * 1. Consistent error responses:
 *    { error: string, error_code: string, request_id: string }
 *
 * 2. Automatic request ID generation for tracing:
 *    X-Request-ID header is added to all responses
 *
 * 3. Structured logging:
 *    All errors are logged with full context
 *
 * 4. Error type mapping:
 *    - Supabase errors → appropriate status codes
 *    - Stripe errors → payment-related error codes
 *    - Zod errors → validation error messages
 *    - ApiError → custom status codes
 *    - Generic errors → 500 with safe message
 *
 * 5. No try-catch boilerplate:
 *    Just throw errors and they're automatically handled
 */
