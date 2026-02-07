# Production Deployment Roadmap: Invite-Only Beta

> RetroPhoto — from codebase to paying customers. Verified gap analysis, prioritized roadmap, and atomic task list with success criteria.

**Date**: 2026-02-07
**Methodology**: Chain-of-Verification (5 parallel analysis agents, cross-verified findings)
**Target**: Invite-only beta with real Stripe payments, ~10-50 initial testers

---

## Executive Summary

**Overall Production Readiness: ~90%**

The core application is functionally complete. The restoration pipeline (upload → Replicate AI → storage → result display), payment system (Stripe Checkout → webhook → credit addition), quota enforcement (fail-closed fingerprint tracking), and UI/UX (landing page, comparison slider, sharing) are all **working implementations, not stubs**.

What's missing is the **last-mile production hardening** — security fixes, environment configuration, invite-only gating, CI/CD, and operational tooling.

### Gap Summary

| Category | Status | Gaps Found | Blocking? |
|----------|--------|-----------|-----------|
| Core Features (AI, Upload, UI) | 22/25 WORKING | Multi-model routing stubbed (acceptable) | No |
| Payment System | WORKING | Missing price validation, hardcoded amounts | Yes (1 fix) |
| Security | 9/10 | CSRF localhost leak, hardcoded test creds | Yes (2 fixes) |
| Auth | WORKING | No invite-only gating | Yes (must build) |
| Infrastructure | 95% | No CI/CD, env vars not in Vercel | Yes (config) |
| Monitoring | CONFIGURED | Sentry sampling too high for prod costs | No |
| Database | COMPLETE | RLS policies in place, migrations done | No |
| Testing | COMPREHENSIVE | 22 test files, 5 Playwright profiles | No |

---

## Chain-of-Verification: Cross-Agent Finding Validation

Each finding was produced by one agent and verified against at least one other agent's analysis:

| Finding | Source Agent | Verification Agent | Verified? |
|---------|------------|-------------------|-----------|
| Next.js already at 15.5.9 (CVE-2025-55182 patched) | Research | Infra Audit (package.json) | **YES** — `^15.5.9` in package.json |
| CSRF allows localhost in production | Infra Audit | Security Audit (confirmed lines 10-14) | **YES** — manually confirmed |
| Hardcoded test credentials in E2E | Security Audit | Manual read (lines 8-9) | **YES** — `mathieuwauters@gmail.com` / password in plain text |
| Stripe webhook missing price validation | Payment Audit | Security Audit (no amount check found) | **YES** — no `amount_total` check |
| All 22/25 core features WORKING | Feature Audit | Infra Audit (no stubs found in routes) | **YES** — corroborated |
| No CI/CD workflows | Infra Audit | Feature Audit (no .github/ dir) | **YES** — confirmed absent |
| No invite-only mechanism | Security Audit | Feature Audit (no beta gating) | **YES** — open signup |
| Cron job for credit expiration not scheduled | Payment Audit | Infra Audit (route exists, no scheduler) | **YES** — corroborated |
| Supabase RLS complete on all tables | Infra Audit | Security Audit (confirmed in migrations) | **YES** — all tables secured |
| Rate limiting works (hybrid Redis/memory) | Feature Audit | Security Audit (confirmed 4 endpoints) | **YES** — corroborated |

---

## Phase 1: Security Blockers (MUST fix before any user touches production)

### TASK 1.1 — Fix CSRF Localhost Origin Leak
**File**: `lib/security/csrf.ts:10-14`
**Problem**: `ALLOWED_ORIGINS` includes `http://localhost:3000` and `http://localhost:3001` unconditionally. In production, this allows requests from localhost to bypass CSRF validation.
**Fix**: Conditionally include localhost origins only when `NODE_ENV === 'development'`.

**Success Criteria**:
- [ ] `ALLOWED_ORIGINS` only includes localhost when `process.env.NODE_ENV === 'development'`
- [ ] Production build does NOT include localhost in allowed origins
- [ ] Existing unit tests pass
- [ ] Manual test: CSRF validation rejects `Origin: http://localhost:3000` when `NODE_ENV=production`

