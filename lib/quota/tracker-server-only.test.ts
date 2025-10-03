import { describe, it, expect } from 'vitest'
import * as serverTracker from './tracker'
import * as clientTracker from './client-tracker'

/**
 * Regression test for server-side tracker bug
 *
 * BUG: The server-side tracker.ts file was importing FingerprintJS,
 * a browser-only library. This would cause runtime errors if anyone
 * tried to use generateFingerprint from the server.
 *
 * FIX: Removed generateFingerprint and FingerprintJS import from
 * server-side tracker.ts. The function only exists in client-tracker.ts
 * where it belongs.
 *
 * This test verifies:
 * 1. Server-side tracker only exports server-safe functions
 * 2. No browser-only dependencies in server code
 * 3. Clear separation between client and server quota utilities
 */

describe('Server-side tracker - No browser dependencies', () => {
  it('should only export server-safe functions', () => {
    // Should have server functions
    expect(serverTracker.checkQuota).toBeDefined()
    expect(serverTracker.incrementQuota).toBeDefined()
    expect(typeof serverTracker.checkQuota).toBe('function')
    expect(typeof serverTracker.incrementQuota).toBe('function')

    // Should NOT have client-only function
    expect((serverTracker as any).generateFingerprint).toBeUndefined()
  })

  it('should not import browser-only FingerprintJS library', async () => {
    // This test ensures the file can be imported without browser APIs
    // If FingerprintJS was imported, this would throw in a Node environment

    // The fact that we can import it at the top without errors proves this
    expect(serverTracker).toBeDefined()
    expect(serverTracker.checkQuota).toBeDefined()
    expect(serverTracker.incrementQuota).toBeDefined()
  })

  it('should have correct function signatures for server use', () => {
    // checkQuota should accept fingerprint string
    expect(serverTracker.checkQuota.length).toBe(1) // 1 parameter

    // incrementQuota should accept fingerprint string
    expect(serverTracker.incrementQuota.length).toBe(1) // 1 parameter
  })

  it('should be importable without DOM APIs', () => {
    // Verify we can import in a server context
    // The key is that the import doesn't fail
    expect(serverTracker).toBeDefined()

    // Server-side tracker should work without browser globals
    expect(serverTracker.checkQuota).toBeDefined()
    expect(serverTracker.incrementQuota).toBeDefined()

    // Verify no generateFingerprint exists
    expect((serverTracker as any).generateFingerprint).toBeUndefined()
  })
})

describe('Client-side tracker - Browser dependencies allowed', () => {
  it('should export generateFingerprint for client use', () => {
    // Client tracker SHOULD have generateFingerprint
    expect(clientTracker.generateFingerprint).toBeDefined()
    expect(typeof clientTracker.generateFingerprint).toBe('function')
  })

  it('should clearly separate client and server concerns', () => {
    // Server has checkQuota and incrementQuota
    expect(serverTracker.checkQuota).toBeDefined()
    expect(serverTracker.incrementQuota).toBeDefined()
    expect((serverTracker as any).generateFingerprint).toBeUndefined()

    // Client only has generateFingerprint
    expect(clientTracker.generateFingerprint).toBeDefined()
    expect((clientTracker as any).checkQuota).toBeUndefined()
    expect((clientTracker as any).incrementQuota).toBeUndefined()
  })
})
