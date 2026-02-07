import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Beta Email Allowlist', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset to known state
    delete process.env.BETA_MODE_ENABLED
    delete process.env.BETA_ALLOWED_EMAILS
    delete process.env.BETA_ALLOWED_DOMAINS
  })

  afterEach(() => {
    // Restore original env
    process.env.BETA_MODE_ENABLED = originalEnv.BETA_MODE_ENABLED
    process.env.BETA_ALLOWED_EMAILS = originalEnv.BETA_ALLOWED_EMAILS
    process.env.BETA_ALLOWED_DOMAINS = originalEnv.BETA_ALLOWED_DOMAINS
  })

  // Need to use dynamic imports to get fresh module state
  async function getModule() {
    // Clear module cache for fresh env reads
    const mod = await import('@/lib/auth/allowlist')
    return mod
  }

  it('should allow all emails when beta mode is disabled', async () => {
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('anyone@example.com')).toBe(true)
  })

  it('should allow listed email when beta mode is enabled', async () => {
    process.env.BETA_MODE_ENABLED = 'true'
    process.env.BETA_ALLOWED_EMAILS = 'alice@test.com,bob@test.com'
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('alice@test.com')).toBe(true)
  })

  it('should deny non-listed email when beta mode is enabled', async () => {
    process.env.BETA_MODE_ENABLED = 'true'
    process.env.BETA_ALLOWED_EMAILS = 'alice@test.com'
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('eve@hacker.com')).toBe(false)
  })

  it('should allow domain-listed email', async () => {
    process.env.BETA_MODE_ENABLED = 'true'
    process.env.BETA_ALLOWED_DOMAINS = 'company.com'
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('anyone@company.com')).toBe(true)
  })

  it('should handle case-insensitive comparison', async () => {
    process.env.BETA_MODE_ENABLED = 'true'
    process.env.BETA_ALLOWED_EMAILS = 'Alice@Test.COM'
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('alice@test.com')).toBe(true)
  })

  it('should deny all when beta enabled with empty allowlist', async () => {
    process.env.BETA_MODE_ENABLED = 'true'
    const { isEmailAllowed } = await getModule()
    expect(isEmailAllowed('anyone@example.com')).toBe(false)
  })
})
