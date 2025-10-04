# Quickstart: Payment Processing Test Scenarios

**Feature**: Payment Processing with Stripe
**Purpose**: Verify end-to-end payment flows and credit management

## Prerequisites

```bash
# 1. Environment variables set
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CREDITS_PRICE_ID=price_...

# 2. Database migrations applied
npm run db:push

# 3. Development server running
npm run dev

# 4. Stripe CLI installed for webhook testing
brew install stripe/stripe-cli/stripe
stripe login
```

## Test Scenario 1: Credit Purchase Flow (Happy Path)

**Goal**: User purchases 10 credits via Stripe Checkout

```bash
# 1. Create test user and get auth token
USER_ID=$(curl -X POST http://localhost:3000/api/test/create-user | jq -r '.user_id')
AUTH_TOKEN=$(curl -X POST http://localhost:3000/api/test/login -d "{\"user_id\":\"$USER_ID\"}" | jq -r '.token')

# 2. Check initial credit balance (should be 0)
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 0, "total_credits_purchased": 0 }

# 3. Create checkout session
CHECKOUT_URL=$(curl -X POST \
  -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/create-checkout-session | jq -r '.url')

echo "Open this URL to complete payment: $CHECKOUT_URL"

# 4. Use Stripe CLI to trigger test webhook (simulates successful payment)
stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$USER_ID

# 5. Verify credits added
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 10, "total_credits_purchased": 10, "batches": [{"expiration_date": "2026-10-03", "credits_remaining": 10}] }

# 6. Verify transaction history
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/transactions
# Expected: [{ "amount": 999, "currency": "usd", "credits": 10, "status": "completed" }]
```

**Success Criteria**:
- ✅ Checkout session created (URL returned)
- ✅ Webhook processed (credits added)
- ✅ Balance shows 10 credits
- ✅ Expiration date is 1 year from now
- ✅ Transaction recorded with status='completed'

## Test Scenario 2: Refund Handling (Negative Balance)

**Goal**: User requests refund after spending credits, balance goes negative

```bash
# 1. User from Scenario 1 spends 5 credits
curl -X POST -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/restore \
  -F "file=@test-photo.jpg" \
  -F "fingerprint=$USER_ID"
# Repeat 5 times or use batch endpoint

# 2. Verify balance decreased
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 5 }

# 3. Trigger refund webhook
TRANSACTION_ID=$(curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/transactions | jq -r '.[0].id')

stripe trigger charge.refunded \
  --override charge:payment_intent=$TRANSACTION_ID

# 4. Verify negative balance
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": -5 }

# 5. Attempt to restore with negative balance
curl -X POST -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/restore \
  -F "file=@test-photo.jpg" \
  -F "fingerprint=$USER_ID"
# Expected: 403 Forbidden { "error": "Negative balance. Purchase credits to restore.", "error_code": "NEGATIVE_BALANCE" }
```

**Success Criteria**:
- ✅ Refund processed (webhook handled)
- ✅ Balance shows -5 credits
- ✅ Restoration blocked with clear error
- ✅ Refund record created in database
- ✅ Transaction status updated to 'refunded'

## Test Scenario 3: Credit Expiration

**Goal**: Credits expire after 1 year, user receives warning at 30 days

```bash
# 1. Create credit batch expiring in 30 days (backdated purchase)
BATCH_ID=$(psql $DATABASE_URL -c \
  "INSERT INTO credit_batches (user_id, purchase_date, expiration_date, credits_purchased, credits_remaining) \
   VALUES ('$USER_ID', NOW() - INTERVAL '335 days', NOW() + INTERVAL '30 days', 10, 10) \
   RETURNING id" | tail -2 | head -1 | tr -d ' ')

# 2. Run expiration warning job
curl -X POST http://localhost:3000/api/cron/credit-expiration-warning
# Expected: Email sent to user with subject "Your credits expire in 30 days"

# 3. Manually expire batch (simulate 30 days passing)
psql $DATABASE_URL -c \
  "UPDATE credit_batches SET expiration_date = NOW() - INTERVAL '1 day' WHERE id = '$BATCH_ID'"

# 4. Run expiration job
curl -X POST http://localhost:3000/api/cron/expire-credits
# Expected: { "batches_expired": 1, "total_credits_expired": 10 }

# 5. Verify credits removed from balance
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 0, "credits_expired": 10 }
```

**Success Criteria**:
- ✅ Warning sent 30 days before expiration
- ✅ Credits removed on expiration date
- ✅ Balance updated correctly
- ✅ Expired credits tracked in user_quota.credits_expired

