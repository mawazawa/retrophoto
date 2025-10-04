# Payment Processing Migrations

**Feature**: 002-implement-payment-processing
**Status**: Ready to apply
**Database**: Supabase PostgreSQL

## Migrations to Apply

Apply these migrations in order via **Supabase Dashboard → SQL Editor**:

### 1. Migration 011: credit_batches
**File**: `011_credit_batches.sql`
**Purpose**: Track credit purchases by batch for FIFO expiration (1-year lifecycle)

### 2. Migration 012: payment_transactions
**File**: `012_payment_transactions.sql`
**Purpose**: Immutable audit trail of all payment events

### 3. Migration 013: stripe_webhook_events
**File**: `013_stripe_webhook_events.sql`
**Purpose**: Webhook audit log with idempotency protection

### 4. Migration 014: payment_refunds
**File**: `014_payment_refunds.sql`
**Purpose**: Track refunds with credit deduction (supports negative balance)

### 5. Migration 015: extend_user_credits
**File**: `015_extend_user_credits.sql`
**Purpose**: Extend user_credits table for negative balance support

## How to Apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sbwgkocarqvonkdlitdx`
3. Navigate to **SQL Editor**
4. Create new query for each migration file
5. Copy-paste SQL from migration file
6. Run query
7. Verify success (check for errors)

## Verification Queries

After applying all migrations, run these verification queries:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('credit_batches', 'payment_transactions', 'stripe_webhook_events', 'payment_refunds');

-- Check user_credits was extended
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_credits'
AND column_name IN ('credits_expired', 'total_credits_purchased');

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('credit_batches', 'payment_transactions', 'stripe_webhook_events', 'payment_refunds');
```

## Rollback (if needed)

```sql
-- Rollback in reverse order
DROP TABLE IF EXISTS payment_refunds CASCADE;
DROP TABLE IF EXISTS stripe_webhook_events CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS credit_batches CASCADE;

ALTER TABLE user_credits
DROP COLUMN IF EXISTS credits_expired,
DROP COLUMN IF EXISTS total_credits_purchased;
```

## Constitutional Compliance

- ✅ Principle VII (Tasteful Monetization): Credit lifecycle tracking
- ✅ Principle XII (Refunds): Full refund support with negative balance
- ✅ Principle XVI (Privacy): Row Level Security enforced
- ✅ Principle XIV (Architecture): Database functions for server-side logic
