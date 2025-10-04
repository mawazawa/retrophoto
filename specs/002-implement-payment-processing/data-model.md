# Data Model: Payment Processing

**Feature**: Payment Processing with Stripe
**Date**: 2025-10-03
**Database**: Supabase PostgreSQL

## Entity Relationship Diagram

```
auth.users (existing)
    ↓ 1:1
user_quota (extend existing)
    ↓ 1:N
credit_batches (new)

auth.users
    ↓ 1:N
payment_transactions (new)
    ↓ 1:N
payment_refunds (new)

payment_transactions
    ↓ 1:1
stripe_webhook_events (new)
```

## Entities

### 1. user_quota (Extend Existing Table)

**Purpose**: Track user credit balance with support for negative balances post-refund

**Schema**:
```sql
-- Extend existing table with new fields
ALTER TABLE user_quota
ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_expired INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Remove NOT NULL constraint to allow negative balance
ALTER TABLE user_quota
ALTER COLUMN available_credits DROP NOT NULL;

-- Add comment for negative balance support
COMMENT ON COLUMN user_quota.available_credits IS 'Can be negative after refund if credits were already spent';
```

**Fields**:
- `user_id` UUID PRIMARY KEY - References auth.users(id)
- `available_credits` INTEGER - Current usable credits (can be negative)
- `total_credits_purchased` INTEGER - Lifetime credits purchased
- `credits_used` INTEGER - Lifetime credits consumed
- `credits_expired` INTEGER - Lifetime credits expired
- `last_purchase_date` TIMESTAMP - Most recent purchase (for UI display)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Validation Rules**:
- `available_credits` >= -1000 (prevent extreme negative values from bugs)
- `total_credits_purchased` >= 0
- `credits_used` >= 0
- `credits_expired` >= 0

**State Transitions**:
- Purchase → `available_credits += 10`, `total_credits_purchased += 10`
- Use → `available_credits -= 1`, `credits_used += 1`
- Refund → `available_credits -= 10`
- Expire → `available_credits -= X`, `credits_expired += X`

**Row Level Security (RLS)**:
```sql
-- Users can only read their own quota
CREATE POLICY "Users can view own quota"
  ON user_quota FOR SELECT
  USING (auth.uid() = user_id);

-- Server can update quota (Service Role Key)
CREATE POLICY "Service can update quota"
  ON user_quota FOR UPDATE
  USING (auth.role() = 'service_role');
```

### 2. credit_batches (New Table)

**Purpose**: Track credit purchases by batch for FIFO expiration (1 year from purchase)

**Schema**:
```sql
CREATE TABLE credit_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased = 10),
  credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0 AND credits_remaining <= credits_purchased),
  transaction_id UUID REFERENCES payment_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Enforce 1-year expiration
  CONSTRAINT expiration_is_one_year CHECK (
    expiration_date = purchase_date + INTERVAL '365 days'
  )
);

CREATE INDEX idx_credit_batches_user_id ON credit_batches(user_id);
CREATE INDEX idx_credit_batches_expiration ON credit_batches(expiration_date) WHERE credits_remaining > 0;
```

**Fields**:
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL - FK to auth.users
- `purchase_date` TIMESTAMP NOT NULL - When credits were purchased
- `expiration_date` TIMESTAMP NOT NULL - Exactly 365 days after purchase
- `credits_purchased` INTEGER NOT NULL - Always 10 (per product)
- `credits_remaining` INTEGER NOT NULL - Decrements as credits are used (FIFO)
- `transaction_id` UUID - FK to payment_transactions
- `created_at` TIMESTAMP

**Lifecycle**:
1. Created on successful payment (webhook)
2. Decremented on credit usage (FIFO: oldest batch first)
3. Expired when `expiration_date` passed (cron job sets `credits_remaining = 0`)

**Query Patterns**:
```sql
-- Get expiring batches (30-day warning)
SELECT * FROM credit_batches
WHERE expiration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND credits_remaining > 0;

-- Get expired batches (cleanup)
SELECT * FROM credit_batches
WHERE expiration_date <= NOW()
  AND credits_remaining > 0;

-- Deduct credit (FIFO)
UPDATE credit_batches
SET credits_remaining = credits_remaining - 1
WHERE id = (
  SELECT id FROM credit_batches
  WHERE user_id = $1 AND credits_remaining > 0
  ORDER BY purchase_date ASC
  LIMIT 1
)
RETURNING *;
```

**RLS Policies**:
```sql
CREATE POLICY "Users can view own batches"
  ON credit_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage batches"
  ON credit_batches FOR ALL
  USING (auth.role() = 'service_role');
```

### 3. payment_transactions (New Table)

**Purpose**: Immutable record of all payment events for audit and reconciliation

**Schema**:
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
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

