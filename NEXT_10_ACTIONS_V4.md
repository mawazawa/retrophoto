# Next 10 Highest-Leverage Actions (v4)

> Generated: January 2026
> Status: Ready for Execution
> Previous: NEXT_10_ACTIONS_V3.md (Actions 21-30)
> Each action contains 10-20 atomic tasks, each touching ≤4-5 files with clear success criteria.

---

## Overview

This document addresses **critical security issues** discovered in January 2026:
- 🔴 Exposed webhook secrets in documentation
- 🔴 Known vulnerabilities in @sentry/nextjs
- 🟠 Failing test suite (50 failures)
- 🟠 Missing security headers
- 🟡 In-memory rate limiting (resets on cold start)

---

## Action 1: Rotate Exposed Webhook Secrets

**Severity**: 🔴 CRITICAL
**Risk**: Real Stripe webhook secret `whsec_<YOUR_WEBHOOK_SECRET>` exposed in 7+ documentation files
**Impact**: Attackers could forge webhook events, grant themselves credits, trigger refunds

### Tasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 1.1 | Generate new webhook secret in Stripe Dashboard | External (Stripe) | New `whsec_*` secret generated in Stripe Dashboard → Developers → Webhooks |
| 1.2 | Update Vercel production environment variable | External (Vercel) | `vercel env rm STRIPE_WEBHOOK_SECRET production && vercel env add STRIPE_WEBHOOK_SECRET production` succeeds |
| 1.3 | Update local `.env.local` with new secret | `.env.local` | Local file updated, `npm run dev` starts without webhook errors |
| 1.4 | Redact secret from DEPLOYMENT_COMPLETE.md | `DEPLOYMENT_COMPLETE.md` | Replace all `whsec_<YOUR_WEBHOOK_SECRET>` with `whsec_<YOUR_WEBHOOK_SECRET>` |
| 1.5 | Redact secret from DEPLOYMENT_FINAL_STEPS.md | `DEPLOYMENT_FINAL_STEPS.md` | Replace all `whsec_<YOUR_WEBHOOK_SECRET>` with `whsec_<YOUR_WEBHOOK_SECRET>` |
| 1.6 | Redact secret from STRIPE_WEBHOOK_SETUP.md | `STRIPE_WEBHOOK_SETUP.md` | Replace all `whsec_<YOUR_WEBHOOK_SECRET>` with `whsec_<YOUR_WEBHOOK_SECRET>` |
| 1.7 | Redact secret from DEPLOYMENT_SUMMARY.md | `DEPLOYMENT_SUMMARY.md` | Replace `whsec_<YOUR_WEBHOOK_SECRET>` with `whsec_<YOUR_WEBHOOK_SECRET>` |
| 1.8 | Redact secret from WEBHOOK_CONFIGURATION.md | `WEBHOOK_CONFIGURATION.md` | Replace `whsec_<YOUR_WEBHOOK_SECRET>` with `whsec_<YOUR_WEBHOOK_SECRET>` |
| 1.9 | Verify no secrets remain in codebase | All `.md` files | `grep -r "whsec_[A-Za-z0-9]{20,}" . --include="*.md"` returns only `.env.example` placeholders |
| 1.10 | Test webhook with new secret locally | `app/api/webhooks/stripe/route.ts` | `stripe trigger checkout.session.completed` succeeds with 200 response |
| 1.11 | Test webhook in production | External (Stripe Dashboard) | Stripe Dashboard shows successful webhook delivery (200 status) |
| 1.12 | Document secret rotation procedure | `docs/SECRET_ROTATION.md` | New file created with step-by-step rotation guide |

---

## Action 2: Update Vulnerable Dependencies

**Severity**: 🔴 CRITICAL
**Risk**: @sentry/nextjs GHSA-6465-jgvq-jhgp leaks sensitive headers when sendDefaultPii=true
**Impact**: Authorization headers, cookies could be exposed to Sentry

