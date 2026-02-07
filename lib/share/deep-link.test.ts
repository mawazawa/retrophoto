import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateDeepLink, isValidUUID } from './deep-link'

describe('generateDeepLink', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

  // Valid UUIDs for testing
  const validUUID = '123e4567-e89b-12d3-a456-426614174000'
  const anotherValidUUID = '550e8400-e29b-41d4-a716-446655440000'
  const devSessionUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  const shareTestUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  beforeEach(() => {
    // Set test environment variable
    process.env.NEXT_PUBLIC_BASE_URL = 'https://retrophotoai.com'
  })

  afterEach(() => {
    // Restore original environment
    process.env.NEXT_PUBLIC_BASE_URL = originalEnv
  })

  it('should generate deep link with session ID', () => {
    const link = generateDeepLink(validUUID)

    expect(link).toBe(`https://retrophotoai.com/result/${validUUID}`)
  })

  it('should include protocol and domain', () => {
    const link = generateDeepLink(validUUID)

    expect(link).toMatch(/^https:\/\//)
    expect(link).toContain('retrophotoai.com')
  })

  it('should include result path', () => {
    const link = generateDeepLink(validUUID)

    expect(link).toContain('/result/')
  })

  it('should handle different session ID formats', () => {
    const link = generateDeepLink(anotherValidUUID)

    expect(link).toBe(`https://retrophotoai.com/result/${anotherValidUUID}`)
  })

  it('should work with localhost in development', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

    const link = generateDeepLink(devSessionUUID)

    expect(link).toBe(`http://localhost:3000/result/${devSessionUUID}`)
  })

  it('should generate shareable URL format', () => {
    const link = generateDeepLink(shareTestUUID)

    // Should be a valid URL
    expect(() => new URL(link)).not.toThrow()

    // Should match expected pattern
    expect(link).toMatch(/^https:\/\/[^/]+\/result\/[^/]+$/)
  })

  it('should throw error for invalid session ID', () => {
    expect(() => generateDeepLink('')).toThrow()
    expect(() => generateDeepLink('not-a-uuid')).toThrow()
    expect(() => generateDeepLink('abc123')).toThrow()
  })
})

describe('isValidUUID', () => {
  it('should return true for valid UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true)
  })

  it('should return false for invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('abc123')).toBe(false)
    expect(isValidUUID('')).toBe(false)
  })
})
