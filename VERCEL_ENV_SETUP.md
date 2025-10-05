# Vercel Environment Variable Setup Guide

**Project**: RetroPhoto AI
**Domain**: https://retrophotoai.com
**Status**: 🔴 ACTION REQUIRED

---

## Critical: Set Production Environment Variables

### Step-by-Step Instructions

1. **Access Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click on your `retrophoto` project

2. **Navigate to Environment Variables**
   - Click "Settings" tab (top navigation)
   - In left sidebar, click "Environment Variables"

3. **Add NEXT_PUBLIC_BASE_URL** (CRITICAL)
   - Click **"Add New"** button
   - **Name**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://retrophotoai.com`
   - **Environment**: Select **"Production"** only
   - Click **"Save"**

4. **Verify Other Environment Variables**

Check that these are already set (from .env.local):

**Supabase** (Required):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**Replicate AI** (Required):
```
REPLICATE_API_TOKEN
```

**Stripe** (Required):
```
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CREDITS_PRICE_ID
```

**Optional** (Recommended):
```
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

5. **Redeploy (if needed)**
   - After adding/changing env vars, trigger a new deployment
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest production deployment
   - Or: Push a new commit to trigger auto-deployment

---

## Why NEXT_PUBLIC_BASE_URL is Critical

**Current Problem**:
- `.env.local` has: `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- Production uses this value → **BROKEN sharing/deep links!**

**What Breaks Without It**:
1. **Sharing Links**: Users share `http://localhost:3000/result/xyz` (broken!)
2. **Deep Links**: Email/SMS links use localhost (broken!)
3. **OG Cards**: Social media previews fail
4. **PWA Manifest**: App installation uses wrong URL

**After Setting**:
- ✅ Sharing links: `https://retrophotoai.com/result/xyz`
- ✅ Deep links work correctly
- ✅ Social media previews functional
- ✅ PWA installation works

---

## Verification Steps

After setting environment variables:

### 1. Check Environment Variable is Set
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Verify NEXT_PUBLIC_BASE_URL shows:
# Value: https://retrophotoai.com
# Environment: Production ✓
```

### 2. Test in Production (After Redeploy)

**Test Deep Link Generation**:
1. Upload a photo to https://retrophotoai.com
2. Complete restoration
3. On result page, click "Share" button
4. **Verify URL**: Should be `https://retrophotoai.com/result/[id]`
5. **NOT**: `http://localhost:3000/result/[id]`

**Test via API** (if accessible):
```bash
# If you have an API endpoint that generates links:
curl https://retrophotoai.com/api/share/[session-id]

# Expected response should contain:
# "url": "https://retrophotoai.com/result/[session-id]"
```

### 3. Check Browser Console
1. Open https://retrophotoai.com
2. Open browser DevTools (F12)
3. In Console, type:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_BASE_URL)
   ```
4. **Expected**: `https://retrophotoai.com`
5. **NOT**: `http://localhost:3000`

---

## Common Issues & Solutions

### Issue 1: Variable Not Working After Save
**Solution**: Redeploy the application
- Environment variables are baked into build at deploy time
- Changes require new deployment

### Issue 2: Wrong Value in Production
**Cause**: Typo or extra spaces in value
**Solution**:
- Edit the variable in Vercel dashboard
- Remove any trailing spaces
- Ensure exact value: `https://retrophotoai.com` (no trailing slash)

### Issue 3: NEXT_PUBLIC_ Prefix Missing
**Important**:
- Variables exposed to browser **MUST** start with `NEXT_PUBLIC_`
- Server-only variables don't need this prefix
- `NEXT_PUBLIC_BASE_URL` is correct (browser needs it for client-side link generation)

---

## Security Notes

### Public vs Private Variables

**NEXT_PUBLIC_*** variables:
- ✅ Included in client-side JavaScript bundle
- ✅ Visible in browser DevTools
- ✅ Safe for URLs, public keys
- ❌ NEVER use for secrets!

**Examples**:
- ✅ `NEXT_PUBLIC_BASE_URL=https://retrophotoai.com` (safe - it's public anyway)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (safe - anon key is public)
- ❌ `NEXT_PUBLIC_STRIPE_SECRET_KEY` (WRONG! Never make secret keys public)

**Private Variables** (no NEXT_PUBLIC_ prefix):
- ✅ Server-side only
- ❌ Not accessible in browser
- ✅ Use for API keys, secrets

**Examples**:
- ✅ `STRIPE_SECRET_KEY` (correct - server only)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (correct - server only)

---

## After Completing This Setup

### Next Steps:
1. ✅ Set `NEXT_PUBLIC_BASE_URL` in Vercel (this guide)
2. ⚠️ Configure Stripe webhook endpoint (see PRODUCTION_READINESS_AUDIT.md)
3. 🟢 Optional: Enable Sentry error tracking

### Testing Checklist:
- [ ] Environment variable shows in Vercel dashboard
- [ ] Redeployed application
- [ ] Tested sharing link (should use retrophotoai.com)
- [ ] Checked browser console (should show retrophotoai.com)
- [ ] Social media preview working (if applicable)

---

## Quick Reference: All Environment Variables

Copy this checklist to verify all vars are set in Vercel Production:

```
Core (Required):
☐ NEXT_PUBLIC_BASE_URL
☐ NEXT_PUBLIC_SUPABASE_URL
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY
☐ SUPABASE_SERVICE_ROLE_KEY
☐ REPLICATE_API_TOKEN
☐ STRIPE_SECRET_KEY
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
☐ STRIPE_WEBHOOK_SECRET
☐ STRIPE_CREDITS_PRICE_ID

Monitoring (Optional):
☐ SENTRY_DSN
☐ NEXT_PUBLIC_SENTRY_DSN
☐ SENTRY_AUTH_TOKEN
☐ SENTRY_ORG
☐ SENTRY_PROJECT
```

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs/environment-variables
- Check PRODUCTION_READINESS_AUDIT.md for context
- Stripe Setup: See "Stripe Webhook Configuration" section in audit

**Status After Completion**:
Once `NEXT_PUBLIC_BASE_URL` is set and Stripe webhook configured, application will be **100% production ready** ✅
