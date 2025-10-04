# Implementation Tasks: Payment Processing with Stripe

**Feature Branch**: `002-implement-payment-processing`
**Total Tasks**: 28
**Estimated Duration**: 3-4 days
**Parallel Execution**: 12 tasks can run in parallel (marked with [P])

## Task Categories

- **Setup & Configuration** (2 tasks) - Foundation
- **Database Migrations** (5 tasks [P]) - Data layer
- **Contract Tests** (2 tasks [P]) - TDD verification
- **Core Implementation** (9 tasks) - Business logic
- **Integration Tests** (4 tasks) - End-to-end flows
- **UI Components** (3 tasks [P]) - User interface
- **Cron Jobs** (2 tasks [P]) - Background processing
- **Validation & Performance** (1 task) - Final verification

## Execution Order

```
Phase 1: Setup (T001-T002)
  ↓
Phase 2: Database [P] (T003-T007)
  ↓
Phase 3: Contract Tests [P] (T008-T009)
  ↓
Phase 4: Core Implementation (T010-T018)
  ↓
Phase 5: Integration Tests (T019-T022)
  ↓
Phase 6: UI + Cron [P] (T023-T027)
  ↓
Phase 7: Validation (T028)
```

---

## Phase 1: Setup & Configuration

### T001: Install Stripe Dependencies
**Type**: Setup
**Parallel**: No
**Files**: `package.json`

**Description**:
Install Stripe SDK for server-side and client-side payment processing.

**Steps**:
1. Install dependencies:
   ```bash
   npm install stripe @stripe/stripe-js
   npm install -D @types/stripe
   ```
2. Verify versions:
   - `stripe`: ^14.0.0 or later
   - `@stripe/stripe-js`: ^2.0.0 or later
3. Update `package.json` scripts if needed

**Acceptance Criteria**:
- ✅ Stripe packages installed
- ✅ TypeScript types available
- ✅ `npm run typecheck` passes

---

### T002: Configure Stripe Environment Variables
**Type**: Setup
**Parallel**: No
**Files**: `.env.local`, `.env.example`, `lib/payments/stripe-client.ts`

**Description**:
Set up Stripe API keys and webhook secret for local development and production.

