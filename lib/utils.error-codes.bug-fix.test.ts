import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './utils'

/**
 * Bug Fix Verification Test for getErrorMessage()
 *
 * Bug: Missing error code mappings for API error codes
 * Location: lib/utils.ts (lines 71-90)
 *
 * Issues Fixed:
 * 1. DATABASE_ERROR not mapped (used in app/api/quota/route.ts line 60)
 * 2. MISSING_FINGERPRINT not mapped (used in app/api/quota/route.ts line 13, app/api/restore/route.ts line 31)
 * 3. INVALID_FINGERPRINT not mapped (used in app/api/quota/route.ts line 24)
 *
 * Impact:
 * - Users received generic "An error occurred" messages instead of specific guidance
 * - API returned error codes but UI couldn't display appropriate messages
 * - Poor UX during database errors and validation failures
 *
 * This test verifies all error codes used in the API have proper message mappings.
 */

describe('Bug Fix: getErrorMessage Missing Error Code Mappings', () => {
  describe('Previously Missing Error Codes (Bug)', () => {
    it('should return specific message for DATABASE_ERROR', () => {
      const message = getErrorMessage('DATABASE_ERROR')

      // Before fix: returned "An error occurred. Please try again."
      // After fix: returns specific database error message
      expect(message).not.toBe('An error occurred. Please try again.')
      expect(message).toBe('Failed to retrieve quota status. Please try again.')
    })

    it('should return specific message for MISSING_FINGERPRINT', () => {
      const message = getErrorMessage('MISSING_FINGERPRINT')

      // Before fix: returned generic error
      // After fix: returns specific validation error
      expect(message).not.toBe('An error occurred. Please try again.')
      expect(message).toBe('Missing fingerprint parameter.')
    })

    it('should return specific message for INVALID_FINGERPRINT', () => {
      const message = getErrorMessage('INVALID_FINGERPRINT')

      // Before fix: returned generic error
      // After fix: returns specific validation error
      expect(message).not.toBe('An error occurred. Please try again.')
      expect(message).toBe('Invalid fingerprint format.')
    })
  })

  describe('Existing Error Codes (Regression Check)', () => {
    it('should return message for FILE_TOO_LARGE', () => {
      expect(getErrorMessage('FILE_TOO_LARGE')).toBe(
        'Photo too large. Please upload images under 20MB.'
      )
    })

    it('should return message for INVALID_FILE_TYPE', () => {
      expect(getErrorMessage('INVALID_FILE_TYPE')).toBe(
        'Please upload a valid image file (JPG, PNG, HEIC, WEBP).'
      )
    })

    it('should return message for QUOTA_EXCEEDED', () => {
      expect(getErrorMessage('QUOTA_EXCEEDED')).toBe(
        'Free restore limit reached. Upgrade for unlimited restorations.'
      )
    })

    it('should return message for AI_MODEL_ERROR', () => {
      expect(getErrorMessage('AI_MODEL_ERROR')).toBe(
        'Restoration failed. Please try again or contact support.'
      )
    })

    it('should return message for TIMEOUT', () => {
      expect(getErrorMessage('TIMEOUT')).toBe(
        'Processing took longer than expected. Please try again.'
      )
    })
  })

  describe('Complete API Error Code Coverage', () => {
    it('should have mappings for all API error codes', () => {
      // All error codes used in app/api/ routes
      const apiErrorCodes = [
        'DATABASE_ERROR',
        'MISSING_FINGERPRINT',
        'INVALID_FINGERPRINT',
        'INVALID_FILE_TYPE',
        'QUOTA_EXCEEDED',
        'AI_MODEL_ERROR',
      ]

      apiErrorCodes.forEach(code => {
        const message = getErrorMessage(code)
        expect(message).not.toBe('An error occurred. Please try again.')
        expect(message).toBeTruthy()
        expect(message.length).toBeGreaterThan(0)
      })
    })

    it('should return user-friendly messages for all codes', () => {
      const errorCodes = [
        'DATABASE_ERROR',
        'MISSING_FINGERPRINT',
        'INVALID_FINGERPRINT',
        'FILE_TOO_LARGE',
        'INVALID_FILE_TYPE',
        'QUOTA_EXCEEDED',
        'AI_MODEL_ERROR',
        'TIMEOUT',
      ]

      errorCodes.forEach(code => {
        const message = getErrorMessage(code)

        // Should not contain technical jargon
        expect(message).not.toMatch(/PGRST|postgres|SQL|code:/i)

        // Should be user-friendly (not technical error codes)
        expect(message).not.toMatch(/^[A-Z_]+$/)
        expect(message.length).toBeGreaterThan(10)
      })
    })
  })

  describe('Default Behavior', () => {
    it('should return default message for unknown codes', () => {
      expect(getErrorMessage('UNKNOWN_CODE')).toBe('An error occurred. Please try again.')
      expect(getErrorMessage('RANDOM_ERROR')).toBe('An error occurred. Please try again.')
    })

    it('should return default message for empty string', () => {
      expect(getErrorMessage('')).toBe('An error occurred. Please try again.')
    })

    it('should handle case sensitivity', () => {
      // Error codes are case-sensitive
      expect(getErrorMessage('database_error')).toBe('An error occurred. Please try again.')
      expect(getErrorMessage('DATABASE_ERROR')).not.toBe('An error occurred. Please try again.')
    })
  })

  describe('Error Message Quality', () => {
    it('should provide actionable messages', () => {
      // DATABASE_ERROR should suggest retry
      expect(getErrorMessage('DATABASE_ERROR')).toContain('try again')

      // MISSING_FINGERPRINT should identify the issue
      expect(getErrorMessage('MISSING_FINGERPRINT')).toContain('fingerprint')

      // INVALID_FINGERPRINT should identify the issue
      expect(getErrorMessage('INVALID_FINGERPRINT')).toContain('fingerprint')
    })

    it('should be concise and clear', () => {
      const errorCodes = [
        'DATABASE_ERROR',
        'MISSING_FINGERPRINT',
        'INVALID_FINGERPRINT',
      ]

      errorCodes.forEach(code => {
        const message = getErrorMessage(code)

        // Should be reasonably short (under 100 characters)
        expect(message.length).toBeLessThan(100)

        // Should be a complete sentence or phrase
        expect(message.length).toBeGreaterThan(10)
      })
    })
  })

  describe('Integration with API Responses', () => {
    it('should match DATABASE_ERROR from quota API', () => {
      // app/api/quota/route.ts line 60 returns DATABASE_ERROR
      const message = getErrorMessage('DATABASE_ERROR')
      expect(message).toContain('quota')
    })

    it('should match MISSING_FINGERPRINT from APIs', () => {
      // Used in both quota and restore APIs
      const message = getErrorMessage('MISSING_FINGERPRINT')
      expect(message).toContain('fingerprint')
      expect(message).toContain('Missing')
    })

    it('should match INVALID_FINGERPRINT from quota API', () => {
      // app/api/quota/route.ts line 24 validates fingerprint
      const message = getErrorMessage('INVALID_FINGERPRINT')
      expect(message).toContain('fingerprint')
      expect(message).toContain('Invalid')
    })
  })
})
