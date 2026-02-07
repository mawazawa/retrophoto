/**
 * Beta access control via email allowlist.
 * Configured entirely through environment variables.
 * Set BETA_MODE_ENABLED=true to enforce gating.
 */

export function isBetaModeEnabled(): boolean {
  return process.env.BETA_MODE_ENABLED === 'true'
}

export function isEmailAllowed(email: string): boolean {
  if (!isBetaModeEnabled()) return true

  const normalizedEmail = email.toLowerCase().trim()

  const allowedEmails = (process.env.BETA_ALLOWED_EMAILS || '')
    .split(',')
    .map(e => e.toLowerCase().trim())
    .filter(Boolean)

  if (allowedEmails.includes(normalizedEmail)) return true

  const allowedDomains = (process.env.BETA_ALLOWED_DOMAINS || '')
    .split(',')
    .map(d => d.toLowerCase().trim())
    .filter(Boolean)

  const emailDomain = normalizedEmail.split('@')[1]
  if (emailDomain && allowedDomains.includes(emailDomain)) return true

  return false
}
