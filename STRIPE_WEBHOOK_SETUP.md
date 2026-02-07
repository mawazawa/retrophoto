# Stripe Webhook Configuration Guide

**Project**: RetroPhoto AI
**Webhook Endpoint**: https://retrophotoai.com/api/webhooks/stripe
**Webhook Secret**: `whsec_<YOUR_WEBHOOK_SECRET>`
**Status**: 🟢 SECRET CONFIRMED, READY TO CONFIGURE

---

## Critical: Configure Stripe Webhook in Production

### Step 1: Verify Stripe Dashboard Configuration

1. **Go to Stripe Dashboard**
   - Live Mode: https://dashboard.stripe.com/webhooks
   - **⚠️ IMPORTANT**: Make sure you're in **Live mode** (toggle in top-left)

2. **Check Existing Webhook Endpoint**
   - Look for: `https://retrophotoai.com/api/webhooks/stripe`
   - If it exists: Verify events are correct (see Step 3)
   - If it doesn't exist: Click "Add endpoint" (see Step 2)

### Step 2: Add Webhook Endpoint (If Not Exists)

1. **Click "Add endpoint"** button
2. **Endpoint URL**:
   ```
   https://retrophotoai.com/api/webhooks/stripe
   ```
3. **Description** (optional):
   ```
   RetroPhoto AI - Payment Processing
   ```
4. **API Version**: Latest (should auto-select)
5. **Events to send**: Click "Select events"

### Step 3: Select Required Events

Check these events (minimum required):

**Checkout Events**:
- ✅ `checkout.session.completed` - When payment completes

**Payment Events** (optional but recommended):
- ✅ `payment_intent.succeeded` - Backup payment confirmation
- ✅ `payment_intent.payment_failed` - Failed payment tracking

**Refund Events** (if you offer refunds):
- ✅ `charge.refunded` - Refund processing

**Click "Add events"** then **"Add endpoint"**

### Step 4: Get Webhook Signing Secret

After creating the endpoint:
1. Click on the endpoint URL in the list
2. Click **"Reveal"** next to "Signing secret"
3. **Verify it matches**: `whsec_<YOUR_WEBHOOK_SECRET>`

**✅ CONFIRMED**: This is the correct webhook secret for your endpoint.

---

## Step 5: Set Environment Variable in Vercel

### Via Vercel Dashboard

1. **Go to**: https://vercel.com/dashboard
2. **Click**: Your `retrophoto` project
3. **Settings** → **Environment Variables**
4. **Find or Add**: `STRIPE_WEBHOOK_SECRET`

**If Variable Exists**:
- Click "Edit" (pencil icon)
- **Verify value**: `whsec_<YOUR_WEBHOOK_SECRET>`
- **Environment**: Production ✓
- Click "Save"

**If Variable Doesn't Exist**:
- Click "Add New"
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_<YOUR_WEBHOOK_SECRET>`
- **Environment**: Production ✓ (also check Preview if testing)
- Click "Save"

### Via Vercel CLI (Alternative)

```bash
# From project root
vercel env add STRIPE_WEBHOOK_SECRET production
# When prompted, paste: whsec_<YOUR_WEBHOOK_SECRET>
```

---

## Step 6: Redeploy Application

**Required**: Environment variable changes require new deployment

**Option 1 - Via Dashboard**:
1. Go to "Deployments" tab
2. Find latest production deployment
3. Click "..." menu → "Redeploy"
4. Confirm

**Option 2 - Via Git Push**:
```bash
git commit --allow-empty -m "chore: trigger redeploy for webhook secret update"
git push origin main
```

**Option 3 - Via CLI**:
```bash
vercel --prod
```

---

## Verification & Testing

### Test 1: Webhook Endpoint Responds

```bash
# Stripe will automatically send a test webhook
# Check in Stripe Dashboard → Webhooks → [Your Endpoint] → "Attempts"
# Should show recent successful delivery
```

### Test 2: Signature Verification Works

**In Stripe Dashboard**:
1. Go to your webhook endpoint
2. Click "Send test webhook"
3. Select event: `checkout.session.completed`
4. Click "Send test webhook"

**Expected Result**:
- Status: `200 OK` or `Succeeded`
- Response body: `{"received":true}`

**If Failed**:
- Check error message
- Common: `Invalid signature` = wrong webhook secret
- Solution: Verify secret matches exactly (no extra spaces)

### Test 3: Real Payment Flow (Recommended)

**⚠️ WARNING**: This uses real payment processing!

1. **Go to**: https://retrophotoai.com
2. **Click**: "Buy Credits" or similar
3. **Use Stripe Test Card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. **Complete checkout**
5. **Verify**:
   - Credits added to your account
   - Check Supabase `payment_transactions` table
   - Check Supabase `stripe_webhook_events` table
   - Should see `checkout.session.completed` event with `processing_status: success`

### Test 4: Check Vercel Logs

1. **Go to**: Vercel Dashboard → Your Project → Deployments
2. **Click**: Latest production deployment
3. **Functions** tab → Find webhook function
4. **Look for**:
   ```
   Checkout completed: {
     sessionId: 'cs_...',
     userId: '...',
     customerId: 'cus_...',
     amountTotal: 999
   }
   ```

**If you see**: "Invalid signature" → Webhook secret mismatch
**If you see**: "Checkout completed" → ✅ Working!

---

## Common Issues & Solutions

### Issue 1: "Invalid signature" Error

**Cause**: Webhook secret mismatch
**Solution**:
1. Get signing secret from Stripe Dashboard
2. Verify it matches in Vercel env vars
3. Ensure no extra spaces/characters
4. Redeploy application

### Issue 2: Webhook Not Firing

**Cause**: Endpoint not configured in Stripe
**Solution**:
1. Check Stripe Dashboard → Webhooks
2. Verify endpoint exists: `https://retrophotoai.com/api/webhooks/stripe`
3. Verify events are selected (especially `checkout.session.completed`)