**Steps**:
1. Create `.env.local` with:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_CREDITS_PRICE_ID=price_...
   ```
2. Update `.env.example` with placeholder keys
3. Create `lib/payments/stripe-client.ts`:
   ```typescript
   import Stripe from 'stripe'

   const stripeSecretKey = process.env.STRIPE_SECRET_KEY
   if (!stripeSecretKey) {
     throw new Error('STRIPE_SECRET_KEY is not set')
   }

   export const stripe = new Stripe(stripeSecretKey, {
     apiVersion: '2024-10-28.acacia',
   })
   ```

**Acceptance Criteria**:
- ✅ Environment variables configured
- ✅ Stripe client initialized
- ✅ `.env.example` updated with all Stripe vars
- ✅ Server starts without errors

---

## Phase 2: Database Migrations (All tasks can run in parallel after dependencies installed)

### T003: [P] Create payment_transactions Table Migration
**Type**: Database Migration
**Parallel**: Yes
**Files**: `lib/supabase/migrations/011_payment_transactions.sql`

**Description**:
Create payment_transactions table to store all payment events.

**Steps**:
1. Create migration file with SQL from data-model.md:
   ```sql
   CREATE TABLE payment_transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     stripe_session_id TEXT NOT NULL UNIQUE,
     stripe_payment_intent_id TEXT,
     stripe_customer_id TEXT,
     amount INTEGER NOT NULL CHECK (amount > 0),
     currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
     credits_purchased INTEGER NOT NULL CHECK (credits_purchased = 10),
     status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE INDEX idx_transactions_user_id ON payment_transactions(user_id);
   CREATE INDEX idx_transactions_session_id ON payment_transactions(stripe_session_id);
   CREATE INDEX idx_transactions_status ON payment_transactions(status);
   CREATE INDEX idx_transactions_created ON payment_transactions(created_at DESC);
   ```
2. Add RLS policies from data-model.md
3. Run migration: `npm run db:push`

**Acceptance Criteria**:
- ✅ Table created with all fields and constraints
- ✅ Indexes created
- ✅ RLS policies applied
- ✅ Migration runs without errors

---

### T004: [P] Create credit_batches Table Migration
**Type**: Database Migration
**Parallel**: Yes
**Files**: `lib/supabase/migrations/012_credit_batches.sql`

**Description**:
Create credit_batches table for FIFO credit expiration tracking.

**Steps**:
1. Create migration file with full schema from data-model.md (lines 89-107)
2. Add indexes for user_id and expiration_date
3. Add RLS policies
4. Run migration: `npm run db:push`

**Acceptance Criteria**:
- ✅ Table created with 1-year expiration constraint
- ✅ Indexes created for performance
- ✅ RLS policies applied
- ✅ Foreign key to payment_transactions works

---

### T005: [P] Create stripe_webhook_events Table Migration
**Type**: Database Migration
**Parallel**: Yes
**Files**: `lib/supabase/migrations/013_stripe_webhook_events.sql`

**Description**:
Create stripe_webhook_events table for webhook idempotency and audit trail.

**Steps**:
1. Create migration file with schema from data-model.md
2. Ensure event_id is UNIQUE for idempotency
3. Add indexes for event_id, event_type, processing_status
4. Add RLS policy (service role only)
5. Run migration: `npm run db:push`

**Acceptance Criteria**:
- ✅ Table created with unique event_id constraint
- ✅ Indexes created
- ✅ RLS policy restricts to service role
- ✅ Idempotency check query works

---

### T006: [P] Create payment_refunds Table Migration
**Type**: Database Migration
**Parallel**: Yes
**Files**: `lib/supabase/migrations/014_payment_refunds.sql`

**Description**:
Create payment_refunds table to track refund events.

**Steps**:
1. Create migration file with schema from data-model.md
2. Add foreign key constraint to payment_transactions
3. Add validation: amount_refunded <= original transaction amount
4. Add indexes
5. Add RLS policies
6. Run migration: `npm run db:push`

**Acceptance Criteria**:
- ✅ Table created with refund tracking fields
- ✅ Foreign key to transactions works
- ✅ Amount validation constraint works
- ✅ RLS policies applied

---

### T007: [P] Extend user_quota Table Migration
**Type**: Database Migration
**Parallel**: Yes
**Files**: `lib/supabase/migrations/015_extend_user_quota.sql`

**Description**:
Extend existing user_quota table to support negative balances and additional tracking.

**Steps**:
1. Create migration file with ALTER TABLE statements from data-model.md (lines 35-46)
2. Add new columns: total_credits_purchased, credits_expired, last_purchase_date
3. Remove NOT NULL constraint from available_credits
4. Add check constraint: available_credits >= -1000
5. Add column comment for negative balance support
6. Run migration: `npm run db:push`

**Acceptance Criteria**:
- ✅ New columns added
- ✅ NOT NULL constraint removed from available_credits
- ✅ Negative balance allowed (down to -1000)
- ✅ Existing data preserved

---

## Phase 3: Contract Tests (TDD - Tests written before implementation)

### T008: [P] Create Checkout Session Contract Test
**Type**: Contract Test
**Parallel**: Yes
**Files**: `tests/contract/create-checkout-session.test.ts`

**Description**:
Write contract test for POST /api/create-checkout-session endpoint.

**Steps**:
1. Create test file based on contract: `specs/002-implement-payment-processing/contracts/create-checkout-session.json`
2. Test cases:
   - Authenticated user receives checkout URL (200)
   - Unauthenticated request rejected (401)
   - Stripe unavailable returns 503
3. Assert response schema matches contract:
   - `sessionId` matches pattern `^cs_`
   - `url` starts with `https://checkout.stripe.com`
4. Run test (should FAIL): `npm test tests/contract/create-checkout-session.test.ts`

**Acceptance Criteria**:
- ✅ Test file created with all 3 test cases
- ✅ Schema validation implemented
- ✅ Tests FAIL (no implementation yet)

---

### T009: [P] Create Stripe Webhook Contract Test
**Type**: Contract Test
**Parallel**: Yes
**Files**: `tests/contract/stripe-webhook.test.ts`

