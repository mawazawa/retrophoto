# Implementation Plan: Payment Processing with Stripe

**Branch**: `002-implement-payment-processing` | **Date**: 2025-10-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-implement-payment-processing/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
2. Fill Technical Context ✓
   → Project Type: web (Next.js App Router)
   → Structure Decision: Next.js monolith
3. Fill Constitution Check section ✓
4. Evaluate Constitution Check
   → No violations detected ✓
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → No NEEDS CLARIFICATION remain (all resolved in clarification session)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
7. Re-evaluate Constitution Check
   → No new violations ✓
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Describe task generation approach ✓
9. STOP - Ready for /tasks command ✓
```

## Summary
Implement Stripe payment processing for credit purchases ($9.99 for 10 credits). Users can purchase credits via secure checkout, with automatic tax calculation and multi-currency support. Credits expire after 1 year with 30-day warning notifications. Full refunds are allowed (balance can go negative). Webhook-based payment confirmation with idempotency protection. Constitutional compliance: Tasteful monetization (Principle VII) - value-first, transparent pricing, no paywall blocking previews.

## Technical Context
**Language/Version**: TypeScript 5.7+ with Next.js 15.4.5 (App Router)
**Primary Dependencies**:
  - Payment: Stripe SDK, @stripe/stripe-js (client)
  - Database: Supabase (PostgreSQL + Auth + Storage)
  - UI: Tailwind CSS 4.0, shadcn/ui, Framer Motion
  - Testing: Vitest, Playwright
**Storage**: Supabase PostgreSQL with Row Level Security (RLS)
**Testing**: Vitest (unit), Playwright (E2E), contract tests for API
**Target Platform**: Web (Next.js deployed on Vercel)
**Project Type**: web - Next.js App Router monolith (app/, lib/, components/)
**Performance Goals**:
  - Checkout initiation: <500ms
  - Webhook processing: <2s
  - Credit allocation: <1s after webhook
  - Page load (pricing): <1.5s
**Constraints**:
  - PCI DSS compliance (no card storage)
  - Webhook idempotency (prevent duplicate credits)
  - Negative balance support (post-refund)
  - Constitutional: Tasteful monetization, transparent pricing
**Scale/Scope**:
  - Initial: 1000 concurrent users
  - Credit purchases: ~100/day expected
  - Webhook volume: ~200 events/day
  - Storage: Transactional data only (minimal)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle VII: Tasteful Monetization
**Status**: ✅ COMPLIANT

- **Previews NEVER blocked by paywalls**: Credit purchase only shown AFTER free restore completes
- **Full result before upgrade**: Users see medium-res result before being asked to upgrade
- **Free tier watermarks subtle**: Corner badge only (NOT across faces)
- **Upgrade moments natural**:
  1. After value delivery (free restore complete)
  2. During share flow (high-res upsell)
  3. When attempting second restore (quota exhausted)
  4. When zooming for detail (high-res inspection)
- **Pricing transparent**: $9.99 for 10 credits, tax auto-calculated, no hidden fees

### Principle VIII: North-Star Metrics & Quality Bars
**Status**: ✅ COMPLIANT

- **TTM not impacted**: Payment flow occurs AFTER restoration completes
- **Failed restores <1%**: Payment failures do not count as restoration failures
- **Uptime 99.9%**: Stripe SLA aligns with requirement
- **Automatic retry once**: Webhook retry via Stripe's built-in mechanism

### Principle VI: Trust & Privacy
**Status**: ✅ COMPLIANT

- **No client-side secrets**: Stripe Secret Key server-side only
- **PCI DSS compliance**: Stripe Checkout handles card data, we never touch it
- **Data retention**: Transaction history follows 30-day paid tier policy
- **User control**: Delete-all includes payment history purge

### Principle XII: Monetization Rules
**Status**: ✅ COMPLIANT

- **Free tier**: 1 restore (no account), medium-res, corner badge watermark
- **Paid tier**: High-res, batch processing, 30-day history, no watermark, priority queue
- **Credit packs**: $9.99 for 10 credits (one-time purchase, not subscription)
- **Upgrade triggers**: Natural moments after value delivery

### Principle XV: Performance & Cost Guardrails
**Status**: ✅ COMPLIANT

- **Cost budget**: Stripe fees (~3% + $0.30) accounted for in $9.99 pricing
- **Idempotent processing**: Webhook event IDs prevent duplicates
- **Retry policy**: Rely on Stripe's retry (exponential backoff, 3 days)
- **No queue needed**: Webhook processing is fast (<2s)

### Verification Results
- [x] No constitutional violations detected
- [x] All monetization rules followed
- [x] Privacy and security requirements met
- [x] Performance SLOs maintained
- [x] Cost guardrails respected

## Project Structure

### Documentation (this feature)
```
specs/002-implement-payment-processing/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (tech decisions)
├── data-model.md        # Phase 1 output (entities, schema)
├── quickstart.md        # Phase 1 output (test scenarios)
└── contracts/           # Phase 1 output (API contracts)
    ├── create-checkout-session.json
    ├── stripe-webhook.json
    └── credit-balance.json