### Tasks (15 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 2.1 | Audit current vulnerabilities | `package.json` | Run `npm audit` and document all HIGH/CRITICAL vulnerabilities |
| 2.2 | Update @sentry/nextjs to 10.32.1+ | `package.json`, `package-lock.json` | `npm install @sentry/nextjs@latest` succeeds, version ≥10.27.0 |
| 2.3 | Verify Sentry configuration | `sentry.client.config.ts`, `sentry.server.config.ts` | Confirm `sendDefaultPii` is false or headers are filtered |
| 2.4 | Update @supabase/supabase-js | `package.json`, `package-lock.json` | `npm install @supabase/supabase-js@latest` succeeds, version ≥2.89.0 |
| 2.5 | Update @supabase/ssr | `package.json`, `package-lock.json` | `npm install @supabase/ssr@latest` succeeds, version ≥0.8.0 |
| 2.6 | Update next to latest patch | `package.json`, `package-lock.json` | `npm install next@15.5.9` succeeds (stay on 15.x for stability) |
| 2.7 | Update @lhci/cli or remove if unused | `package.json`, `package-lock.json` | Either update to fix inquirer/tmp vulns or remove if lighthouse not used |
| 2.8 | Run npm audit fix | `package-lock.json` | `npm audit fix` resolves all auto-fixable vulnerabilities |
| 2.9 | Run npm audit fix --force for remaining | `package-lock.json` | Review breaking changes, apply if safe |
| 2.10 | Run full test suite | All test files | `npm test` passes with no new failures |
| 2.11 | Run typecheck | All `.ts`/`.tsx` files | `npm run typecheck` passes |
| 2.12 | Run build | All source files | `npm run build` succeeds |
| 2.13 | Test critical user flows manually | N/A (manual) | Upload, restore, checkout flows work in dev |
| 2.14 | Update Playwright | `package.json`, `package-lock.json` | `npm install @playwright/test@latest` and `npx playwright install` |
| 2.15 | Run E2E tests | `tests/e2e/*.spec.ts` | `npm run test:e2e` passes |

---

## Action 3: Fix Checkout Session Test Failures

**Severity**: 🟠 HIGH
**Risk**: 50 failing tests reduce confidence in code changes
**Impact**: Tests expect 401 Unauthorized but CSRF protection returns 403 Forbidden

### Tasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 3.1 | Analyze CSRF middleware behavior | `lib/security/csrf.ts`, `middleware.ts` | Document when CSRF returns 403 vs when auth returns 401 |
| 3.2 | Check route handler order | `app/api/create-checkout-session/route.ts` | Verify CSRF check happens before auth check |
| 3.3 | Update test to expect 403 for CSRF | `app/api/create-checkout-session/route.test.ts` | Change line 99: `expect(response.status).toBe(403)` |
| 3.4 | Update test error expectations | `app/api/create-checkout-session/route.test.ts` | Update `error_code` expectation to match CSRF response |
| 3.5 | Add dedicated CSRF test case | `app/api/create-checkout-session/route.test.ts` | New test: "should return 403 for CSRF violation" |
| 3.6 | Add dedicated auth test with valid CSRF | `app/api/create-checkout-session/route.test.ts` | New test with Origin header set, expects 401 |
| 3.7 | Fix bug-fix test file | `app/api/create-checkout-session/route.bug-fix.test.ts` | Update expectations to match actual behavior |
| 3.8 | Run checkout tests | `app/api/create-checkout-session/*.test.ts` | All checkout tests pass |
| 3.9 | Run full test suite | All test files | `npm test` shows improved pass rate |
| 3.10 | Document CSRF + Auth order | `docs/API_SECURITY.md` | Document that CSRF (403) is checked before Auth (401) |

---

## Action 4: Add Security Headers Middleware