**Description**:
Write contract test for POST /api/webhooks/stripe endpoint.

**Steps**:
1. Create test file based on contract: `specs/002-implement-payment-processing/contracts/stripe-webhook.json`
2. Test cases:
   - Valid webhook signature accepted (200)
   - Invalid signature rejected (400)
   - Duplicate event returns duplicate=true (200)
   - Missing signature rejected (400)
3. Mock Stripe signature verification
4. Run test (should FAIL): `npm test tests/contract/stripe-webhook.test.ts`

**Acceptance Criteria**:
- ✅ Test file created with all 4 test cases
- ✅ Signature verification mocked
- ✅ Idempotency check tested
- ✅ Tests FAIL (no implementation yet)

---

## Phase 4: Core Implementation (Sequential - same files/dependencies)

### T010: Create Database Functions
**Type**: Core Implementation
**Parallel**: No (single migration file)
**Files**: `lib/supabase/migrations/016_payment_functions.sql`

**Description**:
Create database functions for credit management: add_credits, deduct_credit, process_refund, expire_credits.

**Steps**:
1. Create migration file with all 4 functions from data-model.md (lines 200-350)
2. Implement `add_credits(p_user_id, p_credits_to_add, p_transaction_id)`
3. Implement `deduct_credit(p_user_id)` with FIFO logic
4. Implement `process_refund(p_transaction_id, p_stripe_refund_id, p_amount_refunded, p_currency)`
5. Implement `expire_credits()` for batch expiration
6. Run migration: `npm run db:push`
7. Test each function with psql

**Acceptance Criteria**:
- ✅ All 4 functions created
- ✅ FIFO credit deduction works
- ✅ Negative balance supported in process_refund
- ✅ Batch expiration updates balances correctly

---

### T011: Implement Stripe Checkout Session Creation
**Type**: Core Implementation
**Parallel**: No
**Files**: `app/api/create-checkout-session/route.ts`

**Description**:
Create API endpoint to generate Stripe Checkout sessions for credit purchase.

**Steps**:
1. Create `app/api/create-checkout-session/route.ts`
2. Implement POST handler:
   - Get user from Supabase auth
   - Return 401 if not authenticated
   - Create Stripe checkout session with:
     - `line_items`: [{ price: STRIPE_CREDITS_PRICE_ID, quantity: 1 }]
     - `mode`: 'payment'
     - `client_reference_id`: user.id
     - `customer_email`: user.email
     - `success_url`: `${origin}/app?success=true`
     - `cancel_url`: `${origin}/app?canceled=true`
     - `automatic_tax`: { enabled: true }
3. Return `{ sessionId: session.id, url: session.url }`
4. Handle errors (503 if Stripe unavailable)
5. Run contract test: should now PASS

**Acceptance Criteria**:
- ✅ Endpoint created at `/api/create-checkout-session`
- ✅ Auth check works (401 if unauthorized)
- ✅ Stripe session created with correct params
- ✅ Contract test T008 now PASSES

---

### T012: Implement Webhook Event Logging
**Type**: Core Implementation
**Parallel**: No
**Files**: `lib/payments/webhook-logger.ts`

**Description**:
Create utility to log webhook events for audit and idempotency.

**Steps**:
1. Create `lib/payments/webhook-logger.ts`
2. Implement `logWebhookEvent(event, status)`:
   - Check if event.id exists in stripe_webhook_events
   - If exists, return { duplicate: true }
   - If not, insert event with processing_status='pending'
3. Implement `updateWebhookStatus(eventId, status, errorMessage?)`
4. Use Supabase service role client (bypasses RLS)

**Acceptance Criteria**:
- ✅ Event logging function created
- ✅ Idempotency check works (duplicate detection)
- ✅ Status update function works
- ✅ Service role client used

---

### T013: Implement Webhook Signature Verification
**Type**: Core Implementation
**Parallel**: No
**Files**: `lib/payments/webhook-verification.ts`

**Description**:
Create utility to verify Stripe webhook signatures for security.

