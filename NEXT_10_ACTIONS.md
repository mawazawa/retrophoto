# RetroPhoto: 10 Highest-Leverage Actions Plan

> **Generated**: December 28, 2025
> **Verified Against**: Next.js 15 production best practices, Supabase RLS security guidelines (2025)
> **Constraint**: Each subtask touches ≤4-5 files with clear success criteria

---

## Executive Summary

Based on comprehensive codebase analysis, these 10 actions will have the highest impact on production-readiness, security, and user experience. Actions are ordered by criticality and dependency chain.

---

## Action 1: Fix Critical Database Column Mismatch

**Impact**: CRITICAL - Prevents runtime errors in credit system
**Effort**: Small
**Dependencies**: None

### Problem
`lib/credits/quota.ts` queries `credits_balance` but database schema defines `available_credits`.

### Subtasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 1.1 | Audit all `credits_balance` references | `lib/credits/quota.ts`, `lib/supabase/types.ts` | List of all 5 occurrences documented |
| 1.2 | Update `hasCredits()` function | `lib/credits/quota.ts` | Line 18: `credits_balance` → `available_credits` |
| 1.3 | Update `getCreditBalance()` function | `lib/credits/quota.ts` | Line 71: `credits_balance` → `available_credits` |
| 1.4 | Update TypeScript types | `lib/supabase/types.ts` | `UserCredits.credits_balance` → `available_credits` |
| 1.5 | Add unit test for `hasCredits()` | `lib/credits/quota.test.ts` | Test passes with mocked `available_credits` column |
| 1.6 | Add unit test for `getCreditBalance()` | `lib/credits/quota.test.ts` | Test passes with mocked data |
| 1.7 | Verify `/api/restore` still works | `app/api/restore/route.ts` | Line 61 already uses `available_credits` ✓ |
| 1.8 | Run TypeScript type check | - | `npm run typecheck` passes |
| 1.9 | Run integration tests | `tests/integration/` | All credit-related tests pass |
| 1.10 | Document schema in CLAUDE.md | `CLAUDE.md` | Add note about `available_credits` column |

---

## Action 2: Remove Hardcoded Test Credentials

**Impact**: CRITICAL - Security vulnerability if repo public
**Effort**: Small
**Dependencies**: None

### Problem
Supabase service role keys hardcoded in test files as fallback defaults.

### Subtasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 2.1 | Remove hardcoded URL from payment-flow.test.ts | `tests/integration/payment-flow.test.ts` | Line 11: Remove fallback URL |
| 2.2 | Remove hardcoded key from payment-flow.test.ts | `tests/integration/payment-flow.test.ts` | Line 12: Remove fallback key |
| 2.3 | Remove hardcoded URL from webhook-idempotency.test.ts | `tests/integration/webhook-idempotency.test.ts` | Line 11: Remove fallback URL |
| 2.4 | Remove hardcoded key from webhook-idempotency.test.ts | `tests/integration/webhook-idempotency.test.ts` | Line 12: Remove fallback key |
| 2.5 | Add env validation to test setup | `tests/setup.ts` | Skip tests if env vars missing |
| 2.6 | Create `.env.test.template` | `.env.test.template` | Template with placeholder values |
| 2.7 | Update test README | `tests/README.md` | Document required env vars |
| 2.8 | Add git pre-commit hook for secrets | `.husky/pre-commit` | Block commits with service keys |
| 2.9 | Scan repo history for leaked secrets | - | Run `git secrets --scan` passes |
| 2.10 | Rotate affected Supabase keys | - | New keys generated in Supabase dashboard |

---

## Action 3: Implement API Rate Limiting

**Impact**: HIGH - Prevents abuse and cost escalation
**Effort**: Medium
**Dependencies**: None

### Problem
No rate limiting on `/api/restore`, `/api/create-checkout-session`, `/api/quota`, `/api/analytics`.

