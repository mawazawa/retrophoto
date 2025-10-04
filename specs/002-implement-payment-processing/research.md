# Research & Technical Decisions: Payment Processing

**Feature**: Payment Processing with Stripe
**Date**: 2025-10-03
**Status**: Complete

## Overview
All technical unknowns were resolved during the clarification session. This document consolidates research findings and technical decisions for Stripe payment integration.

## Decision 1: Stripe Checkout vs Payment Intents

**Decision**: Use Stripe Checkout (hosted payment page)

**Rationale**:
- **PCI Compliance**: Checkout is PCI-DSS compliant out-of-box; we never handle card data
- **Simplicity**: Hosted page eliminates need for custom payment UI
- **Features**: Built-in support for promotional codes, multi-currency, tax calculation
- **Mobile optimized**: Stripe Checkout is fully responsive and mobile-friendly (aligns with Principle III: Mobile-First)
- **Lower maintenance**: Stripe handles payment form updates, security patches

**Alternatives Considered**:
- **Payment Intents**: More customizable but requires building custom payment form, PCI compliance burden, more complex integration
- **Stripe Elements**: Middle ground, but still requires more frontend work and doesn't provide hosted tax calculation

**Implementation**:
- Create checkout session server-side via `/api/create-checkout-session`
- Redirect user to `session.url` (Stripe-hosted page)
- Handle success/cancel redirects back to app
- Process payment confirmation via webhook

## Decision 2: Webhook Security & Idempotency

**Decision**: Stripe signature verification + database-level idempotency

**Rationale**:
- **Security**: Stripe webhook signatures (`stripe-signature` header) prevent spoofing
- **Idempotency**: Store `event.id` in database to prevent duplicate processing
- **Audit trail**: Log all webhook attempts for debugging and compliance
- **Reliability**: Align with constitutional Principle XV (Performance & Cost Guardrails) - idempotent job keys

**Implementation**:
```typescript
// Signature verification
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

// Idempotency check
const existing = await db.query('SELECT id FROM stripe_webhook_events WHERE event_id = $1', [event.id])
if (existing.rows.length > 0) {
  return { received: true, duplicate: true }
}

// Process event and log
await db.query('INSERT INTO stripe_webhook_events (event_id, event_type, payload, ...) VALUES (...)')
await processWebhookEvent(event)
```

**Alternatives Considered**:
- **In-memory deduplication**: Not durable across server restarts
- **Redis-based**: Adds infrastructure complexity, overkill for webhook volume (~200/day)

## Decision 3: Credit Expiration Strategy

**Decision**: Batch tracking with FIFO (First-In-First-Out) consumption + cron-based expiration

**Rationale**:
- **Fairness**: Oldest credits expire first (FIFO)
- **Transparency**: Users see expiration date per purchase batch
- **Performance**: Cron job runs daily (not per-request), batch updates
- **Compliance**: 30-day warning aligns with user control (Principle VI: Trust & Privacy)

**Database Schema**:
```sql
CREATE TABLE credit_batches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  purchase_date TIMESTAMP NOT NULL,
  expiration_date TIMESTAMP NOT NULL, -- purchase_date + 365 days
  credits_purchased INT NOT NULL,
  credits_remaining INT NOT NULL CHECK (credits_remaining >= 0),
  CHECK (expiration_date = purchase_date + INTERVAL '365 days')
);
```

**Cron Jobs**:
1. **Warning Job** (daily): Find batches expiring in 30 days, send notification
2. **Expiration Job** (daily): Find batches past expiration_date, set credits_remaining = 0, update user balance

**Alternatives Considered**:
- **Per-credit expiration**: Too granular, 10x database rows
- **Single expiration date**: Doesn't support multiple purchases, unfair LIFO
- **On-demand check**: Adds latency to every credit deduction

## Decision 4: Negative Balance Handling

**Decision**: Database-level credit balance (can be negative) + UI validation prevents usage

**Rationale**:
- **Data integrity**: Balance reflects true state (refund deducted credits)
- **User transparency**: Negative balance shown with clear explanation
- **Business logic**: Simple check `WHERE available_credits > 0` prevents restoration
- **Audit trail**: Balance history shows refund impact

**Implementation**:
```sql
-- Allow negative balance
CREATE TABLE user_quota (
  user_id UUID PRIMARY KEY,
  available_credits INT NOT NULL, -- Can be negative after refund
  total_credits_purchased INT NOT NULL,
  credits_used INT NOT NULL
);

-- Refund processing
UPDATE user_quota
SET available_credits = available_credits - 10
WHERE user_id = $1;
```

**UI Behavior**:
- Negative balance shown: "Balance: -5 credits (refund applied)"
- Restoration button disabled with message: "Purchase credits to restore balance"
- Purchase flow allows buying even with negative balance (brings it back to positive)