**Steps**:
1. Create `lib/payments/webhook-verification.ts`
2. Implement `verifyWebhookSignature(body, signature, secret)`:
   ```typescript
   import { stripe } from './stripe-client'

   export function verifyWebhookSignature(
     body: string,
     signature: string,
     secret: string
   ): Stripe.Event {
     try {
       return stripe.webhooks.constructEvent(body, signature, secret)
     } catch (err) {
       throw new Error('Webhook signature verification failed')
     }
   }
   ```
3. Handle missing signature header
4. Return verified event

**Acceptance Criteria**:
- ✅ Signature verification function created
- ✅ Uses Stripe SDK's constructEvent
- ✅ Throws error on invalid signature
- ✅ Returns typed Stripe.Event

---

### T014: Implement Checkout Session Completed Handler
**Type**: Core Implementation
**Parallel**: No
**Files**: `lib/payments/webhook-handlers.ts`

**Description**:
Create webhook handler for checkout.session.completed event to add credits.

**Steps**:
1. Create `lib/payments/webhook-handlers.ts`
2. Implement `handleCheckoutCompleted(session)`:
   - Extract `client_reference_id` (user_id)
   - Extract `customer` (Stripe customer ID)
   - Extract `amount_total` and `currency`
   - Create payment_transactions record with status='pending'
   - Call database function `add_credits(user_id, 10, transaction_id)`
   - Update transaction status='completed'
   - Create credit_batches record
3. Handle errors with try/catch
4. Return success response

**Acceptance Criteria**:
- ✅ Handler extracts session data
- ✅ Transaction record created
- ✅ Credits added via database function
- ✅ Batch created with 1-year expiration
- ✅ Error handling implemented

---

### T015: Implement Refund Handler
**Type**: Core Implementation
**Parallel**: No
**Files**: `lib/payments/webhook-handlers.ts` (extend)

**Description**:
Add webhook handler for charge.refunded event to deduct credits.

**Steps**:
1. Extend `lib/payments/webhook-handlers.ts`
2. Implement `handleChargeRefunded(refund)`:
   - Extract `payment_intent` to find transaction
   - Find transaction by `stripe_payment_intent_id`
   - Call `process_refund(transaction_id, refund.id, amount, currency)`
   - Credits deducted (balance can go negative)
   - Transaction status updated to 'refunded'
3. Handle case where user already spent credits
4. Return success response

**Acceptance Criteria**:
- ✅ Refund handler extracts refund data
- ✅ Transaction found by payment_intent_id
- ✅ process_refund function called
- ✅ Negative balance allowed
- ✅ Refund record created

---

### T016: Implement Stripe Webhook Endpoint
**Type**: Core Implementation
**Parallel**: No
**Files**: `app/api/webhooks/stripe/route.ts`

**Description**:
Create webhook endpoint to receive and process Stripe events.

**Steps**:
1. Create `app/api/webhooks/stripe/route.ts`
2. Implement POST handler:
   - Get raw body and signature from request
   - Verify signature using `verifyWebhookSignature`
   - Log event using `logWebhookEvent` (idempotency check)
   - If duplicate, return `{ received: true, duplicate: true }`
   - Route event to correct handler:
     - `checkout.session.completed` → handleCheckoutCompleted
     - `charge.refunded` → handleChargeRefunded
   - Update webhook status to 'success'
   - Return `{ received: true }`
3. Handle errors (400 for invalid signature, 500 for processing failure)
4. Run contract test: should now PASS

**Acceptance Criteria**:
- ✅ Webhook endpoint created
- ✅ Signature verification works (400 if invalid)
- ✅ Idempotency check works (duplicate detection)
- ✅ Events routed to correct handlers
- ✅ Contract test T009 now PASSES

---

### T017: Implement Credit Manager Service
**Type**: Core Implementation
**Parallel**: No
**Files**: `lib/credits/credit-manager.ts`

**Description**:
Create service to manage credit allocation, deduction, and balance queries.

**Steps**:
1. Create `lib/credits/credit-manager.ts`
2. Implement `getCreditBalance(userId)`:
   - Query user_quota for available_credits
   - Query credit_batches for expiration dates
   - Return balance + batch details
3. Implement `deductCredit(userId)`:
   - Call database function `deduct_credit(user_id)`
   - Return updated balance
4. Implement `canUseCredits(userId)`:
   - Check if available_credits > 0
   - Return boolean