### Subtasks (15 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 3.1 | Install rate limiting library | `package.json` | `npm install @upstash/ratelimit @upstash/redis` |
| 3.2 | Create rate limiter utility | `lib/rate-limit/index.ts` | Export `rateLimit()` function |
| 3.3 | Add Upstash Redis env vars | `.env.local.template` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| 3.4 | Create fingerprint-based limiter | `lib/rate-limit/fingerprint.ts` | 10 req/minute per fingerprint |
| 3.5 | Create IP-based limiter | `lib/rate-limit/ip.ts` | 60 req/minute per IP |
| 3.6 | Add rate limit to `/api/restore` | `app/api/restore/route.ts` | Return 429 when exceeded |
| 3.7 | Add rate limit to `/api/quota` | `app/api/quota/route.ts` | Return 429 when exceeded |
| 3.8 | Add rate limit to `/api/create-checkout-session` | `app/api/create-checkout-session/route.ts` | Return 429 when exceeded |
| 3.9 | Add rate limit to `/api/analytics` | `app/api/analytics/route.ts` | Return 429 when exceeded |
| 3.10 | Add rate limit headers to responses | `lib/rate-limit/headers.ts` | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| 3.11 | Create rate limit error response | `lib/rate-limit/error.ts` | Standardized `RATE_LIMITED` error code |
| 3.12 | Add unit tests for rate limiter | `lib/rate-limit/index.test.ts` | Test sliding window behavior |
| 3.13 | Add integration test for rate limiting | `tests/integration/rate-limit.test.ts` | Verify 429 after threshold |
| 3.14 | Document rate limits in API spec | `API_SPECIFICATION.md` | Add rate limit documentation |
| 3.15 | Add rate limit monitoring to Sentry | `lib/observability/alerts.ts` | Alert on >100 rate limit hits/hour |

---

## Action 4: Enable TypeScript Strict Checking

**Impact**: HIGH - Catch bugs at compile time
**Effort**: Medium
**Dependencies**: Action 1 (column fix)

### Problem
6 files use `@ts-nocheck`, hiding potential type errors.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 4.1 | Remove @ts-nocheck from restore route | `app/api/restore/route.ts` | Line 1: Remove comment |
| 4.2 | Fix type errors in restore route | `app/api/restore/route.ts` | `npm run typecheck` passes for this file |
| 4.3 | Remove @ts-nocheck from quota route | `app/api/quota/route.ts` | Line 1: Remove comment |
| 4.4 | Fix type errors in quota route | `app/api/quota/route.ts` | `npm run typecheck` passes |
| 4.5 | Remove @ts-nocheck from analytics route | `app/api/analytics/route.ts` | Line 1: Remove comment |
| 4.6 | Fix type errors in analytics route | `app/api/analytics/route.ts` | `npm run typecheck` passes |
| 4.7 | Remove @ts-nocheck from og-card route | `app/api/og-card/[sessionId]/route.tsx` | Line 1: Remove comment |
| 4.8 | Fix type errors in og-card route | `app/api/og-card/[sessionId]/route.tsx` | `npm run typecheck` passes |
| 4.9 | Remove @ts-nocheck from result page | `app/result/[id]/page.tsx` | Line 1: Remove comment |
| 4.10 | Fix type errors in result page | `app/result/[id]/page.tsx` | `npm run typecheck` passes |
| 4.11 | Remove @ts-nocheck from analytics lib | `lib/metrics/analytics.ts` | Line 1: Remove comment |
| 4.12 | Verify full typecheck passes | - | `npm run typecheck` exits 0 |

---

## Action 5: Add Input Validation to All API Endpoints

**Impact**: HIGH - Prevent malformed data and injection
**Effort**: Medium
**Dependencies**: None

### Problem
Analytics endpoint accepts any JSON; other endpoints have minimal validation.

### Subtasks (14 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 5.1 | Install Zod for validation | `package.json` | `npm install zod` |
| 5.2 | Create analytics event schema | `lib/validation/analytics.ts` | Export `analyticsEventSchema` |
| 5.3 | Create restore request schema | `lib/validation/restore.ts` | Export `restoreRequestSchema` |
| 5.4 | Create checkout request schema | `lib/validation/checkout.ts` | Export `checkoutRequestSchema` |
| 5.5 | Create quota request schema | `lib/validation/quota.ts` | Export `quotaRequestSchema` |
| 5.6 | Add validation to `/api/analytics` | `app/api/analytics/route.ts` | Return 400 on invalid input |
| 5.7 | Add validation to `/api/restore` | `app/api/restore/route.ts` | Return 400 on invalid input |
| 5.8 | Add validation to `/api/create-checkout-session` | `app/api/create-checkout-session/route.ts` | Return 400 on invalid input |
| 5.9 | Add validation to `/api/quota` | `app/api/quota/route.ts` | Return 400 on invalid input |
| 5.10 | Create validation error response utility | `lib/validation/error.ts` | Standardized `VALIDATION_ERROR` code |
| 5.11 | Add unit tests for schemas | `lib/validation/*.test.ts` | All schemas tested |
| 5.12 | Add integration test for invalid input | `tests/integration/validation.test.ts` | Verify 400 responses |
| 5.13 | Document validation rules in API spec | `API_SPECIFICATION.md` | Add request schemas |
| 5.14 | Add CSP headers via middleware | `middleware.ts` | Content-Security-Policy header set |

---

## Action 6: Enhance OG Card with Branding

