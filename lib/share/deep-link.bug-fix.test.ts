import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateDeepLink } from './deep-link'

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
 * 4. Whitespace not trimmed
 * 5. Special characters not URL-encoded
 *
 * This test suite verifies all edge cases are properly handled.
 */

describe('Bug Fix: generateDeepLink Input Validation', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

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

  describe('Security: Path Traversal Protection', () => {
    it('should reject path traversal with ../ ', () => {
      expect(() => generateDeepLink('../admin')).toThrow('Session ID contains invalid path traversal characters')
      expect(() => generateDeepLink('test/../admin')).toThrow('Session ID contains invalid path traversal characters')
      expect(() => generateDeepLink('../../etc/passwd')).toThrow('Session ID contains invalid path traversal characters')
    })

    it('should reject path traversal with ..\\ (Windows style)', () => {
      expect(() => generateDeepLink('..\\admin')).toThrow('Session ID contains invalid path traversal characters')
      expect(() => generateDeepLink('test..\\admin')).toThrow('Session ID contains invalid path traversal characters')
    })

    it('should reject forward slashes in session ID', () => {
      expect(() => generateDeepLink('session/id')).toThrow('Session ID cannot contain path separators')
      expect(() => generateDeepLink('test/admin/page')).toThrow('Session ID cannot contain path separators')
    })

    it('should reject backslashes in session ID', () => {
      expect(() => generateDeepLink('session\\id')).toThrow('Session ID cannot contain path separators')
      expect(() => generateDeepLink('test\\admin\\page')).toThrow('Session ID cannot contain path separators')
    })
  })

  describe('Whitespace Handling', () => {
    it('should trim leading whitespace', () => {
      const link = generateDeepLink('   session-123')
      expect(link).toBe('https://retrophotoai.com/result/session-123')
    })

    it('should trim trailing whitespace', () => {
      const link = generateDeepLink('session-123   ')
      expect(link).toBe('https://retrophotoai.com/result/session-123')
    })

    it('should trim both leading and trailing whitespace', () => {
      const link = generateDeepLink('  session-123  ')
      expect(link).toBe('https://retrophotoai.com/result/session-123')
    })

    it('should preserve internal spaces after encoding', () => {
      const link = generateDeepLink('session 123')
      expect(link).toBe('https://retrophotoai.com/result/session%20123')
    })
  })

  describe('Special Character Encoding', () => {
    it('should URL-encode spaces', () => {
      const link = generateDeepLink('test session')
      expect(link).toContain('test%20session')
    })

    it('should URL-encode special characters', () => {
      const link = generateDeepLink('test@session#123')
      expect(link).toContain('%40') // @ encoded
      expect(link).toContain('%23') // # encoded
    })

    it('should URL-encode Unicode characters', () => {
      const link = generateDeepLink('测试')
      expect(link).toContain('%E6%B5%8B') // Unicode encoding
    })

    it('should URL-encode query-like characters', () => {
      const link = generateDeepLink('session?id=123&key=value')
      expect(link).toContain('%3F') // ? encoded
      expect(link).toContain('%3D') // = encoded
      expect(link).toContain('%26') // & encoded
    })
  })

  describe('Valid Inputs', () => {
    it('should generate correct link for valid UUID v4', () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440000'
      const link = generateDeepLink(sessionId)
      expect(link).toBe(`https://retrophotoai.com/result/${sessionId}`)
    })

    it('should generate correct link for alphanumeric session ID', () => {
      const sessionId = 'abc123xyz'
      const link = generateDeepLink(sessionId)
      expect(link).toBe(`https://retrophotoai.com/result/${sessionId}`)
    })

    it('should generate correct link with hyphens and underscores', () => {
      const sessionId = 'test-session_123'
      const link = generateDeepLink(sessionId)
      expect(link).toBe(`https://retrophotoai.com/result/${sessionId}`)
    })

    it('should work with localhost in development', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
      const sessionId = 'dev-session'
      const link = generateDeepLink(sessionId)
      expect(link).toBe('http://localhost:3000/result/dev-session')
    })
  })

  describe('URL Format Validation', () => {
    it('should generate valid URL format', () => {
      const link = generateDeepLink('test-123')
      expect(() => new URL(link)).not.toThrow()
    })

    it('should not create double slashes in path (except in protocol)', () => {
      const link = generateDeepLink('session-id')
      // Protocol https:// is allowed, but no double slashes in path
      const withoutProtocol = link.replace(/^https?:\/\//, '')
      expect(withoutProtocol).not.toContain('//')
      expect(link).toMatch(/^https:\/\/[^/]+\/result\/[^/]+$/)
    })

    it('should create shareable social media URLs', () => {
      const link = generateDeepLink('social-test-123')

      // Should be a valid URL
      const url = new URL(link)
      expect(url.protocol).toBe('https:')
      expect(url.pathname).toMatch(/^\/result\/[^/]+$/)

      // Should not have query params or fragments from session ID
      expect(url.search).toBe('')
      expect(url.hash).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle session IDs with dots (but not path traversal)', () => {
      const link = generateDeepLink('session.id.123')
      expect(link).toBe('https://retrophotoai.com/result/session.id.123')
    })

    it('should handle very long session IDs', () => {
      const longId = 'a'.repeat(100)
      const link = generateDeepLink(longId)
      expect(link).toContain(longId)
      expect(() => new URL(link)).not.toThrow()
    })

    it('should be case-sensitive for session IDs', () => {
      const link1 = generateDeepLink('SessionID')
      const link2 = generateDeepLink('sessionid')
      expect(link1).not.toBe(link2)
      expect(link1).toContain('SessionID')
      expect(link2).toContain('sessionid')
    })
  })
})