**Acceptance Criteria**:
- ✅ Balance query works
- ✅ Credit deduction calls database function
- ✅ Negative balance check works
- ✅ Batch expiration dates returned

---

### T018: Implement Credit Balance API Endpoint
**Type**: Core Implementation
**Parallel**: No
**Files**: `app/api/credits/balance/route.ts`

**Description**:
Create API endpoint to get user's current credit balance and expiration details.

**Steps**:
1. Create `app/api/credits/balance/route.ts`
2. Implement GET handler:
   - Get user from auth
   - Return 401 if not authenticated
   - Call `getCreditBalance(user.id)`
   - Return `{ total_credits, available_credits, batches: [{ expiration_date, credits_remaining }] }`
3. Handle errors

**Acceptance Criteria**:
- ✅ Endpoint created at `/api/credits/balance`
- ✅ Auth check works
- ✅ Balance returned with batch details
- ✅ Performance <100ms

---

## Phase 5: Integration Tests (Sequential - test complete flows)

### T019: Credit Purchase Flow Integration Test
**Type**: Integration Test
**Parallel**: No (depends on all previous implementation)
**Files**: `tests/integration/credit-purchase-flow.test.ts`

**Description**:
Test complete credit purchase flow from checkout to credit allocation.

**Steps**:
1. Create integration test file
2. Test scenario from quickstart.md (Scenario 1):
   - Create test user
   - Create checkout session
   - Simulate successful webhook (checkout.session.completed)
   - Verify credits added (available_credits = 10)
   - Verify transaction recorded
   - Verify batch created with 1-year expiration
3. Run test: `npm run test:integration`

**Acceptance Criteria**:
- ✅ End-to-end flow works
- ✅ Credits added correctly
- ✅ Transaction and batch recorded
- ✅ Test passes

---

### T020: Refund Handling Integration Test
**Type**: Integration Test
**Parallel**: No
**Files**: `tests/integration/refund-handling.test.ts`

**Description**:
Test refund flow including negative balance scenario.

**Steps**:
1. Create integration test file
2. Test scenario from quickstart.md (Scenario 2):
   - User purchases 10 credits
   - User spends 5 credits
   - Refund issued (balance goes to -5)
   - Verify balance is negative
   - Verify restoration blocked (canUseCredits returns false)
3. Run test: `npm run test:integration`

**Acceptance Criteria**:
- ✅ Refund deducts credits
- ✅ Balance can be negative
- ✅ Usage blocked with negative balance
- ✅ Test passes

---

### T021: Credit Expiration Integration Test
**Type**: Integration Test
**Parallel**: No
**Files**: `tests/integration/credit-expiration.test.ts`

**Description**:
Test credit expiration flow with 30-day warning.

**Steps**:
1. Create integration test file
2. Test scenario from quickstart.md (Scenario 3):
   - Create batch expiring in 30 days (backdated)
   - Run expiration warning job
   - Verify warning sent
   - Update batch to expired
   - Run expiration job
   - Verify credits removed from balance
3. Run test: `npm run test:integration`

**Acceptance Criteria**:
- ✅ Warning triggered at 30 days
- ✅ Credits expired correctly
- ✅ Balance updated
- ✅ Test passes

---

### T022: Webhook Idempotency Integration Test
**Type**: Integration Test
**Parallel**: No
**Files**: `tests/integration/webhook-idempotency.test.ts`

**Description**:
Test webhook idempotency prevents duplicate credit allocation.

**Steps**:
1. Create integration test file
2. Test scenario from quickstart.md (Scenario 4):
   - Send checkout.session.completed webhook
   - Verify credits added (balance = 10)
   - Send SAME webhook again (same event.id)
   - Verify duplicate detected
   - Verify balance still 10 (NOT 20)
3. Run test: `npm run test:integration`

**Acceptance Criteria**:
- ✅ First webhook adds credits
- ✅ Duplicate webhook detected
- ✅ Credits NOT added twice
- ✅ Test passes

---

## Phase 6: UI Components & Background Jobs (All parallel)

### T023: [P] Create Purchase Button Component
**Type**: UI Component
**Parallel**: Yes
**Files**: `components/payments/purchase-button.tsx`