**Impact**: MEDIUM-HIGH - Viral growth depends on share-worthy output
**Effort**: Small
**Dependencies**: None

### Problem
OG cards lack branding, text, or RetroPhoto logo per constitution XI.4.

### Subtasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 6.1 | Design OG card layout with branding | - | Figma/sketch with before/after + logo |
| 6.2 | Add RetroPhoto logo to public assets | `public/logo-og.png` | 200x200 transparent PNG |
| 6.3 | Update OG card component layout | `lib/share/og-card.tsx` | Add logo positioning |
| 6.4 | Add "Restored with RetroPhoto" text | `lib/share/og-card.tsx` | Text overlay at bottom |
| 6.5 | Add before/after labels | `lib/share/og-card.tsx` | "Before" / "After" labels |
| 6.6 | Add gradient divider between images | `lib/share/og-card.tsx` | Subtle vertical divider |
| 6.7 | Optimize card dimensions for social | `lib/share/og-card.tsx` | 1200x630px output |
| 6.8 | Add deep link URL to card | `lib/share/og-card.tsx` | Show `retrophotoai.com/view/...` |
| 6.9 | Add unit test for OG card generation | `lib/share/og-card.test.ts` | Verify output dimensions and content |
| 6.10 | Visual QA on Twitter/Facebook preview | - | Cards render correctly in debuggers |

---

## Action 7: Parallelize Share Artifact Generation

**Impact**: MEDIUM-HIGH - Reduces TTM by ~2-3 seconds
**Effort**: Small
**Dependencies**: None

### Problem
OG card, GIF, and deep link generated sequentially (lines 171-182 in restore route).

### Subtasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 7.1 | Identify sequential artifact generation | `app/api/restore/route.ts` | Lines 171-182 identified |
| 7.2 | Refactor to Promise.all pattern | `app/api/restore/route.ts` | Parallel generation |
| 7.3 | Add error handling for partial failures | `app/api/restore/route.ts` | Continue if one artifact fails |
| 7.4 | Add timeout for artifact generation | `app/api/restore/route.ts` | 10s timeout per artifact |
| 7.5 | Update logging for parallel operations | `app/api/restore/route.ts` | Log start/end of each |
| 7.6 | Parallelize image fetches in GIF generator | `lib/share/gif-generator.ts` | Use Promise.all for fetches |
| 7.7 | Add caching for fetched images | `lib/share/image-cache.ts` | Cache restored image buffer |
| 7.8 | Measure TTM improvement | - | p50 TTM reduced by >15% |
| 7.9 | Add performance test | `tests/integration/ttm.test.ts` | Verify parallel is faster |
| 7.10 | Update TTM SLO documentation | `CLAUDE.md` | Document optimization |

---

## Action 8: Implement Skipped Integration Tests

**Impact**: MEDIUM-HIGH - Ensure payment system works
**Effort**: Medium
**Dependencies**: Database migrations applied

### Problem
5 integration tests skipped; payment refund flow untested.

### Subtasks (15 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 8.1 | Enable webhook idempotency test 1 | `tests/integration/webhook-idempotency.test.ts` | Remove `.skip()` from line 45 |
| 8.2 | Enable webhook idempotency test 2 | `tests/integration/webhook-idempotency.test.ts` | Remove `.skip()` from line 60 |
| 8.3 | Enable webhook idempotency test 3 | `tests/integration/webhook-idempotency.test.ts` | Remove `.skip()` from line 75 |
| 8.4 | Enable webhook idempotency test 4 | `tests/integration/webhook-idempotency.test.ts` | Remove `.skip()` from line 90 |
| 8.5 | Enable payment flow refund test | `tests/integration/payment-flow.test.ts` | Remove `.skip()` |
| 8.6 | Enable quota tracker test suite | `tests/integration/quota-tracker.test.ts` | Remove `describe.skip()` |
| 8.7 | Fix test database setup | `tests/setup.ts` | Ensure migrations run |
| 8.8 | Add mock Stripe client for tests | `tests/mocks/stripe.ts` | Mock webhook verification |
| 8.9 | Add mock Supabase client for tests | `tests/mocks/supabase.ts` | Mock RPC calls |
| 8.10 | Enable zoom flow E2E test | `tests/e2e/zoom-flow.spec.ts` | Remove `test.skip()` |
| 8.11 | Verify all tests pass locally | - | `npm test` exits 0 |
| 8.12 | Add test coverage report | `vitest.config.ts` | Enable coverage collection |
| 8.13 | Set coverage thresholds | `vitest.config.ts` | >80% coverage required |
| 8.14 | Add CI workflow for tests | `.github/workflows/test.yml` | Tests run on PR |
| 8.15 | Document test requirements | `tests/README.md` | List all prerequisites |