```

### Source Code (Next.js App Router)
```
app/
├── api/
│   ├── create-checkout-session/
│   │   └── route.ts           # Stripe Checkout Session creation
│   └── webhooks/
│       └── stripe/
│           └── route.ts       # Stripe webhook handler
├── (dashboard)/
│   └── purchase/
│       └── page.tsx           # Purchase history page

lib/
├── payments/
│   ├── stripe-client.ts       # Stripe client initialization
│   ├── checkout.ts            # Checkout session utilities
│   └── webhook-handlers.ts    # Webhook event processors
├── credits/
│   ├── credit-manager.ts      # Credit allocation/deduction logic
│   ├── expiration.ts          # Credit expiration handling
│   └── refund-handler.ts      # Refund processing logic
└── db/
    ├── credits.ts             # Credit balance queries
    └── transactions.ts        # Transaction history queries

components/
└── payments/
    ├── purchase-button.tsx    # "Buy Credits" CTA
    ├── pricing-card.tsx       # Credit pack display
    └── transaction-history.tsx # Purchase history table

tests/
├── contract/
│   ├── create-checkout-session.test.ts
│   └── stripe-webhook.test.ts
├── integration/
│   ├── credit-purchase-flow.test.ts
│   ├── refund-handling.test.ts
│   └── expiration-handling.test.ts
└── unit/
    ├── credit-manager.test.ts
    └── webhook-handlers.test.ts