**Fields**:
- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL - FK to auth.users
- `stripe_session_id` TEXT UNIQUE - Stripe Checkout Session ID
- `stripe_payment_intent_id` TEXT - Stripe Payment Intent ID (from webhook)
- `stripe_customer_id` TEXT - Stripe Customer ID (for future subscriptions)
- `amount` INTEGER NOT NULL - Amount in cents (e.g., 999 = $9.99)
- `currency` TEXT NOT NULL - ISO 4217 currency code (usd, eur, gbp, etc.)
- `credits_purchased` INTEGER NOT NULL - Always 10 (validation)
- `status` TEXT NOT NULL - pending, completed, failed, refunded
- `metadata` JSONB - Additional Stripe metadata
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Immutability**:
- Once created, only `status` and `updated_at` can change
- All other fields are write-once

**State Machine**:
- Initial: `pending` (checkout session created)
- Success: `completed` (webhook `checkout.session.completed`)
- Failure: `failed` (webhook `payment_intent.payment_failed`)
- Refund: `refunded` (webhook `charge.refunded`)

**RLS Policies**:
```sql
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can create transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service can update transaction status"
  ON payment_transactions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (
    -- Only status and updated_at can change
    (NEW.id = OLD.id) AND
    (NEW.user_id = OLD.user_id) AND
    (NEW.stripe_session_id = OLD.stripe_session_id) AND
    (NEW.amount = OLD.amount) AND
    (NEW.currency = OLD.currency) AND
    (NEW.credits_purchased = OLD.credits_purchased)
  );
```

### 4. stripe_webhook_events (New Table)

**Purpose**: Audit log and idempotency protection for Stripe webhooks

**Schema**:
```sql
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event.id for idempotency
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'success', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count <= 3),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON stripe_webhook_events(event_id);
CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON stripe_webhook_events(processing_status);
CREATE INDEX idx_webhook_events_created ON stripe_webhook_events(created_at DESC);
```

**Fields**:
- `id` UUID PRIMARY KEY
- `event_id` TEXT UNIQUE - Stripe event ID (idempotency key)
- `event_type` TEXT - e.g., `checkout.session.completed`, `charge.refunded`
- `payload` JSONB - Full Stripe event payload
- `processed_at` TIMESTAMP - When processing completed
- `processing_status` TEXT - pending, success, failed
- `retry_count` INTEGER - Number of retry attempts (max 3)
- `error_message` TEXT - Failure reason if any
- `created_at` TIMESTAMP

**Idempotency Check**:
```sql
-- Before processing webhook
SELECT id FROM stripe_webhook_events WHERE event_id = $1;
-- If exists, skip processing (duplicate)

-- Insert new event
INSERT INTO stripe_webhook_events (event_id, event_type, payload, processing_status)
VALUES ($1, $2, $3, 'pending')
ON CONFLICT (event_id) DO NOTHING
RETURNING id;
```

**RLS Policies**:
```sql
-- Service role only (no user access)
CREATE POLICY "Service can manage webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role');
```

### 5. payment_refunds (New Table)

**Purpose**: Track refunds linked to original transactions

**Schema**:
```sql
CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  stripe_refund_id TEXT NOT NULL UNIQUE,
  amount_refunded INTEGER NOT NULL CHECK (amount_refunded > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  credits_deducted INTEGER NOT NULL CHECK (credits_deducted = 10),
  refund_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refunds_transaction_id ON payment_refunds(transaction_id);
CREATE INDEX idx_refunds_stripe_id ON payment_refunds(stripe_refund_id);
CREATE INDEX idx_refunds_date ON payment_refunds(refund_date DESC);
```

**Fields**:
- `id` UUID PRIMARY KEY
- `transaction_id` UUID NOT NULL - FK to payment_transactions
- `stripe_refund_id` TEXT UNIQUE - Stripe Refund ID
- `amount_refunded` INTEGER NOT NULL - Amount in cents
- `currency` TEXT NOT NULL - ISO 4217 currency code
- `credits_deducted` INTEGER NOT NULL - Always 10 (full refund policy)
- `refund_date` TIMESTAMP
- `reason` TEXT - Optional refund reason
- `metadata` JSONB - Additional Stripe metadata
- `created_at` TIMESTAMP

**Validation**:
```sql
-- Ensure refund amount <= original transaction amount
ALTER TABLE payment_refunds
ADD CONSTRAINT refund_amount_valid
CHECK (
  amount_refunded <= (
    SELECT amount FROM payment_transactions
    WHERE id = transaction_id
  )
);
```

