/**
 * Data Access Layer (DAL) - Barrel Export
 *
 * Centralized data access following Next.js 15 best practices.
 *
 * Key principles:
 * - Server-only data access (never import in client components)
 * - Authorization checks built-in
 * - Fail-closed security (deny on errors)
 * - Typed return values
 * - Structured logging
 * - Proper error handling
 *
 * Usage:
 * ```typescript
 * import { getCredits, hasCredits, deductCredit } from '@/lib/dal'
 * import { checkQuota, incrementQuota } from '@/lib/dal'
 * import { createSession, getSession, updateSessionStatus } from '@/lib/dal'
 * ```
 *
 * Or import from specific modules:
 * ```typescript
 * import { getCredits } from '@/lib/dal/user-credits'
 * import { checkQuota } from '@/lib/dal/user-quota'
 * import { createSession } from '@/lib/dal/upload-sessions'
 * ```
 */

// User Credits
export {
  getCredits,
  hasCredits,
  deductCredit,
  getCreditDetails,
} from './user-credits'

// User Quota
export {
  checkQuota,
  incrementQuota,
  getQuotaDetails,
  getQuotaRecord,
} from './user-quota'

// Upload Sessions
export {
  createSession,
  getSession,
  updateSessionStatus,
  getSessionWithResults,
  getSessionsByFingerprint,
} from './upload-sessions'
