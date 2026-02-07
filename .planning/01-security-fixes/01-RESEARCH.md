# Phase 01 Research — Security Fixes

> Domain investigation findings from parallel research agents. Verified 2026-02-07.

## CSRF Origin Validation

**Source**: [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

**Finding**: Origin header validation is a recommended CSRF defense. The key requirement: the allowed origin list must ONLY contain production origins in production. Including `localhost` in production allows an attacker running a local server to bypass CSRF checks if they can get a victim to visit their local page (unlikely but unnecessary risk).

**Implementation pattern**:
```typescript
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
].filter(Boolean) as string[]
```

**Verification**: This is a 2-line change. No risk of breaking production. Development mode continues to work because `NODE_ENV=development` is set by `next dev`.

## Credential Handling in Tests

**Source**: [Playwright Environment Variables](https://playwright.dev/docs/test-parameterize#passing-environment-variables)

**Finding**: Playwright supports `process.env` access in test files. The standard pattern is:
```typescript
const email = process.env.TEST_EMAIL
if (!email) test.skip()
```

Tests gracefully skip when credentials are not available (CI without secrets, new contributor setup).

**Source**: [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

**Finding**: GitHub's secret scanning may flag hardcoded passwords. The credential `Karmaisabitch2025$` is a real password in the repository at `tests/e2e/auth-flow.spec.ts:9`. Even after removal from source, it persists in git history. Immediate rotation of this password is recommended.

## Stripe Webhook Price Validation

**Source**: [Stripe Fulfillment Best Practices](https://docs.stripe.com/payments/checkout/fulfill-orders)

**Finding**: Stripe explicitly recommends: "Always verify the payment amount and currency before fulfilling orders." The `checkout.session.completed` event includes `amount_total` (in cents) and `currency`.

**Source**: [Stripe Webhook Security](https://docs.stripe.com/webhooks#verify-official-libraries)

**Finding**: Signature verification (already implemented) prevents event forgery. Price validation is defense-in-depth against:
1. Price ID misconfiguration (wrong product linked)
2. Coupon/discount abuse (if added later without corresponding credit adjustment)
3. Currency mismatch

**Implementation pattern**:
```typescript
const session = event.data.object as Stripe.Checkout.Session
const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999')
if (session.amount_total !== expectedAmount || session.currency !== 'usd') {
  logger.error('Price mismatch', { expected: expectedAmount, actual: session.amount_total })
  return NextResponse.json({ received: true }) // 200 to prevent retries
}
```

## Pitfalls Identified

1. **Don't break the dev server**: The CSRF fix must be conditional on `NODE_ENV`, not on presence of `NEXT_PUBLIC_BASE_URL` (which might not be set in dev)
2. **Don't make E2E tests fail by default**: Use `test.skip()` when env vars are missing, not `throw`
3. **Don't return non-200 to Stripe for validation failures**: Stripe will retry for 3 days, filling up the webhook events table with duplicate entries