**Description**:
Create "Buy 10 Credits" button component that initiates checkout.

**Steps**:
1. Create component in `components/payments/purchase-button.tsx`
2. Implement button:
   - onClick: call `/api/create-checkout-session`
   - Redirect to `session.url`
   - Show loading state during API call
   - Handle errors (show toast/alert)
3. Style with Tailwind + shadcn/ui Button
4. Add to pricing page

**Acceptance Criteria**:
- ✅ Button component created
- ✅ Calls checkout API on click
- ✅ Redirects to Stripe Checkout
- ✅ Error handling implemented
- ✅ Styled according to design system

---

### T024: [P] Create Pricing Card Component
**Type**: UI Component
**Parallel**: Yes
**Files**: `components/payments/pricing-card.tsx`

**Description**:
Create pricing card to display credit pack details.

**Steps**:
1. Create component in `components/payments/pricing-card.tsx`
2. Display:
   - "10 Credits" heading
   - "$9.99" price (note: + tax)
   - "1 credit = 1 photo restoration" description
   - List of benefits (from spec.md)
   - Purchase button
3. Style according to constitutional Principle VII (tasteful monetization)
4. Add to landing page pricing section

**Acceptance Criteria**:
- ✅ Card displays price and benefits
- ✅ Transparent pricing (shows "+ tax")
- ✅ Purchase button integrated
- ✅ Constitutional compliance (Principle VII)

---

### T025: [P] Create Transaction History Component
**Type**: UI Component
**Parallel**: Yes
**Files**: `components/payments/transaction-history.tsx`, `app/api/transactions/route.ts`

**Description**:
Create transaction history table for user's purchase records.

**Steps**:
1. Create API endpoint `app/api/transactions/route.ts`:
   - GET handler
   - Query payment_transactions for user
   - Return list with date, amount, currency, credits, status
2. Create component `components/payments/transaction-history.tsx`:
   - Fetch from `/api/transactions`
   - Display table with columns: Date, Amount, Currency, Credits, Status
   - Format dates and amounts
   - Show refund status
3. Add to account/dashboard page

**Acceptance Criteria**:
- ✅ API endpoint returns user transactions
- ✅ Component displays transaction history
- ✅ Refunds clearly marked
- ✅ Data formatted correctly

---

### T026: [P] Create Credit Expiration Warning Cron Job
**Type**: Cron Job
**Parallel**: Yes
**Files**: `app/api/cron/credit-expiration-warning/route.ts`

**Description**:
Create cron job to send 30-day expiration warnings.

**Steps**:
1. Create endpoint `app/api/cron/credit-expiration-warning/route.ts`
2. Implement POST handler:
   - Query credit_batches expiring in 30 days:
     ```sql
     SELECT user_id, credits_remaining, expiration_date
     FROM credit_batches
     WHERE expiration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
       AND credits_remaining > 0
     ```
   - For each batch, send email notification to user
   - Log sent notifications
3. Add Vercel cron config to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/credit-expiration-warning",
       "schedule": "0 0 * * *"
     }]
   }
   ```
4. Test manually: `curl -X POST http://localhost:3000/api/cron/credit-expiration-warning`

**Acceptance Criteria**:
- ✅ Cron endpoint created
- ✅ Queries batches expiring in 30 days
- ✅ Email notifications sent
- ✅ Vercel cron configured

---

### T027: [P] Create Credit Expiration Cron Job
**Type**: Cron Job
**Parallel**: Yes
**Files**: `app/api/cron/expire-credits/route.ts`

**Description**:
Create cron job to expire credits after 1 year.

**Steps**:
1. Create endpoint `app/api/cron/expire-credits/route.ts`
2. Implement POST handler:
   - Call database function `expire_credits()`
   - Returns `{ batches_expired, total_credits_expired }`
   - Log results
3. Add Vercel cron config:
   ```json
   {
     "crons": [{
       "path": "/api/cron/expire-credits",
       "schedule": "0 1 * * *"
     }]
   }
   ```
4. Test manually: `curl -X POST http://localhost:3000/api/cron/expire-credits`

