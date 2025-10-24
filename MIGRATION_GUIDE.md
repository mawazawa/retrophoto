# Payment System Migration Guide
## Step-by-Step Database Setup

**Status**: Ready to apply
**Last Updated**: 2025-10-24

---

## Prerequisites

Before applying migrations, ensure you have:

- [x] Supabase project created
- [x] Access to Supabase Dashboard
- [x] `NEXT_PUBLIC_SUPABASE_URL` environment variable
- [x] `SUPABASE_SERVICE_ROLE_KEY` environment variable
- [x] Database backup (recommended)

---

## Migration Files

All SQL migration files are located in `/lib/supabase/migrations/`:

1. **011_credit_batches.sql** - FIFO credit batch tracking
2. **012_payment_transactions.sql** - Payment audit trail
3. **013_stripe_webhook_events.sql** - Webhook idempotency
4. **014_payment_refunds.sql** - Refund tracking
5. **015_extend_user_credits.sql** - Extend user_credits table
6. **016_database_functions.sql** - PL/pgSQL functions

---

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Navigate to SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Apply Migrations in Order

For each migration file (011 through 016):

1. **Open** the migration file in your code editor
2. **Copy** the entire SQL content
3. **Paste** into Supabase SQL Editor
4. **Run** the query (click "RUN" button or Cmd/Ctrl + Enter)
5. **Verify** success (check for green checkmark)
6. **Repeat** for next migration

**Important**: Apply migrations in numerical order (011 → 016).

### Step 3: Verify Installation

Run this verification query in SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'credit_batches',
  'payment_transactions',
  'stripe_webhook_events',
  'payment_refunds',
  'user_credits'
)
ORDER BY table_name;

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name IN (
  'add_credits',
  'deduct_credit',
  'process_refund',
  'expire_credits'
)
ORDER BY routine_name;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'credit_batches',
  'payment_transactions',
  'stripe_webhook_events',
  'payment_refunds'
)
ORDER BY tablename, policyname;
```

**Expected Results**:
- 5 tables (credit_batches, payment_transactions, stripe_webhook_events, payment_refunds, user_credits)
- 4 functions (add_credits, deduct_credit, process_refund, expire_credits)
- Multiple RLS policies (service role + user access)

---

## Method 2: Supabase CLI (Advanced)

### Prerequisites

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

### Apply Migrations

```bash
cd /home/user/retrophoto

# Apply each migration manually
supabase db execute -f lib/supabase/migrations/011_credit_batches.sql
supabase db execute -f lib/supabase/migrations/012_payment_transactions.sql
supabase db execute -f lib/supabase/migrations/013_stripe_webhook_events.sql
supabase db execute -f lib/supabase/migrations/014_payment_refunds.sql
supabase db execute -f lib/supabase/migrations/015_extend_user_credits.sql
supabase db execute -f lib/supabase/migrations/016_database_functions.sql
```

### Verify

```bash
supabase db diff --schema public
```

---

## Method 3: Automated Script (Local PostgreSQL)

If you have direct PostgreSQL access:

```bash
# Make script executable
chmod +x scripts/apply-migrations.sh

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run script
./scripts/apply-migrations.sh
```

---

## Post-Migration Testing

### Test 1: Add Credits Function

```sql
-- Test add_credits function
SELECT add_credits(
  auth.uid(), -- or a test user UUID
  10,         -- credits to add
  gen_random_uuid() -- test transaction ID
);

-- Verify credit batch was created
SELECT * FROM credit_batches
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Verify user credits updated
SELECT * FROM user_credits
WHERE user_id = auth.uid();
```

### Test 2: Deduct Credit Function

```sql
-- Test deduct_credit function (FIFO)
SELECT deduct_credit(auth.uid());

-- Verify batch credits_remaining decreased
SELECT * FROM credit_batches
WHERE user_id = auth.uid()
ORDER BY purchase_date ASC
LIMIT 1;

-- Verify user available_credits decreased
SELECT * FROM user_credits
WHERE user_id = auth.uid();
```

### Test 3: Webhook Idempotency

```sql
-- Simulate duplicate webhook event
INSERT INTO stripe_webhook_events (event_id, event_type, payload, processing_status)
VALUES ('evt_test_12345', 'checkout.session.completed', '{}', 'pending');

-- Try inserting same event again (should fail with unique constraint)
INSERT INTO stripe_webhook_events (event_id, event_type, payload, processing_status)
VALUES ('evt_test_12345', 'checkout.session.completed', '{}', 'pending');
-- Expected: ERROR:  duplicate key value violates unique constraint "stripe_webhook_events_event_id_key"
```

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Rollback in reverse order
DROP FUNCTION IF EXISTS expire_credits CASCADE;
DROP FUNCTION IF EXISTS process_refund CASCADE;
DROP FUNCTION IF EXISTS deduct_credit CASCADE;
DROP FUNCTION IF EXISTS add_credits CASCADE;

DROP TABLE IF EXISTS payment_refunds CASCADE;
DROP TABLE IF EXISTS stripe_webhook_events CASCADE;
DROP TABLE IF EXISTS credit_batches CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;

ALTER TABLE user_credits
  DROP COLUMN IF EXISTS total_credits_purchased,
  DROP COLUMN IF EXISTS credits_expired,
  DROP COLUMN IF EXISTS last_purchase_date;
```

---

## Troubleshooting

### Error: "relation 'user_credits' does not exist"

The `user_credits` table needs to be created first. Create it:

```sql
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_credits INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage credits"
  ON user_credits FOR ALL
  USING (auth.role() = 'service_role');
```

### Error: "foreign key constraint violation"

Apply migrations in order (011 → 016). Migration 012 adds a foreign key that references 011.

### Error: "function 'gen_random_uuid' does not exist"

Enable the pgcrypto extension:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "permission denied"

Make sure you're using the Service Role Key, not the Anon Key. The Service Role Key bypasses RLS and has full database access.

---

## Next Steps After Migration

1. **Test Stripe Integration**
   ```bash
   npm run dev
   # Visit http://localhost:3000/app
   # Click "Buy 10 Credits"
   # Complete test payment
   ```

2. **Set Up Stripe Webhook**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Configure Vercel Cron**
   ```json
   {
     "crons": [{
       "path": "/api/cron/expire-credits",
       "schedule": "0 0 * * *"
     }]
   }
   ```

4. **Run Integration Tests**
   ```bash
   npm test tests/integration/payment-flow.test.ts
   ```

---

## Support

If you encounter issues:

1. Check Supabase logs (Dashboard → Logs)
2. Check Vercel logs (if deployed)
3. Verify environment variables
4. Test with Stripe test mode first

---

**Migration Status**: ⏳ Ready to apply
**Next Action**: Apply migrations via Supabase Dashboard SQL Editor

