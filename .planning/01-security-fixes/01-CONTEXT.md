# Phase 01 Context — Security Fixes

> Decisions locked before planning. Flows to researcher, planner, and checker agents.

## Domain Boundary

This phase covers ONLY security vulnerabilities that must be fixed before any user touches production. No new features, no refactoring, no cosmetic changes.

## Locked Decisions

### CSRF Fix (REQ-SEC-01)
- **Decision**: Conditional localhost origins — include ONLY when `NODE_ENV === 'development'`
- **Rationale**: Simple, zero-risk fix. No need for a feature flag.
- **Constraint**: Must not break development mode. `npm run dev` must still work.

### Credential Removal (REQ-SEC-02)
- **Decision**: Move to `process.env.TEST_EMAIL` and `process.env.TEST_PASSWORD` in E2E tests
- **Rationale**: Credentials are already exposed in git history. Immediate fix prevents future commits. History rewriting is a v2 concern.
- **Constraint**: Add `.env.test.example` documenting required test variables. Do NOT create `.env.test` (it's gitignored).

### Stripe Price Validation (REQ-SEC-03)
- **Decision**: Validate `session.amount_total` and `session.currency` before adding credits
- **Rationale**: Prevents hypothetical payment manipulation. Defense in depth.
- **Constraint**: On mismatch, return 200 to Stripe (prevent retries) but skip fulfillment. Log as error.
- **Expected values**: `amount_total: 999` (cents), `currency: 'usd'`. Read from env var `STRIPE_EXPECTED_AMOUNT` with fallback to 999.

## Claude's Discretion

- Exact log messages for security events
- Whether to use a constant or env var for expected amount (preference: env var for flexibility)
- Test structure for the new validation

## Deferred

- Git history scrubbing for leaked credentials (v2)
- Nonce-based CSP (v2)
- Rate limiting in middleware (already works, not a security blocker)
