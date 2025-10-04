# Payment Migrations - Application Guide

**Status**: Ready to Apply
**Estimated Time**: 5 minutes
**Method**: Manual via Supabase Dashboard (most reliable)

## ⚠️ Why Manual Application?

The Supabase CLI migration history is out of sync due to previous timestamp-based migrations being reverted. While the database schema exists, the payment tables do not. The fastest and most reliable method is manual application via the Supabase Dashboard SQL Editor.

## 🚀 Quick Start (5 Steps)

### Step 1: Open Supabase SQL Editor
1. Go to: [https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new](https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new)
2. Click **"New Query"**

### Step 2: Apply Migrations in Order

Copy and paste each migration file content, then click **"Run"**:

#### Migration 1: credit_batches
**File**: `lib/supabase/migrations/011_credit_batches.sql`
```
<details>
<summary>Click to expand SQL</summary>

[Copy entire contents of 011_credit_batches.sql]
</details>
```

#### Migration 2: payment_transactions
**File**: `lib/supabase/migrations/012_payment_transactions.sql`

#### Migration 3: stripe_webhook_events
**File**: `lib/supabase/migrations/013_stripe_webhook_events.sql`

#### Migration 4: payment_refunds
**File**: `lib/supabase/migrations/014_payment_refunds.sql`

#### Migration 5: extend_user_credits
**File**: `lib/supabase/migrations/015_extend_user_credits.sql`

#### Migration 6: database_functions
**File**: `lib/supabase/migrations/016_database_functions.sql`

### Step 3: Verify Tables Created

Run this verification query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'credit_batches',
  'payment_transactions',
  'stripe_webhook_events',
  'payment_refunds'
)
ORDER BY table_name;
```

**Expected Output**: 4 rows (credit_batches, payment_refunds, payment_transactions, stripe_webhook_events)

### Step 4: Verify Database Functions

Run this verification query:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_credits',
  'deduct_credit',
  'process_refund',
  'expire_credits'
)
ORDER BY routine_name;
```

**Expected Output**: 4 rows (add_credits, deduct_credit, expire_credits, process_refund)

### Step 5: Test a Function

Run this test query to ensure functions work:
```sql
-- Test add_credits function (will fail if user doesn't exist, that's ok)
SELECT add_credits(
  'test-user-id'::uuid,
  10,
  'test-transaction-id'::uuid
);
```

**Expected**: Error about user not existing OR success with new_balance: 10

## ✅ Post-Migration Tasks

After successful migration application:

### 1. Regenerate TypeScript Types
```bash
npx supabase gen types typescript --project-id sbwgkocarqvonkdlitdx > lib/supabase/database.types.ts
```

### 2. Remove @ts-nocheck Comments
Remove the `// @ts-nocheck` line from:
- `components/credits/purchase-history.tsx`
- `lib/credits/quota.ts`
- `tests/integration/payment-flow.test.ts`

### 3. Enable Integration Tests
In `tests/integration/payment-flow.test.ts`, change:
```typescript
it.skip('should handle complete payment flow', async () => {
```
to:
```typescript
it('should handle complete payment flow', async () => {
```

### 4. Run Tests
```bash
npm test tests/integration/payment-flow.test.ts
```

### 5. Verify Build
```bash
npm run typecheck
npm run build
```

## 🔄 Alternative: CLI Method (If You Want to Try)

If you prefer using the CLI and want to fix the migration history:

### Option A: Force Register Migrations
```bash
# Navigate to project directory
cd /Users/mathieuwauters/Desktop/code/retrophoto

# Link project (if not already linked)
supabase link --project-ref sbwgkocarqvonkdlitdx

# Push with include-all flag
supabase db push --include-all
```

### Option B: Reset Migration History
```bash
# Clear remote migration history
supabase migration repair --status reverted 20251003091218 20251003091229 20251003091241 20251003091259 20251003091304 20251003091310 20251003091326 20251003091330 20251003091354

# Push all migrations fresh
supabase db push --include-all
```

## 🐛 Troubleshooting

### Issue: "Table already exists"
**Solution**: The migration likely already ran. Check with:
```sql
SELECT * FROM credit_batches LIMIT 1;
```

### Issue: "Function already exists"
**Solution**: Drop and recreate:
```sql
DROP FUNCTION IF EXISTS add_credits(uuid, integer, uuid);
DROP FUNCTION IF EXISTS deduct_credit(uuid);
DROP FUNCTION IF EXISTS process_refund(uuid, text, integer, text);
DROP FUNCTION IF EXISTS expire_credits();

-- Then re-run 016_database_functions.sql
```

### Issue: "Permission denied"
**Solution**: Ensure you're using the service role or have superuser access

### Issue: CLI says "Remote database is up to date"
**Solution**: This means the migration history table is empty. Either:
1. Use manual SQL Editor method (recommended)
2. Use `supabase db remote commit` to create a baseline

## 📋 Migration File Locations

All migration files are located in:
```
/Users/mathieuwauters/Desktop/code/retrophoto/lib/supabase/migrations/
```

Files to apply:
- ✅ 011_credit_batches.sql (3040 bytes)
- ✅ 012_payment_transactions.sql (4486 bytes)
- ✅ 013_stripe_webhook_events.sql (2639 bytes)
- ✅ 014_payment_refunds.sql (2821 bytes)
- ✅ 015_extend_user_credits.sql (1655 bytes)
- ✅ 016_database_functions.sql (5841 bytes)

**Total SQL**: ~20KB

## ⏱️ Estimated Time

- **Manual method**: 5-7 minutes (copy, paste, run × 6)
- **CLI method**: 2-3 minutes (if migration history is clean)
- **Verification**: 2 minutes

## 🎯 Success Criteria

After completion, you should have:
- ✅ 4 new tables (credit_batches, payment_transactions, stripe_webhook_events, payment_refunds)
- ✅ 2 new columns in user_credits (credits_expired, total_credits_purchased)
- ✅ 4 database functions (add_credits, deduct_credit, process_refund, expire_credits)
- ✅ Row Level Security policies on all tables
- ✅ Appropriate indexes for performance

---

**Next Steps After Migrations**:
1. Regenerate types
2. Remove @ts-nocheck
3. Enable tests
4. Test locally with Stripe
5. Deploy to production

**Questions?** See [PAYMENT_IMPLEMENTATION_SUMMARY.md](PAYMENT_IMPLEMENTATION_SUMMARY.md) for full technical details.