## Test Scenario 4: Webhook Idempotency

**Goal**: Duplicate webhook doesn't add credits twice

```bash
# 1. Create checkout session and capture event ID
CHECKOUT_URL=$(curl -X POST \
  -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/create-checkout-session | jq -r '.url')

# 2. Trigger webhook first time
stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$USER_ID \
  --override event:id=evt_test_idempotency_001

# 3. Check balance (should be 10)
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 10 }

# 4. Trigger same webhook again (duplicate event ID)
stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$USER_ID \
  --override event:id=evt_test_idempotency_001

# 5. Check balance (should still be 10, not 20)
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 10 }

# 6. Verify duplicate logged
psql $DATABASE_URL -c \
  "SELECT event_id, processing_status FROM stripe_webhook_events WHERE event_id = 'evt_test_idempotency_001'"
# Expected: 1 row with processing_status='success'
```

**Success Criteria**:
- ✅ First webhook adds 10 credits
- ✅ Duplicate webhook returns { received: true, duplicate: true }
- ✅ Balance unchanged (still 10 credits)
- ✅ Event logged once in stripe_webhook_events

## Test Scenario 5: Multi-Currency Purchase

**Goal**: User purchases in EUR, credits still added correctly

```bash
# 1. Create checkout session with EUR
CHECKOUT_URL=$(curl -X POST \
  -H "Cookie: auth-token=$AUTH_TOKEN" \
  -H "Accept-Language: de-DE" \
  http://localhost:3000/api/create-checkout-session | jq -r '.url')

# 2. Trigger webhook with EUR amount (€8.99 = 899 cents)
stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$USER_ID \
  --override checkout_session:amount_total=899 \
  --override checkout_session:currency=eur

# 3. Verify credits added (10 credits regardless of currency)
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Expected: { "available_credits": 10 }

# 4. Verify transaction shows EUR
curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/transactions
# Expected: [{ "amount": 899, "currency": "eur", "credits": 10 }]
```

**Success Criteria**:
- ✅ Checkout session supports EUR
- ✅ 10 credits added regardless of currency
- ✅ Transaction records actual currency and amount
- ✅ User sees localized pricing in Stripe Checkout

## Performance Verification

```bash
# 1. Checkout session creation latency
time curl -X POST -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/create-checkout-session
# Target: <500ms

# 2. Webhook processing latency
time stripe trigger checkout.session.completed \
  --override checkout_session:client_reference_id=$USER_ID
# Target: <2s

# 3. Credit balance query latency
time curl -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/credits/balance
# Target: <100ms
```

## Cleanup

```bash
# Delete test user and all related data
curl -X DELETE -H "Cookie: auth-token=$AUTH_TOKEN" \
  http://localhost:3000/api/test/delete-user

# Verify cleanup
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_quota WHERE user_id = '$USER_ID'"
# Expected: 0
```

## Running All Scenarios

```bash
# Automated test suite
npm run test:payment-flows

# Expected output:
# ✓ Test Scenario 1: Credit Purchase Flow (5s)
# ✓ Test Scenario 2: Refund Handling (3s)
# ✓ Test Scenario 3: Credit Expiration (2s)
# ✓ Test Scenario 4: Webhook Idempotency (2s)
# ✓ Test Scenario 5: Multi-Currency Purchase (3s)
# All tests passed (15s total)
```

## Troubleshooting

**Webhook not received**:
```bash
# Check Stripe CLI forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Verify webhook secret matches
echo $STRIPE_WEBHOOK_SECRET
```

**Credits not added**:
```bash
# Check webhook processing status
psql $DATABASE_URL -c "SELECT * FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 5"

# Check error logs
tail -f .next/trace
```

**Balance mismatch**:
```bash
# Verify batch tracking
psql $DATABASE_URL -c "SELECT * FROM credit_batches WHERE user_id = '$USER_ID'"

# Recalculate balance
psql $DATABASE_URL -c "SELECT SUM(credits_remaining) FROM credit_batches WHERE user_id = '$USER_ID'"
```

## Next Steps

After all quickstart scenarios pass:
1. Run full integration test suite: `npm run test:e2e:payments`
2. Deploy to staging and test with real Stripe account
3. Verify constitutional compliance (Principle VII: Tasteful Monetization)
4. Performance testing: 100 concurrent checkout sessions
5. Security audit: Webhook signature verification, RLS policies