**Severity**: 🟠 HIGH
**Risk**: Missing security headers expose app to XSS, clickjacking, MIME sniffing attacks
**Impact**: Follows Next.js 15 security recommendations

### Tasks (14 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 4.1 | Audit current response headers | N/A (browser devtools) | Document which security headers are missing |
| 4.2 | Create security headers config | `lib/security/headers.ts` | New file with header definitions |
| 4.3 | Add X-Content-Type-Options | `lib/security/headers.ts` | `X-Content-Type-Options: nosniff` defined |
| 4.4 | Add X-Frame-Options | `lib/security/headers.ts` | `X-Frame-Options: DENY` defined |
| 4.5 | Add X-XSS-Protection | `lib/security/headers.ts` | `X-XSS-Protection: 1; mode=block` defined |
| 4.6 | Add Referrer-Policy | `lib/security/headers.ts` | `Referrer-Policy: strict-origin-when-cross-origin` defined |
| 4.7 | Add Permissions-Policy | `lib/security/headers.ts` | Restrict camera, microphone, geolocation |
| 4.8 | Create CSP header (report-only first) | `lib/security/headers.ts` | `Content-Security-Policy-Report-Only` with safe defaults |
| 4.9 | Add Strict-Transport-Security | `lib/security/headers.ts` | `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| 4.10 | Update middleware to apply headers | `middleware.ts` | Import and apply security headers to all responses |
| 4.11 | Add headers to next.config.ts | `next.config.ts` | Add `headers()` function for static assets |
| 4.12 | Test headers in development | N/A (browser devtools) | All security headers present in response |
| 4.13 | Create security headers test | `tests/security/headers.test.ts` | Automated test verifies all headers present |
| 4.14 | Document security headers | `CLAUDE.md` | Add Security Headers section to documentation |

---

## Action 5: Upgrade to Upstash Redis Rate Limiting

**Severity**: 🟠 HIGH
**Risk**: In-memory rate limiting resets on serverless cold starts
**Impact**: Production-ready distributed rate limiting across all function instances

### Tasks (16 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 5.1 | Create Upstash Redis database | External (Upstash Console) | Database created, REST URL and token obtained |
| 5.2 | Add Upstash environment variables | `.env.local`, `.env.example` | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` added |
| 5.3 | Install @upstash/ratelimit | `package.json`, `package-lock.json` | `npm install @upstash/ratelimit @upstash/redis` succeeds |
| 5.4 | Create Upstash client | `lib/rate-limit/upstash.ts` | New file with Redis client initialization |
| 5.5 | Create sliding window limiter | `lib/rate-limit/upstash.ts` | `Ratelimit.slidingWindow()` configured |
| 5.6 | Add feature flag for Redis | `lib/rate-limit/index.ts` | `USE_REDIS_RATE_LIMIT` env var check |
| 5.7 | Update checkRateLimit function | `lib/rate-limit/index.ts` | Use Redis when available, fallback to in-memory |
| 5.8 | Update restore endpoint | `app/api/restore/route.ts` | No changes needed (uses checkRateLimit) |
| 5.9 | Update quota endpoint | `app/api/quota/route.ts` | No changes needed (uses checkRateLimit) |
| 5.10 | Update checkout endpoint | `app/api/create-checkout-session/route.ts` | No changes needed (uses checkRateLimit) |
| 5.11 | Update analytics endpoint | `app/api/analytics/route.ts` | No changes needed (uses checkRateLimit) |
| 5.12 | Add Upstash env to Vercel | External (Vercel) | Production env vars configured |
| 5.13 | Test rate limiting locally | N/A (curl/manual) | Rate limit triggers after configured requests |
| 5.14 | Create rate limit integration test | `tests/integration/rate-limit.test.ts` | Test verifies limit enforcement |
| 5.15 | Add rate limit monitoring | `lib/observability/logger.ts` | Log rate limit events for monitoring |
| 5.16 | Document rate limiting upgrade | `CLAUDE.md` | Update Rate Limiting section |

