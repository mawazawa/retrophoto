# State — Session Memory

> Decisions, blockers, and session context. Updated after each phase.

## Locked Decisions

### Architecture
- **Deployment target**: Vercel (serverless)
- **Database**: Supabase Pro plan (PostgreSQL + RLS)
- **AI model**: SwinIR via Replicate API (no multi-model for v1)
- **Rate limiting**: Upstash Redis (distributed) with in-memory fallback
- **Monitoring**: Sentry + Vercel Analytics
- **Auth**: Supabase Auth (OAuth + email), no custom auth
- **Payments**: Stripe Checkout (one-time purchases, not subscriptions)

### Invite-Only Gating
- Gate premium features only (purchasing, unlimited restores)
- Free tier (1 restore via fingerprint) available to everyone
- Allowlist via environment variable (`BETA_ALLOWED_EMAILS`)
- Domain-based allowlist via `BETA_ALLOWED_DOMAINS`
- Toggle via `BETA_MODE_ENABLED` for easy public launch later
- Check at checkout endpoint, not at `/app` page load

### Security
- CSRF: Conditional localhost origins (dev only)
- Credentials: Move to `.env.test` (gitignored)
- Price validation: Check `amount_total` in webhook handler
- No secrets rotation needed (Next.js already at 15.5.9, CVE-2025-55182 patched)

### Pricing
- 10 credits for $9.99 (hardcoded, acceptable for beta)
- Credits expire after 365 days (FIFO deduction)
- No flexible pricing tiers for v1

## Claude's Discretion

These areas are delegated to Claude's judgment during execution:
- Exact error messages and copy for waitlist UI
- GitHub Actions caching strategy
- Sentry sampling percentages (within 10-25% range)
- Git branching strategy for CI workflow

## Current Blockers

None. All dependencies are resolvable without external input.

## Deferred Ideas

- Promo code system for beta testers (use Stripe's built-in promotion codes)
- Usage analytics dashboard
- Email notifications for successful restorations
- Referral system

## Verification Results

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| 01 | pending | — | — |
| 02 | pending | — | — |
| 03 | pending | — | — |
| 04 | pending | — | — |
| 05 | pending | — | — |
| 06 | pending | — | — |
| 07 | pending | — | — |

## Compound Learnings

_Updated after each phase. Codified insights flow back to CLAUDE.md._

### Session 2026-02-07
- Chain-of-verification across 5 agents confirmed: 22/25 features working, 3 security blockers, 1 feature gap (invite gating)
- Next.js 15.5.9 already patches CVE-2025-55182 (React2Shell RCE). No upgrade needed.
- Supabase free tier pauses projects for inactivity — must upgrade to Pro before launch
- Stripe test-mode objects do NOT exist in live mode — must recreate product/price
