# RetroPhoto — Invite-Only Beta Launch

> AI-powered photo restoration. Upload old photos, get realistic HD results in seconds. Ship a paid beta to 10-50 testers and start collecting revenue.

## Vision

RetroPhoto turns old, faded, scratched photographs into stunning high-definition images using AI super-resolution. One upload, one click, instant magic. The product sells credits — pay once, restore many — with a free tier that demonstrates value before asking for money.

## Current State

- **Codebase maturity**: ~90% production-ready. 22/25 features are WORKING implementations.
- **AI pipeline**: SwinIR model via Replicate API. Multi-model routing scaffolded but not active.
- **Payment system**: Stripe Checkout + webhooks + credit system. End-to-end functional. Hardcoded 10 credits/$9.99.
- **Auth**: Supabase Auth (OAuth + email). Guest mode with fingerprint-based quota. No invite gating.
- **Database**: 9 tables, 5 RPC functions, RLS on all tables. 8 migrations (010-017) applied.
- **Testing**: 22 test files across unit, integration, E2E, and security suites. 5 Playwright device profiles.
- **Monitoring**: Sentry configured. Vercel Analytics. Structured logger.
- **PWA**: Service worker, background sync, offline fallback.

## Target Outcome

A live, invite-only beta at `retrophotoai.com` where:
1. Invited users can sign up, purchase credits with real money, and restore photos
2. Non-invited users can try one free restoration but cannot purchase
3. Payments flow through Stripe live mode with proper webhook handling
4. Errors are tracked in Sentry, performance in Vercel Analytics
5. The operator can monitor health via existing dashboards (Supabase, Stripe, Sentry, Vercel)

## Non-Goals for This Launch

- Multi-model AI routing (SwinIR is sufficient)
- Admin dashboard (use Supabase/Stripe dashboards directly)
- Transactional email service (Stripe sends payment receipts)
- Subscription billing (one-time credit packs only)
- Public launch / marketing
- Mobile app (PWA is sufficient)

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TTM p50 | ≤6 seconds | Sentry transaction traces |
| TTM p95 | ≤12 seconds | Sentry transaction traces |
| Payment success rate | ≥95% | Stripe Dashboard |
| Error rate | <1% of restorations | Sentry error tracking |
| Uptime | 99.9% | Vercel status |

## Tech Stack (Locked)

Next.js 15.5, React 19, TypeScript 5.7, Tailwind CSS 4.0, Supabase, Stripe, Replicate (SwinIR), Upstash Redis, Sentry, Vercel.

## Constitutional Principles (Locked)

1. Zero Friction to Wow — preview before any wall
2. Mobile-First Always — touch targets ≥44px
3. First-Run Nirvana — upload → restore → preview without interruption
4. Share-Ready by Default — auto-generate OG cards, GIFs, deep links
5. Tasteful Monetization — show result before upsell
6. Fail-Closed Security — deny on quota check failure
7. Server-Side AI — never expose API keys to client