---

## Action 6: Update Outdated Dependencies

**Severity**: 🟡 MEDIUM
**Risk**: Missing bug fixes, performance improvements, security patches
**Impact**: Stay current with ecosystem, reduce technical debt

### Tasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 6.1 | Update React to 19.2.3 | `package.json`, `package-lock.json` | `npm install react@19.2.3 react-dom@19.2.3` succeeds |
| 6.2 | Update @stripe/stripe-js | `package.json`, `package-lock.json` | `npm install @stripe/stripe-js@latest` succeeds |
| 6.3 | Update @vercel/analytics | `package.json`, `package-lock.json` | `npm install @vercel/analytics@latest` succeeds |
| 6.4 | Update @radix-ui packages | `package.json`, `package-lock.json` | Update all @radix-ui/* to latest |
| 6.5 | Update TypeScript ESLint | `package.json`, `package-lock.json` | Update @typescript-eslint/* to 8.51.0 |
| 6.6 | Update Tailwind packages | `package.json`, `package-lock.json` | Update @tailwindcss/* and autoprefixer |
| 6.7 | Update testing libraries | `package.json`, `package-lock.json` | Update @testing-library/*, jsdom, @vitejs/plugin-react |
| 6.8 | Update Prettier | `package.json`, `package-lock.json` | `npm install prettier@latest prettier-plugin-tailwindcss@latest` |
| 6.9 | Run typecheck | All `.ts`/`.tsx` files | `npm run typecheck` passes |
| 6.10 | Run lint | All source files | `npm run lint` passes |
| 6.11 | Run tests | All test files | `npm test` passes |
| 6.12 | Run build | All source files | `npm run build` succeeds |

---

## Action 7: Remove as any Type Assertions

**Severity**: 🟡 MEDIUM
**Risk**: Type assertions bypass TypeScript safety, hide potential bugs
**Impact**: Improved type safety, better IDE support, fewer runtime errors

### Tasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 7.1 | Fix analytics route type assertion | `app/api/analytics/route.ts` | Remove `as any` on line 39, use proper enum type |
| 7.2 | Fix webhook route type assertion | `app/api/webhooks/stripe/route.ts` | Remove `as any` on line 94, type payload correctly |
| 7.3 | Fix checkout test mock types | `app/api/create-checkout-session/route.test.ts` | Use proper mock types instead of `as any` |
| 7.4 | Fix bug-fix test mock types | `app/api/create-checkout-session/route.bug-fix.test.ts` | Use proper mock types for all 4 occurrences |
| 7.5 | Create shared mock types | `tests/mocks/supabase.ts` | Create typed mock factory for Supabase client |
| 7.6 | Update tests to use typed mocks | `app/api/**/*.test.ts` | All tests use typed mocks |
| 7.7 | Add eslint rule for no-explicit-any | `.eslintrc.json` | Add `"@typescript-eslint/no-explicit-any": "warn"` |
| 7.8 | Run typecheck | All `.ts`/`.tsx` files | `npm run typecheck` passes |
| 7.9 | Run lint | All source files | `npm run lint` shows only warnings for remaining `any` |
| 7.10 | Document type safety guidelines | `CLAUDE.md` | Add section on avoiding `any` |

---

## Action 8: Replace console.* with Logger

**Severity**: 🟡 MEDIUM
**Risk**: console.* bypasses structured logging, harder to monitor in production
**Impact**: Consistent observability across all code paths

### Tasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 8.1 | Audit all console.* usage | All `.ts`/`.tsx` files | `grep -r "console\." --include="*.ts"` documented |
| 8.2 | Fix background-sync.ts console.warn | `lib/pwa/background-sync.ts` | Replace with `logger.warn()` |
| 8.3 | Fix any console.log in lib/ | `lib/**/*.ts` | All console.log replaced with logger.debug |
| 8.4 | Fix any console.error in lib/ | `lib/**/*.ts` | All console.error replaced with logger.error |
| 8.5 | Add browser-safe logger check | `lib/observability/logger.ts` | Logger works in both server and client contexts |
| 8.6 | Update PWA files to use logger | `lib/pwa/*.ts` | All PWA files use structured logger |
| 8.7 | Add eslint rule for no-console | `.eslintrc.json` | Add `"no-console": "warn"` |
| 8.8 | Exclude test files from no-console | `.eslintrc.json` | Allow console in test files |
| 8.9 | Run lint | All source files | `npm run lint` shows no console errors in lib/ |
| 8.10 | Document logging guidelines | `CLAUDE.md` | Add Logging section with examples |

---

## Action 9: Add Data Access Layer Pattern

**Severity**: 🟡 MEDIUM
**Risk**: Database queries scattered across codebase, authorization checks inconsistent
**Impact**: Centralized data access with consistent authorization (Next.js 15 recommendation)

### Tasks (18 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 9.1 | Create DAL directory structure | `lib/dal/index.ts` | New directory with barrel export |
| 9.2 | Create user-credits DAL | `lib/dal/user-credits.ts` | Functions: getCredits, hasCredits, deductCredit |
| 9.3 | Create user-quota DAL | `lib/dal/user-quota.ts` | Functions: checkQuota, incrementQuota |
| 9.4 | Create upload-sessions DAL | `lib/dal/upload-sessions.ts` | Functions: createSession, getSession, updateSession |
| 9.5 | Create restoration-results DAL | `lib/dal/restoration-results.ts` | Functions: createResult, getResult |
| 9.6 | Create payment-transactions DAL | `lib/dal/payment-transactions.ts` | Functions: createTransaction, getTransaction |
| 9.7 | Add authorization checks to DAL | `lib/dal/*.ts` | All DAL functions verify user ownership |
| 9.8 | Add DTOs for safe data transfer | `lib/dal/dto.ts` | Type-safe DTOs that exclude sensitive fields |
| 9.9 | Update restore route to use DAL | `app/api/restore/route.ts` | Import from `@/lib/dal` instead of direct Supabase |
| 9.10 | Update quota route to use DAL | `app/api/quota/route.ts` | Import from `@/lib/dal` |
| 9.11 | Update checkout route to use DAL | `app/api/create-checkout-session/route.ts` | Import from `@/lib/dal` |
| 9.12 | Update webhook route to use DAL | `app/api/webhooks/stripe/route.ts` | Import from `@/lib/dal` |
| 9.13 | Update credits component to use DAL | `components/credits/credit-balance.tsx` | Import from `@/lib/dal` |
| 9.14 | Deprecate direct Supabase imports in routes | `app/api/**/*.ts` | No direct `createClient` in route handlers |
| 9.15 | Add DAL unit tests | `lib/dal/*.test.ts` | Each DAL function has unit tests |
| 9.16 | Run full test suite | All test files | `npm test` passes |
| 9.17 | Run typecheck | All `.ts`/`.tsx` files | `npm run typecheck` passes |
| 9.18 | Document DAL pattern | `CLAUDE.md` | Add Data Access Layer section |

---

## Action 10: Add API Error Boundary Wrapper

**Severity**: 🟡 MEDIUM
**Risk**: Inconsistent error handling across API routes, potential unhandled exceptions
**Impact**: Consistent error responses, better error tracking, cleaner route handlers

### Tasks (14 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 10.1 | Create API handler wrapper type | `lib/api/types.ts` | Type definitions for wrapped handlers |
| 10.2 | Create withErrorBoundary wrapper | `lib/api/error-boundary.ts` | Higher-order function that wraps route handlers |
| 10.3 | Add standard error response format | `lib/api/error-boundary.ts` | `{ error: string, error_code: string, request_id?: string }` |
| 10.4 | Add request ID generation | `lib/api/error-boundary.ts` | Generate unique ID for each request |
| 10.5 | Add automatic error logging | `lib/api/error-boundary.ts` | Log all errors with context to logger |
| 10.6 | Add Sentry integration | `lib/api/error-boundary.ts` | Capture exceptions to Sentry with request context |
| 10.7 | Handle known error types | `lib/api/error-boundary.ts` | Map Supabase, Stripe, Zod errors to appropriate status codes |
| 10.8 | Apply to restore route | `app/api/restore/route.ts` | Wrap handler with `withErrorBoundary` |
| 10.9 | Apply to quota route | `app/api/quota/route.ts` | Wrap handler with `withErrorBoundary` |
| 10.10 | Apply to checkout route | `app/api/create-checkout-session/route.ts` | Wrap handler with `withErrorBoundary` |
| 10.11 | Apply to analytics route | `app/api/analytics/route.ts` | Wrap handler with `withErrorBoundary` |
| 10.12 | Apply to webhook route | `app/api/webhooks/stripe/route.ts` | Wrap handler with `withErrorBoundary` |
| 10.13 | Add error boundary tests | `lib/api/error-boundary.test.ts` | Test error handling for various error types |
| 10.14 | Document error handling | `CLAUDE.md` | Add API Error Handling section |

---

## Summary

| Action | Total Tasks | Files Touched | Max Files/Task |
|--------|-------------|---------------|----------------|
| 1. Rotate Webhook Secrets | 12 | 9 | 2 |
| 2. Update Vulnerable Deps | 15 | 4 | 3 |
| 3. Fix Checkout Tests | 10 | 4 | 2 |
| 4. Security Headers | 14 | 5 | 3 |
| 5. Upstash Rate Limiting | 16 | 8 | 3 |
| 6. Update Dependencies | 12 | 2 | 2 |
| 7. Remove `as any` | 10 | 8 | 3 |
| 8. Replace console.* | 10 | 6 | 3 |
| 9. Data Access Layer | 18 | 15 | 4 |
| 10. API Error Boundary | 14 | 10 | 3 |

**Total: 131 atomic tasks**

---

## Execution Order

### Phase 1: Critical Security (Actions 1-2)
Execute immediately - exposed secrets and known vulnerabilities.

### Phase 2: Testing & Headers (Actions 3-4)
Fix test failures to enable CI, add security headers for production.

### Phase 3: Infrastructure (Actions 5-6)
Upgrade rate limiting and dependencies for production readiness.

### Phase 4: Code Quality (Actions 7-10)
Improve type safety, logging, data access patterns, and error handling.

---

## Verification Commands

```bash
# After Action 1
grep -r "whsec_[A-Za-z0-9]\{20,\}" . --include="*.md" | grep -v example

# After Action 2
npm audit --audit-level=high

# After Action 3
npm test -- app/api/create-checkout-session

# After Action 4
curl -I https://retrophotoai.com | grep -E "X-|Content-Security|Strict-Transport"

# After Action 5
curl -X POST http://localhost:3000/api/restore -d '{}' # Run 6 times, expect 429

# After Action 6
npm outdated | wc -l  # Should be minimal

# After Action 7
grep -r "as any" --include="*.ts" lib/ app/

# After Action 8
grep -r "console\." --include="*.ts" lib/

# After Action 9
grep -r "from '@/lib/supabase" app/api/  # Should only show DAL imports

# After Action 10
grep -r "withErrorBoundary" app/api/  # Should show all routes wrapped
```

---

## Sources (January 2026)

- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Next.js Security Update Dec 2025](https://nextjs.org/blog/security-update-2025-12-11)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/)
- [Stripe Webhook Best Practices](https://docs.stripe.com/webhooks)
- [Sentry Advisory GHSA-6465-jgvq-jhgp](https://github.com/advisories/GHSA-6465-jgvq-jhgp)
