/**
 * UUID Validation Utilities
 *
 * Provides validation for UUIDs to prevent SQL injection and
 * ensure data integrity.
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Check if a string is a valid UUID v4
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }
  return UUID_REGEX.test(value)
}

/**
 * Validate a session ID parameter
 * Returns the validated session ID or null if invalid
 */
export function validateSessionId(sessionId: string | null | undefined): string | null {
  if (!sessionId) {
    return null
  }

  if (!isValidUUID(sessionId)) {
    return null
  }

  return sessionId
}

/**
 * Validate session ID with error details
 */
export function validateSessionIdWithError(sessionId: string | null | undefined): {
  valid: boolean
  sessionId: string | null
  error?: string
} {
  if (!sessionId) {
    return { valid: false, sessionId: null, error: 'Session ID is required' }
  }

  if (!isValidUUID(sessionId)) {
    return { valid: false, sessionId: null, error: 'Invalid session ID format' }
  }

  return { valid: true, sessionId }
}
