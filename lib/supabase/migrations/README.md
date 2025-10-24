# Database Migrations

This directory contains SQL migrations for the RetroPhoto payment and credit system.

## Overview

**8 migrations** that create a complete credit-based payment system:

| Migration | Purpose | Key Tables/Functions |
|-----------|---------|---------------------|
| 010 | Create base user_credits table | `user_credits` |
| 011 | Create credit batches for FIFO expiration | `credit_batches` |
| 012 | Create payment transactions audit trail | `payment_transactions` |
| 013 | Create webhook events for idempotency | `stripe_webhook_events` |
| 014 | Create refunds tracking | `payment_refunds` |
| 015 | Extend user_credits for negative balance | columns: `total_credits_purchased`, `credits_expired` |
| 016 | Create database functions | `add_credits()`, `deduct_credit()`, `process_refund()`, `expire_credits()` |
| 017 | Extend upload_sessions for user tracking | column: `user_id` |

## Features

✅ **FIFO Credit Expiration**: Credits expire 1 year after purchase, oldest first
✅ **Negative Balance Support**: Allows refunds even if credits were already used
✅ **Idempotent Webhooks**: Database-backed deduplication prevents double-processing
✅ **Immutable Audit Trail**: Transaction records cannot be deleted or modified
✅ **Row Level Security**: All tables have RLS policies
✅ **Batch Tracking**: Track which credits came from which purchase

## Application Methods

### Method 1: Automated Script (psql) ⚡ RECOMMENDED

**Requirements:**
- `psql` client installed
- `DATABASE_URL` environment variable OR `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_DB_PASSWORD`

**Steps:**
```bash
# Set environment variables
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Or alternatively:
export NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
export SUPABASE_DB_PASSWORD="your-db-password"

# Run migration script
./scripts/apply-migrations-psql.sh
```

**Features:**
- ✅ Migration tracking (prevents duplicate applications)
- ✅ Transactional (rollback on error)
- ✅ Progress display with colors
- ✅ Skips already-applied migrations
- ✅ Auto-constructs DATABASE_URL if needed

### Method 2: Supabase Dashboard (Manual) 🌐

**Steps:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste each migration file in order (010 → 017)
5. Click **Run** for each migration

**Order matters!** Apply in this sequence:
```
010_create_user_credits.sql
011_credit_batches.sql
012_payment_transactions.sql
013_stripe_webhook_events.sql
014_payment_refunds.sql
015_extend_user_credits.sql
016_database_functions.sql
017_extend_upload_sessions.sql
```

### Method 3: Supabase CLI

**Requirements:**
- Supabase CLI installed: `npm install -g supabase`

**Steps:**
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [your-project-ref]

