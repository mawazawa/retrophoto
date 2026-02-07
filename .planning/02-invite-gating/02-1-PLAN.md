---
phase: 02-invite-gating
plan: 1
type: execute
wave: 2
depends_on:
  - 01-1
  - 01-2
files_modified:
  - lib/auth/allowlist.ts
  - app/api/create-checkout-session/route.ts
  - tests/integration/allowlist.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - Non-allowlisted authenticated users cannot create checkout sessions
    - Allowlisted users can create checkout sessions
    - Guest users (no auth) cannot create checkout sessions (existing behavior)
    - Free tier works for everyone regardless of allowlist
    - BETA_MODE_ENABLED=false disables all gating
  artifacts:
    - lib/auth/allowlist.ts (new)
    - app/api/create-checkout-session/route.ts (patched)
    - tests/integration/allowlist.test.ts (new)
  key_links:
    - .planning/02-invite-gating/02-CONTEXT.md
    - app/api/create-checkout-session/route.ts
    - lib/auth/client.ts
---

<objective>
Implement email allowlist module and integrate it into the checkout endpoint. After this plan executes, only invited users can purchase credits. The gating is entirely server-side and controlled by environment variables.

Output artifacts:
- New `lib/auth/allowlist.ts` with `isEmailAllowed()` function
- Patched checkout endpoint with allowlist check
- Integration tests proving gating works
</objective>

<tasks>

<task type="auto">
  <name>Create email allowlist module</name>
  <files>lib/auth/allowlist.ts</files>
  <action>
    Create `lib/auth/allowlist.ts` with:

    ```typescript
    /**
     * Beta access control via email allowlist.
     * Configured entirely through environment variables.
     * Set BETA_MODE_ENABLED=true to enforce gating.
     */

    export function isBetaModeEnabled(): boolean {
      return process.env.BETA_MODE_ENABLED === 'true'
    }

    export function isEmailAllowed(email: string): boolean {
      // If beta mode is not enabled, everyone is allowed
      if (!isBetaModeEnabled()) return true

      const normalizedEmail = email.toLowerCase().trim()

      // Check individual email allowlist
      const allowedEmails = (process.env.BETA_ALLOWED_EMAILS || '')
        .split(',')
        .map(e => e.toLowerCase().trim())
        .filter(Boolean)

      if (allowedEmails.includes(normalizedEmail)) return true

      // Check domain allowlist
      const allowedDomains = (process.env.BETA_ALLOWED_DOMAINS || '')
        .split(',')
        .map(d => d.toLowerCase().trim())
        .filter(Boolean)

      const emailDomain = normalizedEmail.split('@')[1]
      if (emailDomain && allowedDomains.includes(emailDomain)) return true

      return false
    }
    ```

    Key design decisions:
    - Case-insensitive comparison (emails are case-insensitive per RFC 5321)
    - Trim whitespace (env vars may have spaces after commas)
    - Domain check uses exact match (no subdomain matching)
    - Returns `true` when beta mode is disabled (safe default for public launch)
  </action>
  <verify>
    Run: `npx tsc --noEmit lib/auth/allowlist.ts`
    Expected: no type errors
  </verify>
  <done>
    - `lib/auth/allowlist.ts` exports `isBetaModeEnabled()` and `isEmailAllowed()`
    - Function handles edge cases: case, whitespace, missing env vars
    - Returns true when beta mode disabled
  </done>
</task>

<task type="auto">
  <name>Integrate allowlist check into checkout endpoint</name>
  <files>app/api/create-checkout-session/route.ts</files>
  <action>
    Read the full checkout endpoint. Add the allowlist check AFTER auth verification, BEFORE Stripe session creation:

    ```typescript
    import { isEmailAllowed, isBetaModeEnabled } from '@/lib/auth/allowlist'

    // ... inside POST handler, after getting user ...

    // Beta access check
    if (isBetaModeEnabled()) {
      if (!user?.email || !isEmailAllowed(user.email)) {
        return NextResponse.json(
          {
            error: 'You are on the waitlist. We will notify you when access is available.',
            error_code: 'BETA_ACCESS_DENIED',
          },
          { status: 403 }
        )
      }
    }
    ```

    Key constraints:
    - Check AFTER auth (need the user's email)
    - Check BEFORE Stripe session creation (don't create sessions for denied users)
    - Use 403 status (Forbidden, not 401 Unauthorized)
    - Include friendly message (not technical error)
    - Include `error_code` for client-side handling
  </action>
  <verify>
    Read the patched file and confirm:
    1. Import statement for allowlist module exists
    2. Beta check is between auth check and Stripe session creation
    3. Returns 403 with BETA_ACCESS_DENIED error code
    4. Existing flow unchanged when beta mode is disabled
  </verify>
  <done>
    - Checkout endpoint rejects non-allowlisted users with 403
    - Checkout endpoint allows allowlisted users through
    - Checkout endpoint works normally when BETA_MODE_ENABLED is not set
  </done>
</task>

<task type="auto">
  <name>Add integration tests for allowlist gating</name>
  <files>tests/integration/allowlist.test.ts</files>
  <action>
    Create integration tests covering:

    1. Beta mode disabled → all emails allowed
    2. Beta mode enabled, allowlisted email → allowed
    3. Beta mode enabled, non-allowlisted email → denied
    4. Beta mode enabled, domain-allowlisted email → allowed
    5. Case insensitivity: `User@Example.COM` matches `user@example.com`
    6. Empty allowlist with beta mode enabled → all denied

    Set env vars in test setup using `vi.stubEnv()` or direct `process.env` assignment.
    Clean up env vars in afterEach.
  </action>
  <verify>
    Run: `npx vitest run tests/integration/allowlist.test.ts`
    Expected: all 6 test cases pass
  </verify>
  <done>
    - 6 integration tests covering all allowlist scenarios
    - All tests pass
    - No env var leakage between tests
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for invite-only gating to work?
  1. Setting `BETA_MODE_ENABLED=true` and `BETA_ALLOWED_EMAILS=alice@test.com` allows alice@test.com to checkout
  2. Setting `BETA_MODE_ENABLED=true` with bob@other.com logged in → 403 on checkout
  3. Removing `BETA_MODE_ENABLED` env var → everyone can checkout (public launch mode)
  4. Free tier (fingerprint quota) still works for everyone
  5. `npm test` passes
</verification>

<success_criteria>
  - Allowlist module created with correct logic
  - Checkout endpoint gated when beta mode enabled
  - 6 integration tests pass
  - No regressions in existing tests
  - Free tier unaffected
</success_criteria>

<output>
  Save execution summary to: .planning/02-invite-gating/02-1-SUMMARY.md
</output>
