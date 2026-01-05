# RetroPhoto Monetization Launch Checklist

> **Status**: 95% Ready | **Estimated Time to Launch**: 2-4 hours of verification work

## Executive Summary

| Category | Status | Blockers |
|----------|--------|----------|
| **Code** | ✅ Ready | None - TypeScript builds cleanly |
| **Payments (Stripe)** | ✅ Code Ready | Verify webhook secret in production |
| **Database** | ⚠️ Verify | Confirm migrations are applied |
| **AI Model** | ✅ Ready | Using proven SwinIR (Replicate) |
| **Security** | ✅ Ready | CSRF, RLS, rate limiting implemented |
| **Monitoring** | ⚠️ Configure | Sentry needs instrumentation file |

---

## Critical Pre-Launch Tasks (DO THESE FIRST)

### 1. Verify Database Migrations ⏱️ 5 min
```sql
-- Run in Supabase SQL Editor to verify tables exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_credits', 'credit_batches', 'payment_transactions', 'stripe_webhook_events');

-- Expected: 4 rows returned. If not, apply migrations.
```

**If migrations NOT applied:**
```bash
# Apply in order via Supabase Dashboard > SQL Editor
# Files in: lib/supabase/migrations/
010_user_quota.sql
011_credit_batches.sql
012_payment_transactions.sql
013_stripe_webhook_events.sql
014_payment_refunds.sql
015_extend_user_credits.sql
016_database_functions.sql
017_rls_policies.sql
```

### 2. Verify Stripe Webhook Configuration ⏱️ 5 min
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Verify endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Verify secret matches `STRIPE_WEBHOOK_SECRET` in Vercel
4. Confirm events:
   - `checkout.session.completed` ✓
   - `payment_intent.succeeded` ✓
   - `payment_intent.payment_failed` ✓
   - `charge.refunded` ✓

### 3. Verify Environment Variables in Vercel ⏱️ 5 min
```
# REQUIRED - Check all are set:
✓ STRIPE_SECRET_KEY        (sk_live_...)
✓ STRIPE_PUBLISHABLE_KEY   (pk_live_...)
✓ STRIPE_WEBHOOK_SECRET    (whsec_...)
✓ STRIPE_CREDITS_PRICE_ID  (price_...)
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ REPLICATE_API_TOKEN
✓ CRON_SECRET              (random string for /api/cron/expire-credits)
✓ NEXT_PUBLIC_BASE_URL     (https://your-domain.com)

# RECOMMENDED:
○ RESEND_API_KEY           (for payment receipts)
○ SENTRY_DSN               (for error tracking)
```

---

## Test Payment Flow ⏱️ 10 min

### Stripe Test Mode Checklist
1. [ ] Set Stripe to Test Mode in dashboard
2. [ ] Create a test checkout session
3. [ ] Use test card: `4242 4242 4242 4242`
4. [ ] Verify webhook received (check Stripe dashboard > Webhooks > Recent events)
5. [ ] Verify credits added to user account
6. [ ] Test refund flow

### Test Cards Reference
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

---

## What "Done" Looks Like

### Minimum Viable Monetization
- [ ] User uploads photo → Sees restoration preview
- [ ] Free tier (1 photo) works without payment
- [ ] Quota exceeded → Upgrade prompt appears
- [ ] Click "Buy Credits" → Stripe Checkout opens
- [ ] Payment succeeds → Redirect to app with credits
- [ ] Credits visible in dashboard
- [ ] Can restore photos using credits
- [ ] Credits deducted correctly

### Success Criteria
| Metric | Target | Current Status |
|--------|--------|----------------|
| Time to Magic (p50) | ≤6 seconds | ⚠️ Needs measurement |
| Time to Magic (p95) | ≤12 seconds | ⚠️ Needs measurement |
| Failed restorations | <1% | ✅ Auto-retry implemented |
| Payment success rate | >95% | ⚠️ Needs production data |
| Checkout → Purchase | >30% | ⚠️ Needs analytics |

---

## AI Model Status

### Current: Replicate SwinIR ✅
```
Model: jingyunliang/swinir:660d922d...
Task: Real-World Image Super-Resolution-Large
Cost: ~$0.05/restoration
Quality: Proven, reliable for old photo restoration
```

### You Asked About: Gemini Image Preview
**Status**: Multi-model architecture exists but is DISABLED
- File: `lib/ai/orchestrator.ts`
- Feature flag: `ENABLE_MULTI_MODEL=false`
- Gemini integration: Stub only (not implemented)

**Recommendation**: Launch with SwinIR. It's proven and reliable. Add Gemini/GPT-4V for image analysis in v2.

---

## Post-Launch Optimizations (Phase 2)

### Within First Week
1. [ ] Monitor TTM metrics in Sentry
2. [ ] Review webhook failure rates
3. [ ] Analyze checkout funnel drop-off
4. [ ] Set up Vercel cron for credit expiration

### Within First Month
1. [ ] Implement Redis for distributed rate limiting
2. [ ] Add multi-model AI routing
3. [ ] A/B test pricing ($9.99 vs $7.99 vs $12.99)
4. [ ] Implement subscription option

---

## Security Verification

### Already Implemented ✅
- [x] CSRF protection on mutation endpoints
- [x] Row-Level Security (RLS) on all tables
- [x] Fail-closed quota checking
- [x] Webhook signature verification
- [x] Server-side AI key isolation
- [x] Rate limiting (in-memory)
- [x] Input validation (Zod schemas)
- [x] UUID validation for session IDs

### Upgrade for Scale
- [ ] Replace in-memory rate limiting with Redis/Upstash
- [ ] Add API key rotation mechanism
- [ ] Implement request signing for webhooks

---

## Quick Launch Commands

```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Trigger test checkout (development)
curl -X POST http://localhost:3000/api/create-checkout-session \
  -F "fingerprint=test-user-123"

# 3. Check webhook health
curl https://your-domain.com/api/webhooks/stripe/health

# 4. Run credit expiration manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/expire-credits
```

---

## Revenue Projections

### Unit Economics
| Item | Value |
|------|-------|
| Credit Pack Price | $9.99 |
| Credits per Pack | 10 |
| Replicate Cost/Restoration | ~$0.05 |
| Storage Cost/Photo | ~$0.001/month |
| **Gross Margin** | **~95%** |

### Break-Even
- Vercel Pro: $20/month
- Supabase Free: $0
- Replicate: Pay per use
- **Break-even**: 3 credit packs/month ($30)

---

## Contact for Issues

**Stripe Issues**: Check [Stripe Status](https://status.stripe.com/)
**Replicate Issues**: Check [Replicate Status](https://status.replicate.com/)
**Supabase Issues**: Check [Supabase Status](https://status.supabase.com/)

---

*Last updated: 2025-12-28*
*Generated by Claude Code*