**Acceptance Criteria**:
- ✅ Cron endpoint created
- ✅ Calls expire_credits() function
- ✅ Returns expiration stats
- ✅ Vercel cron configured (runs at 1 AM daily)

---

## Phase 7: Validation & Performance

### T028: Run Quickstart Test Suite & Performance Validation
**Type**: Validation
**Parallel**: No
**Files**: All

**Description**:
Execute all quickstart scenarios and verify performance targets.

**Steps**:
1. Run quickstart.md scenarios 1-5:
   - Credit purchase flow
   - Refund handling
   - Credit expiration
   - Webhook idempotency
   - Multi-currency purchase
2. Verify performance targets:
   - Checkout creation: <500ms
   - Webhook processing: <2s
   - Credit balance query: <100ms
3. Run full test suite: `npm test && npm run test:e2e:payments`
4. Verify constitutional compliance:
   - Principle VII: Tasteful monetization ✓
   - Principle VIII: Quality bars met ✓
   - Principle VI: Privacy & security ✓
5. Generate performance report

**Acceptance Criteria**:
- ✅ All quickstart scenarios pass
- ✅ Performance targets met
- ✅ All tests pass (unit + integration + E2E)
- ✅ Constitutional compliance verified
- ✅ No TypeScript errors: `npm run typecheck`

---

## Parallel Execution Examples

### Group 1: Database Migrations (After T001-T002)
```bash
# Run all migrations in parallel (same result as sequential)
npm run db:push
# Migrations T003-T007 apply together
```

### Group 2: Contract Tests (After T003-T007)
```bash
# Run contract tests in parallel
npm test tests/contract/create-checkout-session.test.ts &
npm test tests/contract/stripe-webhook.test.ts &
wait
```

### Group 3: UI Components (After T010-T022)
```bash
# Implement UI components in parallel (different files)
# T023: components/payments/purchase-button.tsx
# T024: components/payments/pricing-card.tsx
# T025: components/payments/transaction-history.tsx

# All can be developed simultaneously by different developers/agents
```

### Group 4: Cron Jobs (After T010-T022)
```bash
# Implement cron jobs in parallel (different files)
# T026: app/api/cron/credit-expiration-warning/route.ts
# T027: app/api/cron/expire-credits/route.ts
```

## Task Dependencies Graph

```
T001 (Stripe deps)
  ↓
T002 (Env config)
  ↓
T003,T004,T005,T006,T007 (DB migrations - all parallel)
  ↓
T008,T009 (Contract tests - parallel)
  ↓
T010 (DB functions)
  ↓
T011 (Checkout endpoint) ──→ T012 (Webhook logging)
  ↓                           ↓
T013 (Webhook verification) ──┘
  ↓
T014 (Checkout handler)
  ↓
T015 (Refund handler)
  ↓
T016 (Webhook endpoint)
  ↓
T017 (Credit manager)
  ↓
T018 (Balance API)
  ↓
T019,T020,T021,T022 (Integration tests - sequential)
  ↓
T023,T024,T025,T026,T027 (UI + Cron - all parallel)
  ↓
T028 (Validation)
```

## Progress Tracking

- [ ] Phase 1: Setup (T001-T002)
- [ ] Phase 2: Database (T003-T007)
- [ ] Phase 3: Contract Tests (T008-T009)
- [ ] Phase 4: Core Implementation (T010-T018)
- [ ] Phase 5: Integration Tests (T019-T022)
- [ ] Phase 6: UI & Cron (T023-T027)
- [ ] Phase 7: Validation (T028)

## Execution Commands

```bash
# Run all tests
npm test

# Run specific test category
npm test tests/contract/
npm test tests/integration/

# Run E2E tests
npm run test:e2e:payments

# Type check
npm run typecheck

# Database migrations
npm run db:push

# Performance testing
npm run performance:report

# Manual quickstart execution
./specs/002-implement-payment-processing/quickstart.md
```

## Notes

- All [P] tasks can run in parallel within their phase
- Contract tests should FAIL initially (TDD approach)
- Integration tests depend on ALL core implementation being complete
- UI components require API endpoints to exist
- Cron jobs should be tested manually before deploying
- Performance validation is the final gate before considering feature complete

**Ready to execute**: Start with T001
