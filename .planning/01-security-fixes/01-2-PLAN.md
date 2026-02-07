---
phase: 01-security-fixes
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/webhooks/stripe/route.ts
  - tests/integration/webhook-price-validation.test.ts
autonomous: true
user_setup: []
must_haves:
  truths:
    - Webhook handler validates amount_total before adding credits
    - Mismatched amounts are logged and do not result in credit addition
    - Handler returns 200 on mismatch (prevents Stripe retries)
  artifacts:
    - app/api/webhooks/stripe/route.ts (patched)
    - tests/integration/webhook-price-validation.test.ts (new)
  key_links:
    - .planning/01-security-fixes/01-CONTEXT.md
    - .planning/01-security-fixes/01-RESEARCH.md
    - app/api/webhooks/stripe/route.ts
---

<objective>
Add payment amount validation to the Stripe webhook handler. Currently, the handler adds 10 credits on `checkout.session.completed` without verifying the payment amount matches the expected price.

After this plan executes, the webhook handler will validate `amount_total` and `currency` before fulfilling credits, with a new integration test proving the validation works.

Output artifacts:
- Patched webhook handler with price validation
- New integration test for price mismatch scenario
</objective>

<tasks>

<task type="auto">
  <name>Add price validation to Stripe webhook handler</name>
  <files>app/api/webhooks/stripe/route.ts</files>
  <action>
    Read the full webhook handler file first. Find the `checkout.session.completed` event handling block.

    Add price validation AFTER signature verification and idempotency check, BEFORE credit addition:

    ```typescript
    // Validate payment amount before fulfilling credits
    const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10)
    const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase()

    if (session.amount_total !== expectedAmount || session.currency?.toLowerCase() !== expectedCurrency) {
      logger.error('Payment amount mismatch - skipping fulfillment', {
        expected: { amount: expectedAmount, currency: expectedCurrency },
        actual: { amount: session.amount_total, currency: session.currency },
        sessionId: session.id,
        eventId: event.id,
      })
      // Return 200 to prevent Stripe retries, but do NOT add credits
      return NextResponse.json({ received: true, fulfilled: false, reason: 'amount_mismatch' })
    }
    ```

    Key constraints:
    - Do NOT change the response status code (must be 200)
    - Do NOT modify signature verification or idempotency logic
    - Log with `logger.error` so it appears in Sentry
    - Include session ID and event ID in log for debugging
  </action>
  <verify>
    Read the patched file and confirm:
    1. `amount_total` check exists before credit addition
    2. `currency` check exists before credit addition
    3. Mismatch returns 200 with `fulfilled: false`
    4. Logger.error called on mismatch
  </verify>
  <done>
    - Webhook handler validates amount and currency before adding credits
    - Mismatch logs error and returns 200 without fulfilling
    - Existing webhook flow unchanged for correct amounts
  </done>
</task>

<task type="auto">
  <name>Add integration test for price validation</name>
  <files>tests/integration/webhook-price-validation.test.ts</files>
  <action>
    Create a new integration test file that tests the price validation logic.

    Follow the existing test patterns in `tests/integration/webhook-idempotency.test.ts` for mocking setup.

    Test cases:
    1. Valid amount (999 cents, usd) → credits added
    2. Wrong amount (100 cents, usd) → credits NOT added, 200 response
    3. Wrong currency (999 cents, eur) → credits NOT added, 200 response
    4. Missing amount (null) → credits NOT added, 200 response

    Use the same Supabase mock patterns from `tests/mocks/supabase.ts`.
    Import from the webhook route handler if possible, otherwise test the validation logic in isolation.
  </action>
  <verify>
    Run: `npx vitest run tests/integration/webhook-price-validation.test.ts`
    Expected: all 4 test cases pass
  </verify>
  <done>
    - Integration test exists with 4 test cases covering price validation
    - All tests pass
    - Tests follow existing patterns from webhook-idempotency.test.ts
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for payment manipulation to be prevented?
  1. A checkout session with `amount_total: 100` (not 999) does NOT result in credits being added
  2. A checkout session with `currency: 'eur'` (not 'usd') does NOT result in credits being added
  3. A checkout session with `amount_total: 999` and `currency: 'usd'` DOES result in credits being added
  4. All mismatch cases return HTTP 200 (to prevent Stripe retry storms)
  5. All mismatch cases log errors (visible in Sentry)
  6. `npm test` passes with no regressions
</verification>

<success_criteria>
  - Webhook validates amount and currency before fulfillment
  - 4 integration tests pass covering valid and invalid amounts
  - No regressions in existing tests
  - Error logging on mismatch for Sentry visibility
</success_criteria>

<output>
  Save execution summary to: .planning/01-security-fixes/01-2-SUMMARY.md
</output>
