---
phase: 01-security-fixes
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/security/csrf.ts
  - tests/e2e/auth-flow.spec.ts
  - .env.test.example
autonomous: true
user_setup: []
must_haves:
  truths:
    - CSRF validation rejects localhost origins in production
    - No plaintext credentials exist in any tracked source file
    - E2E tests skip gracefully when credentials are not in environment
  artifacts:
    - lib/security/csrf.ts (patched)
    - tests/e2e/auth-flow.spec.ts (patched)
    - .env.test.example (new)
  key_links:
    - .planning/01-security-fixes/01-CONTEXT.md
    - .planning/01-security-fixes/01-RESEARCH.md
---

<objective>
Fix two security vulnerabilities: CSRF localhost origin leak and hardcoded test credentials.

These are the highest-priority blockers for production deployment. After this plan executes, the codebase will have zero known credential leaks and correct CSRF behavior per environment.

Output artifacts:
- Patched `lib/security/csrf.ts` with conditional localhost
- Patched `tests/e2e/auth-flow.spec.ts` reading from env vars
- New `.env.test.example` documenting required test variables
</objective>

<tasks>

<task type="auto">
  <name>Conditionally include localhost in CSRF allowed origins</name>
  <files>lib/security/csrf.ts</files>
  <action>
    Replace lines 10-14 of `lib/security/csrf.ts` to conditionally include localhost origins:

    ```typescript
    const ALLOWED_ORIGINS = [
      process.env.NEXT_PUBLIC_BASE_URL,
      ...(process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:3001']
        : []),
    ].filter(Boolean) as string[]
    ```

    This is a surgical 2-line change. Do not modify any other part of the file.
    The spread + ternary pattern ensures:
    - Production: only `NEXT_PUBLIC_BASE_URL` (e.g., `https://retrophotoai.com`)
    - Development: `NEXT_PUBLIC_BASE_URL` + localhost:3000 + localhost:3001
  </action>
  <verify>
    Run: `NODE_ENV=production node -e "
      process.env.NEXT_PUBLIC_BASE_URL='https://retrophotoai.com';
      const origins = [
        process.env.NEXT_PUBLIC_BASE_URL,
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ].filter(Boolean);
      console.log(origins);
      process.exit(origins.includes('http://localhost:3000') ? 1 : 0);
    "`
    Expected: exits 0 (localhost NOT in list)
  </verify>
  <done>
    - `lib/security/csrf.ts` includes localhost ONLY when NODE_ENV === 'development'
    - File has no other changes
  </done>
</task>

<task type="auto">
  <name>Remove hardcoded credentials from E2E tests</name>
  <files>tests/e2e/auth-flow.spec.ts, .env.test.example</files>
  <action>
    1. In `tests/e2e/auth-flow.spec.ts`, replace hardcoded credentials:
       ```typescript
       const TEST_EMAIL = process.env.TEST_EMAIL || '';
       const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
       ```

    2. Add `test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured')`
       inside each test that uses credentials, right after the test function opens.

    3. Create `.env.test.example` with:
       ```
       # E2E Test Credentials
       # Copy this file to .env.test and fill in values
       # .env.test is gitignored and will not be committed
       TEST_EMAIL=
       TEST_PASSWORD=

       # Production URL for E2E tests
       PLAYWRIGHT_TEST_BASE_URL=https://retrophotoai.com
       ```

    4. Verify `.env.test` is already in `.gitignore`. If not, add it.
  </action>
  <verify>
    Run: `grep -r "Karmaisabitch" --include="*.ts" --include="*.js" --include="*.spec.ts" .`
    Expected: zero matches

    Run: `grep -r "mathieuwauters" --include="*.ts" --include="*.js" --include="*.spec.ts" .`
    Expected: zero matches

    Run: `cat .env.test.example`
    Expected: template file exists with placeholder variables
  </verify>
  <done>
    - Zero plaintext credentials in any TypeScript/JavaScript file
    - `.env.test.example` exists with documented variables
    - E2E tests skip gracefully when credentials are not configured
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the codebase to be free of known credential and CSRF leaks?
  1. `grep -rn "localhost" lib/security/csrf.ts` shows localhost only inside a development conditional
  2. `grep -rn "Karmaisabitch\|mathieuwauters" . --include="*.ts"` returns zero results
  3. `.env.test.example` exists and documents required test variables
  4. `npm test` still passes (no regressions in unit tests)
</verification>

<success_criteria>
  - CSRF: Production build excludes localhost from allowed origins
  - Credentials: Zero hardcoded secrets in source files
  - Tests: E2E tests skip gracefully without credentials; unit tests pass
  - No other files modified
</success_criteria>

<output>
  Save execution summary to: .planning/01-security-fixes/01-1-SUMMARY.md
</output>
