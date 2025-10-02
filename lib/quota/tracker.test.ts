import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateFingerprint } from './tracker'

// Mock FingerprintJS
vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        get: vi.fn(() =>
          Promise.resolve({
            visitorId: 'test-fingerprint-12345',
          })
        ),
      })
    ),
  },
}))

describe('generateFingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a fingerprint', async () => {
    const fingerprint = await generateFingerprint()
    expect(fingerprint).toBe('test-fingerprint-12345')
    expect(typeof fingerprint).toBe('string')
    expect(fingerprint.length).toBeGreaterThan(0)
  })

  it('should generate consistent fingerprints', async () => {
    const fp1 = await generateFingerprint()
    const fp2 = await generateFingerprint()

    // Same session should get same fingerprint
    expect(fp1).toBe(fp2)
  })

  it('should handle browser environment', async () => {
    // Test that it works in browser-like environment
    const fingerprint = await generateFingerprint()
    expect(fingerprint).toBeTruthy()
  })
})

// Note: Integration tests for checkQuota and incrementQuota require Supabase connection
// and are better suited for E2E tests (see tests/integration/quota.test.ts)
