# 🚀 RetroPhoto Deployment Guide - Execute Now

## Current Status
✅ Replicate API: Connected
✅ Supabase: Connected
✅ Environment Variables: Configured
✅ Code: Bug-free (API contract enforced)
❌ Database Schema: **NOT CREATED** ← This is blocking deployment

## Step 1: Create Database Schema (CRITICAL)

### Option A: Supabase Dashboard (Recommended - 5 minutes)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new
   - You should already be logged in

2. **Run Migrations in Order** (copy/paste each file, then click RUN):

   **Migration 1: Create Enums**
   ```bash
   # Copy contents of: lib/supabase/migrations/001_create_enums.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 2: User Quota Table**
   ```bash
   # Copy contents of: lib/supabase/migrations/002_user_quota.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 3: Upload Sessions Table**
   ```bash
   # Copy contents of: lib/supabase/migrations/003_upload_sessions.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 4: Restoration Results Table**
   ```bash
   # Copy contents of: lib/supabase/migrations/004_restoration_results.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 5: Analytics Events Table**
   ```bash
   # Copy contents of: lib/supabase/migrations/005_analytics_events.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 6: Check Quota Function**
   ```bash
   # Copy contents of: lib/supabase/migrations/006_check_quota_function.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 7: Cleanup Function**
   ```bash
   # Copy contents of: lib/supabase/migrations/007_cleanup_function.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 8: Cron Schedule**
   ```bash
   # Copy contents of: lib/supabase/migrations/008_cron_schedule.sql
   ```
   Paste into SQL Editor → Click "RUN"

   **Migration 9: User Credits**
   ```bash
   # Copy contents of: lib/supabase/migrations/009_user_credits.sql
   ```
   Paste into SQL Editor → Click "RUN"

3. **Verify Tables Created**
   - Go to: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/editor
   - You should see 4 tables:
     - ✅ user_quota
     - ✅ upload_sessions
     - ✅ restoration_results
     - ✅ analytics_events
     - ✅ user_credits

### Option B: Automated Script (Alternative)

I can create a script to run all migrations automatically, but Option A is faster if you're already logged into Supabase.

## Step 2: Create Storage Buckets

1. **Go to Storage**
   - https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/storage/buckets

2. **Create "uploads" bucket**
   - Click "New bucket"
   - Name: `uploads`
   - Public: ❌ (Private)
   - File size limit: 20MB
   - Allowed MIME types: `image/jpeg,image/png,image/heic,image/webp`

3. **Create "restorations" bucket**
   - Click "New bucket"
   - Name: `restorations`
   - Public: ✅ (Public)
   - File size limit: 50MB

## Step 3: Verify Environment Variables

Your `.env.local` should have these configured:
```bash
✅ NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
✅ SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
✅ REPLICATE_API_TOKEN=your-replicate-token
✅ STRIPE_SECRET_KEY=sk_live_...
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
✅ STRIPE_WEBHOOK_SECRET=whsec_...
✅ STRIPE_CREDITS_PRICE_ID=price_...
```

## Step 4: Test Locally

```bash
# Build the application
npm run build

# If build succeeds, start production server
npm start

# Test in browser
open http://localhost:3000
```

**Test Checklist**:
- [ ] Landing page loads
- [ ] Upload zone appears
- [ ] Upload a test image
- [ ] Image restoration completes
- [ ] Result page shows before/after slider

## Step 5: Deploy to Vercel

### If NOT connected to Vercel yet:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### If ALREADY connected to Vercel:

```bash
# Push to git (Vercel auto-deploys)
git add .
git commit -m "fix: API error codes + prepare for production deployment"
git push origin main
```

Then add environment variables in Vercel Dashboard:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add all variables from `.env.local` (except ones starting with `NEXT_PUBLIC_`)
3. Redeploy

## Step 6: Post-Deployment Verification

Visit your deployed URL and test:

```bash
# Test quota API
curl https://your-app.vercel.app/api/quota?fingerprint=test-fingerprint-12345678901234567890

# Expected response:
# {"remaining":1,"limit":1,"requires_upgrade":false,"last_restore_at":null}
```

Test image restoration:
1. Upload a photo
2. Wait for AI processing (<30 seconds)
3. Verify result page loads
4. Test before/after slider

## Troubleshooting

### "Table 'upload_sessions' does not exist"
→ Go back to Step 1, run all migrations

### "PGRST205: Could not find the table"
→ Clear Supabase cache: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/settings/api
→ Click "Refresh schema cache"

### "Replicate API error"
→ Check account has credits: https://replicate.com/account/billing
→ Minimum $10 required

### Build fails with TypeScript errors
→ Run `npm run typecheck` to see errors
→ Most likely database types need regenerating

## Quick Start Commands

```bash
# Complete deployment in one go
npm run build && vercel --prod

# Or step-by-step
npm run typecheck  # Check for errors
npm run build      # Build production bundle
npm start          # Test locally
vercel --prod      # Deploy to production
```

## Success Metrics

After deployment, you should see:
- ✅ Landing page loads < 2 seconds
- ✅ Image upload works
- ✅ AI restoration completes < 30 seconds
- ✅ Quota tracking works (1 free restore)
- ✅ Payment integration works

## Current Blockers

1. **DATABASE SCHEMA NOT CREATED** ← Do this first!
2. Storage buckets not created ← Do this second

Everything else is ready to go! 🚀

---

**Estimated Time**: 10-15 minutes total
- Database setup: 5 minutes
- Storage buckets: 2 minutes
- Local testing: 3 minutes
- Vercel deployment: 5 minutes