### Issue 3: Credits Not Added After Payment

**Cause**: Webhook processing error
**Check**:
1. Stripe Dashboard → Webhooks → [Endpoint] → Attempts
2. Look for failed deliveries
3. Check error details

**Possible Issues**:
- Database connection failed (check Supabase status)
- RLS policy blocking insert (use service role key)
- Invalid user ID in checkout session

### Issue 4: Duplicate Processing

**Expected Behavior**:
- Webhook handler has idempotency built-in
- Uses `stripe_webhook_events` table to track processed events
- Duplicate events return `{"received":true,"duplicate":true}`

**If credits multiply**:
- Check `stripe_webhook_events` table
- Verify `event_id` unique constraint exists
- Check webhook handler code for idempotency logic

---

## Security Best Practices

### ✅ DO:
- Always verify webhook signatures (already implemented)
- Use service role key for database writes (already implemented)
- Log all webhook events for audit (already implemented)
- Check event type before processing
- Validate amounts and metadata

### ❌ DON'T:
- Trust webhook data without signature verification
- Process events without idempotency
- Expose webhook secret in client-side code
- Skip error logging
- Auto-retry failed webhooks infinitely

---

## Webhook Handler Implementation

Your current implementation at `app/api/webhooks/stripe/route.ts`:

**Security Features** ✅:
- ✅ Signature verification (line 50)
- ✅ Missing signature check (line 42)
- ✅ Database-backed idempotency (lines 60-88)
- ✅ Service role key for RLS bypass (line 16)
- ✅ Error logging (throughout)

**Supported Events**:
- `checkout.session.completed` - Credits added to user account
- Add more as needed in the switch statement

**Idempotency**:
- Uses `stripe_webhook_events` table
- Unique constraint on `event_id`
- Returns `duplicate: true` for repeated events

---

## Environment Variable Summary

After completing this setup, verify these are set in Vercel Production:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_*** (from .env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_*** (from .env.local)
STRIPE_WEBHOOK_SECRET=whsec_<YOUR_WEBHOOK_SECRET> ✓
STRIPE_CREDITS_PRICE_ID=price_*** (from .env.local)
```

---

## Checklist: Complete Stripe Setup

**Stripe Dashboard**:
- [ ] Logged into Stripe Dashboard (Live mode)
- [ ] Webhook endpoint exists: https://retrophotoai.com/api/webhooks/stripe
- [ ] Event `checkout.session.completed` is selected
- [ ] Signing secret matches: `whsec_<YOUR_WEBHOOK_SECRET>`

**Vercel Dashboard**:
- [ ] `STRIPE_WEBHOOK_SECRET` environment variable set
- [ ] Value: `whsec_<YOUR_WEBHOOK_SECRET>`
- [ ] Environment: Production ✓
- [ ] Application redeployed after env var change

**Testing**:
- [ ] Sent test webhook from Stripe Dashboard
- [ ] Received 200 OK response
- [ ] Performed test payment (if safe to do so)
- [ ] Credits added to user account
- [ ] Checked Vercel logs (no errors)
- [ ] Checked Supabase tables (event logged)

---

## After Completion

**Status**: 🟢 **Stripe Webhooks Fully Configured**

**What Works**:
- ✅ Payment processing via Stripe Checkout
- ✅ Webhook signature verification
- ✅ Automatic credit addition after payment
- ✅ Idempotent webhook processing
- ✅ Audit trail in database

**Next Steps**:
1. ✅ Stripe webhook setup complete
2. ⚠️ Set `NEXT_PUBLIC_BASE_URL` in Vercel (see VERCEL_ENV_SETUP.md)
3. 🟢 Optional: Enable Sentry monitoring

**Related Documentation**:
- PRODUCTION_READINESS_AUDIT.md - Overall production status
- VERCEL_ENV_SETUP.md - Environment variable guide
- .env.local - Local environment configuration (updated with correct webhook secret)

---

**Need Help?**
- Stripe Webhook Docs: https://docs.stripe.com/webhooks
- Vercel Env Vars: https://vercel.com/docs/environment-variables
- Test Cards: https://docs.stripe.com/testing

**Webhook Secret (For Reference)**:
```
whsec_<YOUR_WEBHOOK_SECRET>
```
⚠️ Keep this secret! Only share with Vercel environment variables.