---

## Action 9: Add Email Notifications for Payment Events

**Impact**: MEDIUM - Improve UX for payment issues
**Effort**: Medium
**Dependencies**: Email provider configured

### Problem
TODO comments at lines 178 and 238 in Stripe webhook for payment failure notifications.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 9.1 | Choose email provider (Resend/SendGrid) | - | Decision documented |
| 9.2 | Install email SDK | `package.json` | `npm install resend` |
| 9.3 | Add email env vars | `.env.local.template` | `RESEND_API_KEY` |
| 9.4 | Create email service utility | `lib/email/send.ts` | Export `sendEmail()` function |
| 9.5 | Create payment success template | `lib/email/templates/payment-success.tsx` | Receipt email template |
| 9.6 | Create payment failure template | `lib/email/templates/payment-failure.tsx` | Failure notification template |
| 9.7 | Create credit added template | `lib/email/templates/credits-added.tsx` | Confirmation email |
| 9.8 | Add success notification to webhook | `app/api/webhooks/stripe/route.ts` | Line ~85: Send receipt |
| 9.9 | Add failure notification to webhook | `app/api/webhooks/stripe/route.ts` | Line ~178: Send failure email |
| 9.10 | Add invoice failure notification | `app/api/webhooks/stripe/route.ts` | Line ~238: Send failure email |
| 9.11 | Add unit tests for email templates | `lib/email/templates/*.test.ts` | Templates render correctly |
| 9.12 | Add integration test for email sending | `tests/integration/email.test.ts` | Mock email sent |

---

## Action 10: Simplify AI Orchestration (Remove Unused Triage)

**Impact**: MEDIUM - Reduce complexity and cost
**Effort**: Small
**Dependencies**: None

### Problem
Triage system routes to different models, but all providers fall back to SwinIR. Expensive triage calls for no benefit.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 10.1 | Audit orchestrator usage | `lib/ai/orchestrator.ts` | Document current flow |
| 10.2 | Check if triage is called | `app/api/restore/route.ts` | Verify not using orchestrator |
| 10.3 | Option A: Remove orchestrator entirely | `lib/ai/orchestrator.ts` | Delete file if unused |
| 10.4 | Option B: Add feature flag for multi-model | `lib/ai/orchestrator.ts` | `ENABLE_MULTI_MODEL` env var |
| 10.5 | Skip triage when flag disabled | `lib/ai/orchestrator.ts` | Direct to SwinIR |
| 10.6 | Remove unused provider stubs | `lib/ai/orchestrator.ts` | Remove TODO comments/dead code |
| 10.7 | Update restore flow to use direct model | `lib/ai/restore.ts` | Single model path |
| 10.8 | Remove triage dependency | `lib/ai/triage.ts` | Mark as optional/future |
| 10.9 | Add feature flag documentation | `CLAUDE.md` | Document multi-model feature |
| 10.10 | Measure cost savings | - | Remove Claude/Anthropic API calls |
| 10.11 | Add test for direct model path | `lib/ai/restore.test.ts` | Direct restoration works |
| 10.12 | Update architecture documentation | `CLAUDE.md` | Simplify AI section |

---

## Implementation Order

```
Week 1 (Critical Security):
├── Action 1: Fix Database Column (Day 1)
├── Action 2: Remove Hardcoded Credentials (Day 1)
├── Action 3: Implement Rate Limiting (Days 2-3)
└── Action 4: Enable TypeScript Checking (Days 4-5)

Week 2 (Stability & Performance):
├── Action 5: Add Input Validation (Days 1-2)
├── Action 7: Parallelize Artifact Generation (Day 3)
├── Action 8: Enable Skipped Tests (Days 4-5)
└── Action 10: Simplify AI Orchestration (Day 5)

Week 3 (User Experience):
├── Action 6: Enhance OG Card Branding (Days 1-2)
└── Action 9: Add Email Notifications (Days 3-5)
```

---

## Success Metrics

| Metric | Current | Target | Action |
|--------|---------|--------|--------|
| TypeScript errors | Unknown (ts-nocheck) | 0 | #4 |
| Test coverage | ~60% | >80% | #8 |
| Rate limit protection | 0% | 100% | #3 |
| TTM p50 | ~6s | <5s | #7 |
| API validation | Partial | 100% | #5 |
| Hardcoded secrets | 2 files | 0 | #2 |

---

## Sources

- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js 15 Performance Optimization](https://blazity.com/the-expert-guide-to-nextjs-performance-optimization)
- [Supabase RLS Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [2025 Supabase Security Best Practices](https://github.com/orgs/supabase/discussions/38690)

---

**Last Updated**: December 28, 2025