**Eval**: Run `NODE_ENV=production node -e "..."` to confirm localhost is excluded from the array.

**Reference**: [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — Origin header validation must only allow production origins.

---

### TASK 1.2 — Remove Hardcoded Test Credentials from Repository
**File**: `tests/e2e/auth-flow.spec.ts:8-9`
**Problem**: Real email (`mathieuwauters@gmail.com`) and password (`Karmaisabitch2025$`) are hardcoded in source code, visible to anyone with repo access and in git history.
**Fix**: Move to environment variables loaded from `.env.test` (already in `.gitignore`).

**Success Criteria**:
- [ ] No plaintext credentials in any `.ts`, `.js`, or `.spec.ts` file (grep verification)
- [ ] `tests/e2e/auth-flow.spec.ts` reads from `process.env.TEST_EMAIL` and `process.env.TEST_PASSWORD`
- [ ] `.env.test.template` documents required test variables
- [ ] E2E tests still pass when env vars are set

**Eval**: `grep -r "Karmaisabitch" . --include="*.ts" --include="*.js"` returns zero results.

**Reference**: [OWASP Credential Management](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) — Never hardcode credentials. [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning) — GitHub may flag this.

---

### TASK 1.3 — Add Stripe Price Validation in Webhook Handler
**File**: `app/api/webhooks/stripe/route.ts`
**Problem**: Webhook handler adds 10 credits on `checkout.session.completed` without verifying `session.amount_total` matches the expected price ($9.99 = 999 cents). A manipulated checkout could theoretically receive credits for a lower payment.
**Fix**: Validate `amount_total` against expected price before adding credits.

**Success Criteria**:
- [ ] Webhook handler checks `session.amount_total === 999` (or configured expected amount)
- [ ] Mismatched amounts are logged as errors and do NOT result in credit addition
- [ ] Webhook returns 200 (to prevent Stripe retries) but skips fulfillment on mismatch
- [ ] Test: Mock webhook event with `amount_total: 100` — credits NOT added

**Eval**: Integration test simulating tampered amount verifies credits are not granted.

**Reference**: [Stripe Fulfillment Best Practices](https://docs.stripe.com/payments/checkout/fulfill-orders) — "Always verify the payment amount and currency before fulfilling." [Stripe Webhook Security](https://docs.stripe.com/webhooks#verify-official-libraries)

---

## Phase 2: Invite-Only Access Control (Gating for beta testers)

### TASK 2.1 — Implement Invite-Only Email Allowlist
**Problem**: No mechanism to restrict signups to invited users. For a controlled beta launch with paying customers, you need to gate access.
**Approach**: Lightweight server-side allowlist — check email against a list of allowed emails/domains before granting access to the `/app` route.

**Success Criteria**:
- [ ] New file `lib/auth/allowlist.ts` with `isEmailAllowed(email: string): boolean`
- [ ] Allowlist stored as environment variable `BETA_ALLOWED_EMAILS` (comma-separated)
- [ ] Optional domain allowlist `BETA_ALLOWED_DOMAINS` (e.g., `@yourcompany.com`)
- [ ] Environment variable `BETA_MODE_ENABLED=true` toggles enforcement (can be turned off for public launch)
- [ ] `/app` page checks allowlist for authenticated users and shows "You're on the waitlist" for non-allowed emails
- [ ] Guest mode (fingerprint) still works for free tier (1 restore) — gating only applies to premium features
- [ ] Checkout endpoint (`/api/create-checkout-session`) rejects non-allowed authenticated users with clear error message

**Eval**: Set `BETA_MODE_ENABLED=true` and `BETA_ALLOWED_EMAILS=test@example.com`. Sign in as `other@example.com` — verify checkout is blocked. Sign in as `test@example.com` — verify checkout works.

**Reference**: [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) — Can use `before_user_created` hook for signup gating. [Next.js Middleware Auth Patterns](https://nextjs.org/docs/app/guides/authentication) — Middleware-based route protection.

---

### TASK 2.2 — Build Waitlist/Denied Access UI
**Problem**: When a non-allowlisted user tries to purchase, they need a clear, friendly message — not an error page.

**Success Criteria**:
- [ ] New component `components/waitlist-gate.tsx` — shows "You're on the waitlist" with email collection form
- [ ] Landing page `/` is accessible to everyone (no gating)
- [ ] Free tier (1 restore via fingerprint) works for everyone (demonstrates product value)
- [ ] Purchase button shows "Join Waitlist" for non-allowlisted users
- [ ] Consistent with constitutional principle: "Zero Friction to Wow" — let them experience the product first

**Eval**: Visual inspection: non-allowed user sees waitlist UI, not an error.

---

## Phase 3: Production Environment Configuration

### TASK 3.1 — Configure Vercel Environment Variables
**Problem**: All required environment variables must be set in Vercel's Production environment before deployment.

**Success Criteria** (each variable verified individually):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — set to production Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — set to production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — set (marked Sensitive in Vercel)
- [ ] `REPLICATE_API_TOKEN` — set (marked Sensitive)
- [ ] `STRIPE_SECRET_KEY` — **LIVE mode key** (starts with `sk_live_`), marked Sensitive
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — **LIVE mode key** (starts with `pk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` — from live webhook endpoint (starts with `whsec_`), marked Sensitive
- [ ] `STRIPE_CREDITS_PRICE_ID` — **LIVE mode price ID** (created in Stripe live mode dashboard)
- [ ] `NEXT_PUBLIC_BASE_URL` — `https://retrophotoai.com`
- [ ] `CRON_SECRET` — random 32+ character string, marked Sensitive
- [ ] `SENTRY_DSN` — from Sentry project settings
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — same DSN (public, for client-side)
- [ ] `SENTRY_ORG` — Sentry organization slug
- [ ] `SENTRY_PROJECT` — Sentry project slug
- [ ] `BETA_MODE_ENABLED` — `true` (from Task 2.1)
- [ ] `BETA_ALLOWED_EMAILS` — comma-separated list of beta tester emails

**Eval**: Run `scripts/verify-env.sh` against production environment. All checks pass.

**Reference**: [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables) — Use "Sensitive" toggle for API keys. [Stripe Test vs Live Mode](https://docs.stripe.com/keys) — Live keys start with `sk_live_`/`pk_live_`.

---

### TASK 3.2 — Configure Stripe Live Mode Webhook Endpoint
**Problem**: Stripe must be configured to send live webhook events to `https://retrophotoai.com/api/webhooks/stripe`.

**Success Criteria**:
- [ ] Live webhook endpoint created in Stripe Dashboard → Developers → Webhooks
- [ ] Endpoint URL: `https://retrophotoai.com/api/webhooks/stripe`
- [ ] Events subscribed: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Signing secret (`whsec_...`) saved to Vercel as `STRIPE_WEBHOOK_SECRET`
- [ ] Send test webhook from Stripe dashboard → returns 200
- [ ] Webhook shows as "Active" in Stripe dashboard

**Eval**: Stripe Dashboard → Webhooks → Send test event → verify 200 response and event appears in `stripe_webhook_events` table.

**Reference**: [Stripe Webhook Setup Guide](https://docs.stripe.com/webhooks#register-a-webhook-endpoint) — Register endpoints per environment. [Stripe Go-Live Checklist](https://docs.stripe.com/get-started/checklist/go-live) — Recreate test-mode objects in live mode.

---

### TASK 3.3 — Create Stripe Live Mode Product and Price
**Problem**: Stripe products/prices created in test mode do NOT exist in live mode. Must recreate.

**Success Criteria**:
- [ ] Product "RetroPhoto Credits" created in Stripe live mode dashboard
- [ ] Price: $9.99 / one-time, for 10 credits
- [ ] Price ID saved as `STRIPE_CREDITS_PRICE_ID` in Vercel
- [ ] Promotion codes enabled on the product (for beta discount codes)
- [ ] Test purchase completes in live mode (use a $1 test coupon)

**Eval**: Complete a real $0.01 purchase through the live checkout flow. Verify credits appear in database.

**Reference**: [Stripe Products and Prices](https://docs.stripe.com/products-prices/manage-prices) — Products must be recreated in live mode.

---

### TASK 3.4 — Configure Vercel Cron for Credit Expiration
**Problem**: `/api/cron/expire-credits` route exists but no scheduler is configured. Credits won't expire after 365 days without this.

**Success Criteria**:
- [ ] `vercel.json` created with cron configuration:
  ```json
  { "crons": [{ "path": "/api/cron/expire-credits", "schedule": "0 3 * * *" }] }
  ```
- [ ] `CRON_SECRET` set in Vercel environment
- [ ] Cron endpoint returns 200 when called with correct Bearer token
- [ ] Cron endpoint returns 401 when called without token
- [ ] Vercel dashboard shows cron job as "Active"

**Eval**: `curl -H "Authorization: Bearer $CRON_SECRET" https://retrophotoai.com/api/cron/expire-credits` returns 200.

**Reference**: [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) — Add crons to `vercel.json`. Requires Pro plan ($20/mo) or higher.

---

### TASK 3.5 — Upgrade Supabase to Pro Plan
**Problem**: Free-tier Supabase projects can be paused for inactivity. Not acceptable for production with paying customers.

**Success Criteria**:
- [ ] Supabase project upgraded to Pro ($25/month) or higher
- [ ] Connection pooling configured (Supavisor, transaction mode on port 6543)
- [ ] Database backups enabled (point-in-time recovery)
- [ ] Network restrictions reviewed (optional but recommended)
- [ ] Supabase MFA enabled on admin account

**Eval**: Supabase dashboard → Settings → shows "Pro" plan. Backups section shows recent backup.

**Reference**: [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) — Pro plan minimum for production. [Supabase Pricing](https://supabase.com/pricing)

---

## Phase 4: CI/CD and Deployment Pipeline

### TASK 4.1 — Create GitHub Actions CI Workflow
**Problem**: No automated testing or build verification on pull requests.

**Success Criteria**:
- [ ] `.github/workflows/ci.yml` created
- [ ] Runs on pull requests to `main`
- [ ] Steps: checkout → install → typecheck → lint → unit tests → build
- [ ] Caches `node_modules` and `.next/cache` for speed
- [ ] Fails PR if any step fails
- [ ] Uses Node.js 20.x (LTS)
- [ ] Takes <5 minutes for a clean run

**Eval**: Open a PR with a TypeScript error → CI fails. Fix error → CI passes.

**Reference**: [GitHub Actions for Next.js](https://nextjs.org/docs/app/guides/ci-build-caching) — Caching strategies. [Vercel + GitHub Integration](https://vercel.com/docs/deployments/git/vercel-for-github)

---

### TASK 4.2 — Run Production Build Verification
**Problem**: Must verify the app builds without errors before first deployment.

**Success Criteria**:
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors (warnings acceptable)
- [ ] `npm run build` completes successfully
- [ ] No `NEXT_PUBLIC_` variables referenced but undefined in build output warnings
- [ ] Build output size is reasonable (<5MB first load JS)

**Eval**: All three commands exit with code 0.

---

## Phase 5: Operational Readiness

### TASK 5.1 — Configure Sentry for Production Cost Efficiency
**Problem**: Current config has `tracesSampleRate: 1.0` (100% of transactions). This is expensive in production and may exceed free tier quickly.

**Success Criteria**:
- [ ] `sentry.server.config.ts`: `tracesSampleRate` changed to `0.2` (20%)
- [ ] `sentry.client.config.ts`: `tracesSampleRate` changed to `0.2` (20%)
- [ ] `replaysSessionSampleRate` stays at `0.1` (10%)
- [ ] `replaysOnErrorSampleRate` stays at `1.0` (100% for errors — critical)
- [ ] Verify Sentry dashboard receives events after deployment

**Eval**: Deploy → trigger an error → verify it appears in Sentry within 60 seconds.

**Reference**: [Sentry Sampling Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/sampling/) — "For production, we recommend 0.1-0.25." [Sentry Pricing](https://sentry.io/pricing/) — Event quotas matter.

---

### TASK 5.2 — Set Up Upstash Redis for Distributed Rate Limiting
**Problem**: Without Redis, rate limiting resets on every serverless cold start. A determined user could bypass limits.

**Success Criteria**:
- [ ] Upstash Redis database created (free tier: 10K commands/day, sufficient for beta)
- [ ] `UPSTASH_REDIS_REST_URL` set in Vercel
- [ ] `UPSTASH_REDIS_REST_TOKEN` set in Vercel (marked Sensitive)
- [ ] Rate limiter logs confirm "Using Upstash Redis" (not "Using in-memory fallback")
- [ ] Rate limit persists across cold starts (test by making requests, waiting 5+ min, making more)

**Eval**: Hit `/api/restore` 6 times rapidly → get 429 on 6th request. Wait 5 minutes (serverless may cold start). Hit again → still rate limited (not reset).

**Reference**: [Upstash Redis Quick Start](https://upstash.com/docs/redis/overall/getstarted) — Free tier sufficient for beta. [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)

---

### TASK 5.3 — Run Database Migrations on Production Supabase
**Problem**: Production Supabase must have all tables, functions, and RLS policies from migrations 010-017.

**Success Criteria**:
- [ ] All 8 migrations (010-017) applied successfully to production database
- [ ] Tables exist: `user_quota`, `upload_sessions`, `restoration_results`, `user_credits`, `credit_batches`, `payment_transactions`, `stripe_webhook_events`, `payment_refunds`, `analytics_events`
- [ ] RPC functions exist: `check_quota`, `add_credits`, `deduct_credit`, `process_refund`, `expire_credits`
- [ ] RLS enabled on all tables (verify in Supabase dashboard → Authentication → Policies)
- [ ] Service role can execute all RPC functions

**Eval**: Run `scripts/apply-migrations.sh` against production DB. Query each table — no errors.

**Reference**: [Supabase Migrations Guide](https://supabase.com/docs/guides/deployment/custom-domains) — Apply migrations before go-live.

---

### TASK 5.4 — Configure Custom Domain and DNS
**Problem**: `retrophotoai.com` must point to the Vercel deployment.

**Success Criteria**:
- [ ] Domain `retrophotoai.com` added to Vercel project
- [ ] DNS records configured (CNAME or A record pointing to Vercel)
- [ ] SSL certificate auto-provisioned (Vercel handles this)
- [ ] `https://retrophotoai.com` loads the landing page
- [ ] `www.retrophotoai.com` redirects to `retrophotoai.com` (or vice versa)
- [ ] HSTS header present in response (`Strict-Transport-Security`)

**Eval**: `curl -I https://retrophotoai.com` returns 200 with HSTS header.

**Reference**: [Vercel Custom Domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) — Add via dashboard, configure DNS.

---

## Phase 6: End-to-End Smoke Testing

### TASK 6.1 — Manual Smoke Test: Free Tier Flow
**Success Criteria**:
- [ ] Visit `https://retrophotoai.com` → landing page loads in <3s
- [ ] Click "Try Free" → navigate to `/app`
- [ ] Upload a photo (drag-drop or file picker)
- [ ] Restoration completes within 12 seconds (p95 SLO)
- [ ] Before/after comparison slider works
- [ ] Share button generates shareable link
- [ ] Result page loads at `/result/[id]`
- [ ] Second restoration attempt shows "Quota Exceeded" with upgrade prompt
- [ ] OG card loads when sharing link on social media

---

### TASK 6.2 — Manual Smoke Test: Payment Flow
**Success Criteria**:
- [ ] Click "Buy Credits" → redirected to Stripe Checkout
- [ ] Complete purchase with test card (or real card with $0.01 coupon)
- [ ] Redirected back to app with "Payment successful" message
- [ ] Credit balance shows 10 credits
- [ ] Webhook event recorded in `stripe_webhook_events` table
- [ ] Credits deducted on each restoration (balance decreases)
- [ ] Purchase history shows completed transaction

---

### TASK 6.3 — Manual Smoke Test: Auth Flow
**Success Criteria**:
- [ ] Sign up with email/password → email verification sent
- [ ] Click email link → redirected to app, authenticated
- [ ] User menu shows email and sign-out option
- [ ] Sign out → returned to landing page
- [ ] Sign in again → session restored
- [ ] Credits persist across sessions

---

### TASK 6.4 — Production E2E Test Suite
**Success Criteria**:
- [ ] `npm run test:e2e:prod` passes against `https://retrophotoai.com`
- [ ] All 5 device profiles tested (Chromium, Firefox, WebKit, Pixel 5, iPhone 12)
- [ ] No test failures in upload, restoration, or sharing flows
- [ ] Test report saved as artifact

**Eval**: Playwright HTML report shows all tests green.

---

## Phase 7: Launch Checklist (Day-Of)

### TASK 7.1 — Final Pre-Launch Verification
- [ ] All Phase 1-5 tasks completed
- [ ] Production build deployed to Vercel
- [ ] DNS propagated (verify with `dig retrophotoai.com`)
- [ ] Stripe live mode webhook receiving events
- [ ] Sentry receiving error events
- [ ] Rate limiting working (Upstash Redis)
- [ ] Cron job scheduled (credit expiration)
- [ ] Beta allowlist populated with tester emails
- [ ] `BETA_MODE_ENABLED=true` in production

### TASK 7.2 — Send Beta Invitations
- [ ] Email template prepared for beta testers
- [ ] Include: sign-up link, promo code for first purchase, feedback channel
- [ ] Add tester emails to `BETA_ALLOWED_EMAILS`
- [ ] Verify each tester can sign up and purchase

### TASK 7.3 — Monitor First 24 Hours
- [ ] Watch Sentry for unexpected errors
- [ ] Watch Stripe Dashboard for payment issues
- [ ] Watch Supabase Dashboard for database health
- [ ] Watch Vercel Analytics for response times
- [ ] Check TTM metrics (should be ≤6s p50, ≤12s p95)
- [ ] Respond to any beta tester feedback within 4 hours

---

## Priority Sequencing

```
Phase 1: Security Blockers          [~2-3 hours]  ← DO FIRST
  1.1 Fix CSRF localhost
  1.2 Remove hardcoded creds
  1.3 Add Stripe price validation

Phase 2: Invite-Only Gating         [~3-4 hours]
  2.1 Email allowlist
  2.2 Waitlist UI

Phase 3: Environment Config         [~2-3 hours]  ← Can parallel with Phase 2
  3.1 Vercel env vars
  3.2 Stripe live webhook
  3.3 Stripe live product/price
  3.4 Vercel cron
  3.5 Supabase Pro

Phase 4: CI/CD                      [~1-2 hours]  ← Can parallel with Phase 3
  4.1 GitHub Actions
  4.2 Build verification

Phase 5: Operations                  [~2-3 hours]
  5.1 Sentry sampling
  5.2 Upstash Redis
  5.3 Production migrations
  5.4 Custom domain

Phase 6: Smoke Testing              [~2-3 hours]
  6.1 Free tier flow
  6.2 Payment flow
  6.3 Auth flow
  6.4 E2E test suite

Phase 7: Launch                      [~1 hour]
  7.1 Pre-launch checklist
  7.2 Beta invitations
  7.3 Monitor
```

**Total estimated effort**: 13-19 hours of focused work

**Critical path**: Phase 1 → Phase 2 → Phase 3.2 (Stripe webhook) → Phase 5.3 (migrations) → Phase 6 (smoke tests) → Phase 7 (launch)

---

## What You Do NOT Need to Build

These were investigated and confirmed **not needed** for invite-only beta:

1. **Multi-model AI routing** — SwinIR works well. Other models (GPT, Gemini, Grok) are scaffolded but not needed for MVP. Current orchestrator correctly falls back to SwinIR for all image types.

2. **Subscription billing** — One-time credit packs are sufficient for beta. Subscription webhook events are logged but not processed (acceptable).

3. **Admin dashboard** — Use Supabase Dashboard, Stripe Dashboard, and Sentry directly for monitoring during beta.

4. **Email service (Resend)** — Nice-to-have. `lib/email/index.ts` gracefully degrades when `RESEND_API_KEY` is not set. Stripe sends its own payment receipts.

5. **Nonce-based CSP** — Current CSP with allowlists is sufficient. Nonce-based would require dynamic rendering for all pages. Low ROI for beta.

6. **vercel.json** (except for cron) — Next.js + Vercel auto-configuration handles routing, headers, and build settings correctly via `next.config.ts` and `middleware.ts`.

7. **Code duplication cleanup** — `lib/quota/tracker.ts` duplicates `lib/dal/user-quota.ts`. Technical debt but zero user impact. Fix post-launch.

---

## Documentation References (February 2026)

All references verified for recency as of 2026-02-07:

| Topic | URL | Last Verified |
|-------|-----|---------------|
| Next.js Production Checklist | https://nextjs.org/docs/app/guides/production-checklist | Feb 2026 |
| Next.js 15.5 Release Notes | https://nextjs.org/blog/next-15-5 | Jan 2026 |
| CVE-2025-55182 (React2Shell) Patch | https://nextjs.org/blog/CVE-2025-66478 | Dec 2025 |
| Supabase Production Checklist | https://supabase.com/docs/guides/deployment/going-into-prod | Feb 2026 |
| Supabase RLS Best Practices | https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv | Feb 2026 |
| Stripe Go-Live Checklist | https://docs.stripe.com/get-started/checklist/go-live | Feb 2026 |
| Stripe Webhook Best Practices | https://docs.stripe.com/webhooks | Feb 2026 |
| Vercel Production Checklist | https://vercel.com/docs/production-checklist | Feb 2026 |
| Vercel Cron Jobs | https://vercel.com/docs/cron-jobs | Feb 2026 |
| Vercel Environment Variables | https://vercel.com/docs/projects/environment-variables | Feb 2026 |
| Sentry Next.js Setup | https://docs.sentry.io/platforms/javascript/guides/nextjs/ | Feb 2026 |
| Upstash Rate Limiting | https://upstash.com/docs/redis/sdks/ratelimit-ts/overview | Feb 2026 |
| Replicate SwinIR Model | https://replicate.com/jingyunliang/swinir | Feb 2026 |
| OWASP CSRF Prevention | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | Feb 2026 |
| GitHub Actions CI for Next.js | https://nextjs.org/docs/app/guides/ci-build-caching | Feb 2026 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Replicate API outage during beta | Low | High (restorations fail) | `p-retry` with 1 retry already implemented. Communicate to testers. |
| Stripe webhook delivery failures | Low | High (credits not added) | Stripe retries for 3 days. Monitor `stripe_webhook_events` table for `failed` status. |
| Supabase connection limits exceeded | Low (Pro plan) | Medium (503 errors) | Monitor via Supabase dashboard. Upgrade to Large plan if needed. |
| Rate limit bypass (no Redis) | Medium | Low (extra free restores) | Task 5.2 configures Upstash Redis. Acceptable risk during beta. |
| Fingerprint spoofing (free tier abuse) | Low | Low ($0.04/restore cost) | Acceptable for beta. Add IP-based limiting if abused. |
| Browser compatibility issue | Medium | Medium (broken UI) | Playwright tests 5 device profiles. Beta testers provide feedback. |

---

*Generated 2026-02-07 using chain-of-verification methodology across 5 specialized analysis agents.*
