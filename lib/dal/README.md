# Data Access Layer (DAL)

Centralized data access layer following Next.js 15 best practices for server-side data operations with built-in authorization checks.

## Overview

The DAL provides a clean, typed interface for all database operations with:
- **Server-only access** - Never import in client components
- **Fail-closed security** - Deny access on errors (especially quota checks)
- **Proper error handling** - PGRST116 handling for "no rows returned"
- **Structured logging** - All operations logged for debugging
- **Type safety** - Full TypeScript support with Supabase types

## Structure

```
lib/dal/
├── index.ts              # Barrel export (import from here)
├── user-credits.ts       # Credit operations
├── user-quota.ts         # Free tier quota operations
└── upload-sessions.ts    # Session management
```

## Usage Examples

### User Credits

```typescript
import { getCredits, hasCredits, deductCredit } from '@/lib/dal'

// Check if user has credits
const canRestore = await hasCredits(userId)

// Get credit balance
const credits = await getCredits(userId)
console.log(`User has ${credits} credits`)

// Deduct one credit
const result = await deductCredit(userId)
if (!result.success) {
  return { error: result.error, error_code: 'CREDIT_DEDUCTION_FAILED' }
}
```

### User Quota (Free Tier)

```typescript
import { checkQuota, incrementQuota } from '@/lib/dal'

// Check free tier quota (fail-closed)
try {
  const hasQuota = await checkQuota(fingerprint)
  if (!hasQuota) {
    return { error: 'Quota exceeded', error_code: 'QUOTA_EXCEEDED' }
  }
} catch (error) {
  // Fail-closed: deny access on error
  return { error: 'Service unavailable', error_code: 'QUOTA_CHECK_FAILED' }
}

// After successful restoration
await incrementQuota(fingerprint)
```

### Upload Sessions

```typescript
import { createSession, getSession, updateSessionStatus } from '@/lib/dal'

// Create new session
const session = await createSession({
  original_url: uploadedImageUrl,
  user_fingerprint: fingerprint,
  status: 'pending'
})

// Update status
await updateSessionStatus(session.id, 'processing')

// Get session with results
const sessionWithResults = await getSessionWithResults(session.id)
if (sessionWithResults?.restoration_results) {
  console.log(sessionWithResults.restoration_results.restored_url)
}
```

## API Reference

### User Credits (`user-credits.ts`)

#### `getCredits(userId: string): Promise<number>`
Get user's current credit balance (returns 0 if no record exists).

#### `hasCredits(userId: string): Promise<boolean>`
Check if user has at least 1 credit available (fail-closed).

#### `deductCredit(userId: string): Promise<DeductResult>`
Deduct one credit using FIFO (oldest batch first).

Returns:
```typescript
{
  success: boolean
  error?: string
  batchId?: string
  remainingInBatch?: number
}
```

#### `getCreditDetails(userId: string): Promise<UserCreditsRow | null>`
Get full credit record with all statistics.

### User Quota (`user-quota.ts`)

#### `checkQuota(fingerprint: string): Promise<boolean>`
Check free tier quota with fail-closed security.

**Throws** on database error (fail-closed requirement).

#### `incrementQuota(fingerprint: string): Promise<void>`
Increment quota usage after successful restoration.

#### `getQuotaDetails(fingerprint: string): Promise<CheckQuotaResult>`
Get detailed quota information including usage and limits.

#### `getQuotaRecord(fingerprint: string): Promise<UserQuotaRow | null>`
Get raw quota record from database.

### Upload Sessions (`upload-sessions.ts`)

#### `createSession(data: SessionData): Promise<UploadSessionRow>`
Create new upload session with 24-hour TTL.

Parameters:
```typescript
{
  original_url: string
  user_fingerprint: string
  status?: 'pending' | 'processing' | 'complete' | 'failed'
}
```

#### `getSession(sessionId: string): Promise<UploadSessionRow | null>`
Get session by ID (returns null if not found or expired).

#### `updateSessionStatus(sessionId: string, status: SessionStatus): Promise<UploadSessionRow>`
Update session status and increment retry count when moving to 'processing'.

#### `getSessionWithResults(sessionId: string): Promise<SessionWithResults | null>`
Get session with joined restoration results.

#### `getSessionsByFingerprint(fingerprint: string, limit?: number): Promise<UploadSessionRow[]>`
Get all sessions for a fingerprint (default limit: 10).

## Error Handling

All DAL functions follow these patterns:

### Database Errors
```typescript
try {
  const data = await getCredits(userId)
} catch (error) {
  // Handle database error
  // Error is logged automatically
}
```

### "No Rows" vs Real Errors
```typescript
// PGRST116 = "no rows returned" (expected for new users)
// Returns default value (0, false, null) instead of throwing

const credits = await getCredits(userId) // Returns 0 for new users
const session = await getSession(sessionId) // Returns null if not found
```

### Fail-Closed Security
```typescript
// Quota checks throw on error (fail-closed)
try {
  const hasQuota = await checkQuota(fingerprint)
  if (!hasQuota) {
    // User exceeded quota
  }
} catch (error) {
  // Database error - deny access for security
  return { error: 'Service unavailable' }
}
```

## Migration Guide

### From Old Pattern to DAL

**Before:**
```typescript
// In API route
const supabase = await createClient()
const { data, error } = await supabase
  .from('user_credits')
  .select('available_credits')
  .eq('user_id', userId)
  .single()

if (error && error.code !== 'PGRST116') {
  logger.error('Failed to check credits', { userId, error })
}

const hasCredits = data && data.available_credits > 0
```

**After:**
```typescript
// In API route
import { hasCredits } from '@/lib/dal'

const canRestore = await hasCredits(userId)
```

## Best Practices

1. **Always use DAL functions** - Don't query Supabase directly in API routes
2. **Handle errors appropriately** - Quota checks throw, other functions return defaults
3. **Use structured logging** - Errors are automatically logged with context
4. **Leverage TypeScript** - All functions are fully typed
5. **Server-only** - Never import DAL in client components

## Testing

```typescript
import { getCredits, hasCredits } from '@/lib/dal'

describe('User Credits DAL', () => {
  it('should return 0 for new user', async () => {
    const credits = await getCredits('new-user-id')
    expect(credits).toBe(0)
  })

  it('should check credit availability', async () => {
    const canRestore = await hasCredits('user-with-credits')
    expect(canRestore).toBe(true)
  })
})
```

## Constitutional Compliance

- **T077** - Structured logging: All operations logged
- **Security** - Fail-closed quota checks
- **TypeScript** - Strict mode compliance
- **Next.js 15** - Server-only async functions