**Alternatives Considered**:
- **Prevent negative balance**: Requires denying refunds if credits spent (bad UX)
- **Separate refund debt field**: More complex schema, harder to understand

## Decision 5: Multi-Currency Pricing

**Decision**: Stripe Price API with dynamic currency conversion + single base price

**Rationale**:
- **Simplicity**: Define one Price ID ($9.99 USD), Stripe handles conversion
- **Tax compliance**: Stripe Tax auto-calculates based on customer location
- **Developer experience**: No manual exchange rate management
- **Constitutional**: Transparent pricing (Principle VII: Tasteful Monetization)

**Stripe Configuration**:
```javascript
// Create price in Stripe Dashboard or API
const price = await stripe.prices.create({
  unit_amount: 999, // $9.99 USD
  currency: 'usd',
  product: 'prod_xxxxx', // 10 Credit Pack
  tax_behavior: 'exclusive' // Tax calculated separately
})

// Checkout supports automatic currency conversion
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: price.id, quantity: 1 }],
  mode: 'payment',
  automatic_tax: { enabled: true } // Stripe Tax handles jurisdiction
})
```

**User Experience**:
- Display base price in USD: "$9.99 for 10 credits"
- Stripe Checkout shows localized price at checkout (if browser locale differs)
- Transaction history stores actual charged amount + currency
- Receipt shows exact amount paid in user's currency

**Alternatives Considered**:
- **Multiple Price IDs per currency**: Maintenance burden, sync issues
- **Manual exchange rates**: Compliance risk, stale data, complex logic

## Summary of Resolved Unknowns

| Unknown | Resolution | Source |
|---------|-----------|--------|
| Credit expiration policy | 1 year from purchase, 30-day warning | Clarification Q1 |
| Refund handling for spent credits | Full refund allowed, balance can go negative | Clarification Q2 |
| Webhook retry mechanism | Stripe's built-in retry (exponential backoff, 3 days) | Clarification Q3 |
| Tax calculation | Stripe auto-calculates based on billing address | Clarification Q4 |
| Currency support | All Stripe-supported currencies (150+) | Clarification Q5 |
| Payment method | Stripe Checkout (hosted, PCI-compliant) | Research Decision 1 |
| Webhook security | Signature verification + database idempotency | Research Decision 2 |
| Credit storage strategy | Batch tracking, FIFO consumption | Research Decision 3 |
| Negative balance UX | Database allows negative, UI prevents usage | Research Decision 4 |
| Multi-currency approach | Single USD price, Stripe converts | Research Decision 5 |

## Technical Dependencies Finalized

**Required Stripe Products**:
- Stripe Checkout (payment page)
- Stripe Tax (automatic tax calculation)
- Stripe Webhooks (payment confirmation)
- Stripe Customer Portal (future: subscription management)

**Database Tables**:
- `credit_batches` (new) - Track expiration per purchase
- `payment_transactions` (new) - Transaction history
- `stripe_webhook_events` (new) - Idempotency + audit
- `payment_refunds` (new) - Refund tracking
- `user_quota` (extend) - Add negative balance support

**Cron Jobs**:
- Credit expiration warning (daily at 00:00 UTC)
- Credit expiration processing (daily at 01:00 UTC)

**Environment Variables**:
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CREDITS_PRICE_ID=price_xxx
```

## Performance Considerations

**Checkout Session Creation**:
- Target: <500ms (includes Stripe API call ~200ms)
- Optimization: Server-side caching of Price ID

**Webhook Processing**:
- Target: <2s (database writes + credit allocation)
- Optimization: Batch database updates, async notification sending

**Credit Balance Query**:
- Target: <100ms (single JOIN query)
- Optimization: Indexed on user_id, denormalized available_credits

**Expiration Cron**:
- Target: <5min for 10K users
- Optimization: Batch UPDATE, WHERE expiration_date <= NOW()

## Security Checklist

- [x] Stripe Secret Key server-side only (never exposed to client)
- [x] Webhook signature verification (prevent spoofing)
- [x] Idempotency keys prevent duplicate processing
- [x] PCI DSS compliance via Stripe Checkout (no card data touched)
- [x] Row Level Security (RLS) on credit_batches, payment_transactions
- [x] HTTPS-only webhook endpoint
- [x] Audit logging for all payment operations

## Next Steps

This research phase is complete. Proceed to Phase 1 (Design & Contracts):
1. Generate data-model.md with entity schemas
2. Create API contracts in /contracts/
3. Write failing contract tests
4. Generate quickstart.md test scenarios

**Status**: ✅ Research complete - No blockers for implementation