```

**Structure Decision**: Next.js App Router monolith with feature-based organization. API routes in `app/api/`, business logic in `lib/`, UI components in `components/`, tests mirror source structure. This aligns with constitutional Architecture Standards (Principle XIV) - Next.js 15+ App Router with Server Actions.

## Phase 0: Outline & Research

**No unknowns remaining** - All technical context questions were resolved during clarification session:
- Credit expiration: 1 year from purchase ✓
- Refund policy: Full refund, negative balance allowed ✓
- Webhook retry: Stripe's built-in mechanism ✓
- Tax handling: Stripe auto-calculates ✓
- Currency support: All Stripe-supported currencies ✓

**Research Tasks Completed**:
1. ✓ Stripe Checkout vs Payment Intents → Decision: Checkout (simpler, hosted, PCI-compliant)
2. ✓ Webhook security → Decision: Stripe signature verification + idempotency keys
3. ✓ Credit expiration strategy → Decision: Batch tracking by purchase date, cron-based expiration
4. ✓ Negative balance handling → Decision: Database-level credit balance (can be negative), UI validation prevents usage
5. ✓ Multi-currency pricing → Decision: Stripe Price API with currency conversion, single base price

**Output**: research.md (generated below)

## Phase 1: Design & Contracts
*Prerequisites: research.md complete ✓*

### Entities Extracted from Spec

1. **Credit Balance** (extends existing user_quota table)
   - Fields: user_id, total_credits, available_credits, credits_used, last_purchase_date
   - Validation: available_credits can be negative (post-refund)
   - State transitions: purchase → add credits, use → deduct credits, refund → deduct credits, expire → deduct credits

2. **Credit Purchase Batch** (new table: credit_batches)
   - Fields: id, user_id, purchase_date, expiration_date (purchase_date + 365 days), credits_purchased, credits_remaining
   - Validation: expiration_date must be purchase_date + 365 days
   - Lifecycle: created on purchase → decremented on usage (FIFO) → expired when expiration_date passed

3. **Transaction** (new table: payment_transactions)
   - Fields: id, user_id, stripe_session_id, stripe_payment_intent_id, amount, currency, credits_purchased, status (pending/completed/failed/refunded), created_at, updated_at
   - Validation: stripe_session_id unique, amount > 0, credits_purchased = 10
   - Immutable: Once created, only status field can update

4. **Webhook Event Log** (new table: stripe_webhook_events)
   - Fields: id, event_id (Stripe event ID), event_type, payload, processed_at, processing_status (pending/success/failed), retry_count
   - Validation: event_id unique (idempotency), retry_count ≤ 3
   - Purpose: Audit trail, prevent duplicate processing

5. **Refund Record** (new table: payment_refunds)
   - Fields: id, transaction_id (FK), stripe_refund_id, amount_refunded, credits_deducted, refund_date, reason
   - Validation: amount_refunded ≤ original transaction amount
   - Links to: payment_transactions

### API Contracts Generated

**Endpoint 1: POST /api/create-checkout-session**
- Input: { user_id: string }
- Output: { session_id: string, checkout_url: string }
- Errors: 401 (unauthorized), 503 (Stripe unavailable)

**Endpoint 2: POST /api/webhooks/stripe**
- Input: Stripe webhook payload + signature header
- Output: { received: true }
- Errors: 400 (invalid signature), 500 (processing failed)

**Endpoint 3: GET /api/credits/balance**
- Input: user_id (from auth)
- Output: { total_credits: number, available_credits: number, batches: [{ expiration_date, credits_remaining }] }
- Errors: 401 (unauthorized)

**Endpoint 4: GET /api/transactions**
- Input: user_id (from auth), limit?: number
- Output: { transactions: [{ id, date, amount, currency, credits, status }] }
- Errors: 401 (unauthorized)

### Contract Test Strategy

Each contract → dedicated test file:
- `tests/contract/create-checkout-session.test.ts` - Assert request/response schemas, validate session creation
- `tests/contract/stripe-webhook.test.ts` - Assert signature validation, event processing, idempotency
- `tests/contract/credit-balance.test.ts` - Assert balance calculation, expiration tracking
- `tests/contract/transactions.test.ts` - Assert transaction history structure

Tests initially FAIL (no implementation yet) - this is expected TDD behavior.

### Integration Test Scenarios from User Stories

1. **Credit Purchase Flow** (stories 1-4, 6-8):
   - User initiates purchase → redirected to Stripe → completes payment → webhook processed → credits added → user sees confirmation
   - Assertions: Session created, webhook received, credits = 10, balance updated, history shows transaction

2. **Refund Handling** (stories 11-12):
   - User requests refund → Stripe processes → webhook received → credits deducted → balance goes negative → restoration blocked
   - Assertions: Refund recorded, credits deducted, balance = -X, restoration returns error

3. **Expiration Handling** (stories 9-10):
   - Credits purchased → 335 days pass → warning notification → 30 more days pass → credits expire → balance reduced
   - Assertions: Warning sent at 335 days, credits removed at 365 days

4. **Idempotency Protection** (story 8):
   - Webhook received → processed → duplicate webhook received → duplicate rejected
   - Assertions: Credits added once, event logged twice (second marked duplicate)

**Output**: data-model.md, /contracts/*, failing contract tests, quickstart.md (generated below)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Load `.specify/templates/tasks-template.md` as base structure
2. Generate tasks from Phase 1 artifacts:
   - Each contract (4 files) → 1 contract test task [P]
   - Each entity (5 entities) → 1 database migration task [P]
   - Each user story (12 scenarios) → 1 integration test task
   - Each API endpoint (4 endpoints) → 1 implementation task
   - Supporting tasks: Stripe setup, webhook signature verification, credit expiration cron, refund handling

**Ordering Strategy**:
1. **Foundation** (parallel): Database migrations, Stripe setup
2. **Contract Tests** (parallel): All contract tests (will fail initially)
3. **Core Implementation** (sequential):
   - Checkout session creation
   - Webhook handling + idempotency
   - Credit allocation logic
   - Refund processing
   - Expiration handling
4. **Integration Tests** (sequential): Test each complete flow
5. **UI Components** (parallel): Purchase button, pricing card, history table
6. **Validation**: Quickstart execution, performance testing

**Task Dependencies**:
- Database migrations → Contract tests
- Contract tests → Implementation
- Implementation → Integration tests
- Integration tests → UI components
- All → Quickstart validation

**Estimated Output**:
- 5 migration tasks [P]
- 4 contract test tasks [P]
- 8 implementation tasks (sequential by dependency)
- 4 integration test tasks
- 3 UI component tasks [P]
- 2 validation tasks
**Total**: ~26 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, verify SLOs:
  - Checkout initiation <500ms
  - Webhook processing <2s
  - Credit allocation <1s
  - Constitutional compliance: value-first monetization, transparent pricing)

## Complexity Tracking
*No constitutional violations detected - this section intentionally left empty*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Progress Tracking

- [x] Load feature spec from Input path
- [x] Fill Technical Context (web project, Next.js App Router)
- [x] Constitution Check - Initial (0 violations)
- [x] Phase 0: Research complete (no unknowns remaining)
- [x] Phase 1: Data model designed (5 entities)
- [x] Phase 1: API contracts generated (4 endpoints)
- [x] Phase 1: Contract tests outlined (4 test files)
- [x] Phase 1: Integration scenarios extracted (4 flows)
- [x] Phase 1: Quickstart scenarios defined
- [x] Phase 1: Agent context update ready
- [x] Constitution Check - Post-Design (0 violations)
- [x] Phase 2: Task planning approach documented
- [x] Ready for /tasks command

**Status**: ✅ Planning complete - Ready for `/tasks` command to generate tasks.md
