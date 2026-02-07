# Requirements — Invite-Only Beta Launch

> Scoped features for production deployment. Each requirement traces to a roadmap phase.

## v1 — Invite-Only Beta (THIS LAUNCH)

### Security [Phase 01]
- **REQ-SEC-01**: CSRF validation excludes localhost origins in production
- **REQ-SEC-02**: No credentials, passwords, or API keys in source code
- **REQ-SEC-03**: Stripe webhook validates payment amount before fulfilling credits

### Access Control [Phase 02]
- **REQ-ACL-01**: Email allowlist gates premium features (purchase, unlimited restores)
- **REQ-ACL-02**: Allowlist configurable via environment variable (no deploy needed to add users)
- **REQ-ACL-03**: Non-allowlisted users see friendly waitlist UI (not error)
- **REQ-ACL-04**: Free tier (1 restore via fingerprint) available to everyone
- **REQ-ACL-05**: Feature toggle (`BETA_MODE_ENABLED`) to disable gating for public launch

### Infrastructure [Phase 03]
- **REQ-INF-01**: All environment variables set in Vercel production environment
- **REQ-INF-02**: Stripe live mode webhook endpoint receiving events
- **REQ-INF-03**: Stripe live mode product and price created
- **REQ-INF-04**: Cron job scheduled for credit expiration
- **REQ-INF-05**: Supabase on Pro plan (not free tier)

### CI/CD [Phase 04]
- **REQ-CI-01**: GitHub Actions runs typecheck + lint + test + build on PRs
- **REQ-CI-02**: Production build succeeds with zero errors

### Operations [Phase 05]
- **REQ-OPS-01**: Sentry sampling rates appropriate for production costs
- **REQ-OPS-02**: Distributed rate limiting via Upstash Redis
- **REQ-OPS-03**: Database migrations applied to production Supabase
- **REQ-OPS-04**: Custom domain configured with SSL

### Validation [Phase 06]
- **REQ-VAL-01**: Free tier flow works end-to-end (upload → restore → result → share)
- **REQ-VAL-02**: Payment flow works end-to-end (checkout → webhook → credits → restore)
- **REQ-VAL-03**: Auth flow works end-to-end (signup → verify → login → session)
- **REQ-VAL-04**: E2E test suite passes against production

### Launch [Phase 07]
- **REQ-LCH-01**: Beta allowlist populated with tester emails
- **REQ-LCH-02**: Beta invitation emails sent
- **REQ-LCH-03**: First 24-hour monitoring completed without critical issues

## v2 — Post-Beta (FUTURE)

- **REQ-V2-01**: Multi-model AI routing (portrait, landscape, document classification)
- **REQ-V2-02**: Flexible pricing tiers (multiple credit packs)
- **REQ-V2-03**: Admin dashboard for user/payment management
- **REQ-V2-04**: Transactional email via Resend
- **REQ-V2-05**: Subscription billing
- **REQ-V2-06**: Public signup (remove invite gating)
- **REQ-V2-07**: Nonce-based CSP
- **REQ-V2-08**: Quota code deduplication (tracker.ts + user-quota.ts)

## Deferred (NOT in scope)

- Mobile native app
- Image editing features (crop, filter, etc.)
- Batch upload / bulk processing
- API access for third-party integrations
- White-label / enterprise features
