import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateDeepLink, isValidUUID } from './deep-link'

/**
 * Bug Fix Verification Test for generateDeepLink
 *
 * Bug: Missing input validation and sanitization in generateDeepLink()
 * Location: lib/share/deep-link.ts
 *
 * Issues Fixed:
 * 1. Empty string inputs creating invalid URLs
 * 2. Null/undefined creating malformed URLs
 * 3. Path traversal security vulnerability
 * 4. Non-UUID session IDs (security hardening - now requires valid UUIDs)
 *
 * This test suite verifies all edge cases are properly handled.
 */

describe('Bug Fix: generateDeepLink Input Validation', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

  // Valid UUIDs for testing
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'
  const anotherUUID = '123e4567-e89b-12d3-a456-426614174000'
  const devUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://retrophotoai.com'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalEnv
  })

  describe('Empty and Invalid Input Validation', () => {
    it('should throw error for empty string', () => {
      expect(() => generateDeepLink('')).toThrow('Session ID is required and must be a non-empty string')
    })

    it('should throw error for whitespace-only string', () => {
      expect(() => generateDeepLink('   ')).toThrow('Session ID cannot be empty or whitespace')
      expect(() => generateDeepLink('\t\n')).toThrow('Session ID cannot be empty or whitespace')
    })

    it('should throw error for null input', () => {
      // @ts-expect-error - Testing runtime behavior with null
      expect(() => generateDeepLink(null)).toThrow('Session ID is required and must be a non-empty string')
    })

    it('should throw error for undefined input', () => {
      // @ts-expect-error - Testing runtime behavior with undefined
      expect(() => generateDeepLink(undefined)).toThrow('Session ID is required and must be a non-empty string')
    })

    it('should throw error for non-string input', () => {
      // @ts-expect-error - Testing runtime behavior with number
      expect(() => generateDeepLink(123)).toThrow('Session ID is required and must be a non-empty string')

      // @ts-expect-error - Testing runtime behavior with object
      expect(() => generateDeepLink({})).toThrow('Session ID is required and must be a non-empty string')
    })
  })

  describe('Security: UUID Format Required', () => {
    it('should reject non-UUID session IDs', () => {
      expect(() => generateDeepLink('abc123')).toThrow('Session ID must be a valid UUID format')
      expect(() => generateDeepLink('test-session')).toThrow('Session ID must be a valid UUID format')
      expect(() => generateDeepLink('session_123')).toThrow('Session ID must be a valid UUID format')
    })

    it('should reject path traversal attempts', () => {
      expect(() => generateDeepLink('../admin')).toThrow('Session ID must be a valid UUID format')
      expect(() => generateDeepLink('test/../admin')).toThrow('Session ID must be a valid UUID format')
    })

    it('should reject path separators', () => {
      expect(() => generateDeepLink('session/id')).toThrow('Session ID must be a valid UUID format')
      expect(() => generateDeepLink('session\\id')).toThrow('Session ID must be a valid UUID format')
    })

    it('should accept valid UUID v4 format', () => {
      const link = generateDeepLink(validUUID)
      expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
    })

    it('should accept valid UUID v1 format', () => {
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      const link = generateDeepLink(uuidV1)
      expect(link).toBe(`https://retrophotoai.com/result/${uuidV1}`)
    })
  })

  describe('Whitespace Handling', () => {
    it('should trim leading whitespace from valid UUID', () => {
      const link = generateDeepLink(`   ${validUUID}`)
      expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
    })

    it('should trim trailing whitespace from valid UUID', () => {
      const link = generateDeepLink(`${validUUID}   `)
      expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
    })

    it('should trim both leading and trailing whitespace', () => {
      const link = generateDeepLink(`  ${validUUID}  `)
      expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
    })
  })

  describe('Valid UUID Inputs', () => {
    it('should generate correct link for valid UUID v4', () => {
      const link = generateDeepLink(validUUID)
      expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
    })

    it('should handle different valid UUIDs', () => {
      const link = generateDeepLink(anotherUUID)
      expect(link).toBe(`https://retrophotoai.com/result/${anotherUUID}`)
    })

    it('should work with localhost in development', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
      const link = generateDeepLink(devUUID)
      expect(link).toBe(`http://localhost:3000/result/${devUUID}`)
    })
  })

  describe('URL Format Validation', () => {
    it('should generate valid URL format', () => {
      const link = generateDeepLink(validUUID)
      expect(() => new URL(link)).not.toThrow()
    })

    it('should not create double slashes in path (except in protocol)', () => {
      const link = generateDeepLink(validUUID)
      // Protocol https:// is allowed, but no double slashes in path
      const withoutProtocol = link.replace(/^https?:\/\//, '')
      expect(withoutProtocol).not.toContain('//')
      expect(link).toMatch(/^https:\/\/[^/]+\/result\/[^/]+$/)
    })

    it('should create shareable social media URLs', () => {
      const link = generateDeepLink(validUUID)

      // Should be a valid URL
      const url = new URL(link)
      expect(url.protocol).toBe('https:')
      expect(url.pathname).toMatch(/^\/result\/[^/]+$/)

      // Should not have query params or fragments
      expect(url.search).toBe('')
      expect(url.hash).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle uppercase UUIDs (case insensitive)', () => {
      const uppercaseUUID = validUUID.toUpperCase()
      const link = generateDeepLink(uppercaseUUID)
      expect(link).toContain(uppercaseUUID)
      expect(() => new URL(link)).not.toThrow()
    })

    it('should be case-preserving for session IDs', () => {
      const mixedCase = '550E8400-E29B-41D4-A716-446655440000'
      const link = generateDeepLink(mixedCase)
      expect(link).toContain(mixedCase)
    })
  })
})

describe('isValidUUID', () => {
  it('should return true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('should return true for valid UUID v1', () => {
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
  })

  it('should return false for invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('abc123')).toBe(false)
    expect(isValidUUID('')).toBe(false)
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false) // Too short
  })

  it('should handle uppercase UUIDs', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })
})