# Apply migrations
for file in lib/supabase/migrations/*.sql; do
  supabase db execute --file "$file"
done
```

## Verification

After applying migrations, verify everything is set up correctly:

### 1. Check Tables
```sql
-- Should show 8 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_credits',
  'credit_batches',
  'payment_transactions',
  'stripe_webhook_events',
  'payment_refunds',
  'schema_migrations'
);
```

### 2. Check Functions
```sql
-- Should show 4 functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_credits',
  'deduct_credit',
  'process_refund',
  'expire_credits'
);
```

### 3. Check RLS Policies
```sql
-- Should show multiple policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN (
  'user_credits',
  'credit_batches',
  'payment_transactions',
  'stripe_webhook_events',
  'payment_refunds'
);
```

### 4. Test Functions
```sql
-- Test add_credits (replace with your test user ID)
SELECT add_credits(
  'YOUR-USER-UUID-HERE'::uuid,
  10,
  gen_random_uuid()
);

-- Check result
SELECT * FROM user_credits WHERE user_id = 'YOUR-USER-UUID-HERE'::uuid;
SELECT * FROM credit_batches WHERE user_id = 'YOUR-USER-UUID-HERE'::uuid;
```

## Troubleshooting

### Error: "relation already exists"
✅ **Safe to ignore** - Migrations use `IF NOT EXISTS` clauses

### Error: "column already exists"
✅ **Safe to ignore** - Migrations use `ADD COLUMN IF NOT EXISTS`

### Error: "permission denied"
❌ **Action required** - Ensure you're using service role key or database password

### Error: "function does not exist"
❌ **Action required** - Make sure you applied migration 016 (database functions)

### Webhook shows "No credits available"
❌ **Action required**:
1. Check if `deduct_credit` function exists: `SELECT * FROM pg_proc WHERE proname = 'deduct_credit';`
2. Verify user has credits: `SELECT * FROM user_credits WHERE user_id = 'USER-UUID';`
3. Check batch tracking: `SELECT * FROM credit_batches WHERE user_id = 'USER-UUID';`

## Migration Details

### Credit Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    CREDIT LIFECYCLE                          │
└─────────────────────────────────────────────────────────────┘

1. PURCHASE (Stripe Checkout)
   └─> webhook: checkout.session.completed
       └─> add_credits(user_id, 10, transaction_id)
           ├─> user_credits.available_credits += 10
           ├─> user_credits.total_credits_purchased += 10
           └─> credit_batches (expiration_date = NOW + 365 days)

2. USAGE (Photo Restoration)
   └─> deduct_credit(user_id)
       ├─> Find oldest batch (FIFO)
       ├─> credit_batches.credits_remaining -= 1
       ├─> user_credits.available_credits -= 1
       └─> user_credits.credits_used += 1

3. REFUND (Stripe Dashboard)
   └─> webhook: charge.refunded
       └─> process_refund(transaction_id, refund_id, amount, currency)
           ├─> payment_transactions.status = 'refunded'
           ├─> user_credits.available_credits -= 10 (can go negative!)
           └─> payment_refunds (record for audit)

4. EXPIRATION (Cron Job - Daily)
   └─> expire_credits()
       ├─> Find batches where expiration_date <= NOW
       ├─> user_credits.available_credits -= remaining
       ├─> user_credits.credits_expired += remaining
       └─> credit_batches.credits_remaining = 0
```

### Database Schema

```
┌───────────────────┐
│  user_credits     │  ← Aggregate balance per user
├───────────────────┤
│ user_id (PK)      │
│ available_credits │  ← Current usable credits (can be negative)
│ credits_used      │  ← Lifetime usage
│ credits_expired   │  ← Lifetime expirations
│ total_purchased   │  ← Lifetime purchases
└───────────────────┘
         │
         │ 1:N
         ▼
┌───────────────────┐
│  credit_batches   │  ← Individual purchases with expiration
├───────────────────┤
│ id (PK)           │
│ user_id (FK)      │
│ purchase_date     │  ← For FIFO ordering
│ expiration_date   │  ← purchase_date + 365 days
│ credits_purchased │  ← Always 10
│ credits_remaining │  ← Decremented on use
│ transaction_id    │  ← Link to payment
└───────────────────┘
         │
         │ N:1
         ▼
┌─────────────────────┐
│ payment_transactions│  ← Immutable payment audit trail
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ stripe_session_id   │  ← Unique
│ stripe_payment_intent│
│ amount              │  ← In cents
│ status              │  ← pending/completed/refunded
│ created_at          │  ← Immutable
└─────────────────────┘
```

## Next Steps

After applying migrations:

1. **Configure Stripe Webhook**
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `charge.refunded`
   - Get signing secret and add to `STRIPE_WEBHOOK_SECRET`

2. **Create Stripe Product**
   - Dashboard → Products → Add Product
   - Name: "10 Photo Restoration Credits"
   - Price: $9.99 USD (one-time payment)
   - Copy Price ID to `STRIPE_CREDITS_PRICE_ID`

3. **Set Up Cron Job** (Optional - for credit expiration)
   - Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/expire-credits",
       "schedule": "0 0 * * *"
     }]
   }
   ```
   - Create endpoint: `app/api/cron/expire-credits/route.ts`
   - Calls `expire_credits()` function daily

4. **Test Payment Flow**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Verify webhook received and processed
   - Check credits added: `SELECT * FROM user_credits WHERE user_id = 'UUID';`

---

**Questions?** Check the [main README](/README.md) or [SHIP_IT_GUIDE.md](/SHIP_IT_GUIDE.md)