**RLS Policies**:
```sql
CREATE POLICY "Users can view own refunds"
  ON payment_refunds FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM payment_transactions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can create refunds"
  ON payment_refunds FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

## Database Functions

### Function 1: add_credits

**Purpose**: Add credits after successful payment

```sql
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credits_to_add INTEGER,
  p_transaction_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_batch_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Update user quota
  UPDATE user_quota
  SET
    available_credits = available_credits + p_credits_to_add,
    total_credits_purchased = total_credits_purchased + p_credits_to_add,
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_credits INTO v_new_balance;

  -- Create credit batch (1-year expiration)
  INSERT INTO credit_batches (
    user_id,
    purchase_date,
    expiration_date,
    credits_purchased,
    credits_remaining,
    transaction_id
  ) VALUES (
    p_user_id,
    NOW(),
    NOW() + INTERVAL '365 days',
    p_credits_to_add,
    p_credits_to_add,
    p_transaction_id
  ) RETURNING id INTO v_batch_id;

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'batch_id', v_batch_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function 2: deduct_credit (FIFO)

**Purpose**: Deduct credit from oldest batch first

```sql
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_batch_id UUID;
  v_remaining INTEGER;
BEGIN
  -- Find oldest batch with credits
  SELECT id, credits_remaining INTO v_batch_id, v_remaining
  FROM credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
  ORDER BY purchase_date ASC
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION 'No credits available';
  END IF;

  -- Deduct from batch
  UPDATE credit_batches
  SET credits_remaining = credits_remaining - 1
  WHERE id = v_batch_id;

  -- Update user quota
  UPDATE user_quota
  SET
    available_credits = available_credits - 1,
    credits_used = credits_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'remaining_in_batch', v_remaining - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function 3: process_refund

**Purpose**: Handle refund by deducting credits (can go negative)

```sql
CREATE OR REPLACE FUNCTION process_refund(
  p_transaction_id UUID,
  p_stripe_refund_id TEXT,
  p_amount_refunded INTEGER,
  p_currency TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_credits_deducted INTEGER := 10;
  v_new_balance INTEGER;
BEGIN
  -- Get user ID from transaction
  SELECT user_id INTO v_user_id
  FROM payment_transactions
  WHERE id = p_transaction_id;

  -- Update transaction status
  UPDATE payment_transactions
  SET status = 'refunded', updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Deduct credits (can go negative)
  UPDATE user_quota
  SET
    available_credits = available_credits - v_credits_deducted,
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING available_credits INTO v_new_balance;

  -- Record refund
  INSERT INTO payment_refunds (
    transaction_id,
    stripe_refund_id,
    amount_refunded,
    currency,
    credits_deducted
  ) VALUES (
    p_transaction_id,
    p_stripe_refund_id,
    p_amount_refunded,
    p_currency,
    v_credits_deducted
  );

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'credits_deducted', v_credits_deducted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function 4: expire_credits

**Purpose**: Expire credits and update balances (cron job)

```sql
CREATE OR REPLACE FUNCTION expire_credits() RETURNS JSONB AS $$
DECLARE
  v_expired_count INTEGER;
  v_total_credits_expired INTEGER := 0;
BEGIN
  -- Expire batches
  WITH expired_batches AS (
    UPDATE credit_batches
    SET credits_remaining = 0
    WHERE expiration_date <= NOW()
      AND credits_remaining > 0
    RETURNING user_id, credits_remaining AS expired_credits
  )
  -- Update user quotas
  UPDATE user_quota uq
  SET
    available_credits = available_credits - eb.expired_credits,
    credits_expired = credits_expired + eb.expired_credits,
    updated_at = NOW()
  FROM expired_batches eb
  WHERE uq.user_id = eb.user_id;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  SELECT SUM(expired_credits) INTO v_total_credits_expired
  FROM (SELECT credits_remaining AS expired_credits FROM credit_batches WHERE expiration_date <= NOW()) sub;

  RETURN jsonb_build_object(
    'batches_expired', v_expired_count,
    'total_credits_expired', COALESCE(v_total_credits_expired, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Indexes for Performance

```sql
-- User quota lookups
CREATE INDEX idx_user_quota_user_id ON user_quota(user_id);

-- Credit batch queries (FIFO, expiration)
CREATE INDEX idx_credit_batches_user_fifo ON credit_batches(user_id, purchase_date ASC) WHERE credits_remaining > 0;
CREATE INDEX idx_credit_batches_expiring ON credit_batches(expiration_date) WHERE credits_remaining > 0;

-- Transaction history
CREATE INDEX idx_transactions_user_date ON payment_transactions(user_id, created_at DESC);

-- Webhook idempotency
CREATE UNIQUE INDEX idx_webhook_event_id ON stripe_webhook_events(event_id);
```

## Migration Order

1. Extend `user_quota` (allow negative balance)
2. Create `payment_transactions`
3. Create `credit_batches`
4. Create `stripe_webhook_events`
5. Create `payment_refunds`
6. Create database functions
7. Create indexes
8. Set up RLS policies

## Next Steps

- Generate API contracts in `/contracts/`
- Write contract tests for all endpoints
- Create quickstart.md with test scenarios
