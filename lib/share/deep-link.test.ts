import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateDeepLink } from './deep-link'

describe('generateDeepLink', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

  beforeEach(() => {
    // Set test environment variable
    process.env.NEXT_PUBLIC_BASE_URL = 'https://retrophotoai.com'
  })

  afterEach(() => {
    // Restore original environment
    process.env.NEXT_PUBLIC_BASE_URL = originalEnv
  })

  it('should generate deep link with session ID', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000'
    const link = generateDeepLink(sessionId)

    expect(link).toBe(`https://retrophotoai.com/result/${sessionId}`)
  })

  it('should include protocol and domain', () => {
    const sessionId = 'abc123'
    const link = generateDeepLink(sessionId)

    expect(link).toMatch(/^https:\/\//)
    expect(link).toContain('retrophotoai.com')
  })

  it('should include result path', () => {
    const sessionId = 'test-session'
    const link = generateDeepLink(sessionId)

    expect(link).toContain('/result/')
  })

  it('should handle different session ID formats', () => {
    const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'
    const link = generateDeepLink(uuidv4)

    expect(link).toBe(`https://retrophotoai.com/result/${uuidv4}`)
  })

  it('should work with localhost in development', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

    const sessionId = 'dev-session'
    const link = generateDeepLink(sessionId)

    expect(link).toBe(`http://localhost:3000/result/${sessionId}`)
  })

  it('should generate shareable URL format', () => {
    const sessionId = 'share-test'
    const link = generateDeepLink(sessionId)

    // Should be a valid URL
    expect(() => new URL(link)).not.toThrow()

    // Should match expected pattern
    expect(link).toMatch(/^https:\/\/[^/]+\/result\/[^/]+$/)
  })
})
