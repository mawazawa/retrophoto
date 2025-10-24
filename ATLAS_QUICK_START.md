# ChatGPT Atlas Agent - Quick Start Guide

**Goal**: Use ChatGPT Atlas browser agent to automatically configure all API keys and Stripe settings in 15 minutes.

---

## Prerequisites (5 minutes)

Before starting, make sure you have accounts created and are logged in to:

1. **Supabase** (https://supabase.com)
   - Project created
   - Database initialized

2. **Stripe** (https://stripe.com)
   - Account created
   - Switch to **TEST MODE** (toggle in dashboard)

3. **Replicate** (https://replicate.com)
   - Account created

4. **Anthropic** (https://console.anthropic.com)
   - Account created

5. **Optional** (Phase 2):
   - OpenAI (https://platform.openai.com)
   - Google AI Studio (https://aistudio.google.com)
   - X.AI (https://console.x.ai)
   - Groq (https://groq.com)

---

## Step-by-Step Instructions

### Step 1: Open ChatGPT Atlas Browser

1. Open **ChatGPT Atlas** browser
2. Enable **Agent Mode** (should be available for Plus/Pro users)
3. Make sure you're logged into all the accounts listed above

### Step 2: Copy the Atlas Prompt

1. Open the file: `ATLAS_SETUP_PROMPT.md`
2. **Copy the ENTIRE contents** (from "# RetroPhoto Production Configuration Task" to the end)
3. Paste it into Atlas Agent Mode

### Step 3: Let Atlas Work

Atlas will now:
- Navigate to each service dashboard
- Extract API keys
- Create Stripe product ($9.99 for 10 credits)
- Configure Stripe webhook
- Generate complete `.env.local` file

**What to expect:**
- Atlas will ask for approval at checkpoints
- You may need to confirm logins or 2FA codes
- Atlas will show progress for each phase

**Estimated time:** 10-15 minutes

### Step 4: Save the .env.local File

When Atlas completes, it will show you a complete `.env.local` file.

1. Copy the entire file content
2. Create a file called `.env.local` in your project root:
   ```bash
   cd /path/to/retrophoto
   touch .env.local
   ```
3. Paste the content into `.env.local`
4. Save the file

### Step 5: Verify Configuration

Run the verification script:
```bash
chmod +x scripts/verify-env.sh
./scripts/verify-env.sh
```

**Expected output:**
```
=== RetroPhoto Environment Verification ===

✓ NEXT_PUBLIC_SUPABASE_URL = https://xx...
✓ SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
✓ STRIPE_SECRET_KEY = sk_test_...
✓ All verifications passed!
```

### Step 6: Apply Database Migrations

```bash
./scripts/apply-migrations-psql.sh
```

**Expected output:**
```
→ Applying: 010_create_user_credits.sql
✓ 010_create_user_credits.sql applied successfully

→ Applying: 011_credit_batches.sql
✓ 011_credit_batches.sql applied successfully
...

🎉 All new migrations applied successfully!
```

### Step 7: Test Locally

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

### Step 8: Test Payment Flow

1. Click "Purchase Credits" in the app
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify credits appear in your account

---

## Troubleshooting

### Atlas Can't Find API Keys

**Try:**
- Make sure you're logged into the correct account
- Look for sections like "Settings", "Developers", "API Keys", "Integrations"
- If dashboard layout changed, describe what you see to Atlas

### Atlas Can't Create Files

**Solution:**
- Atlas will show you the `.env.local` content instead
- Copy it manually and save to `.env.local`

### 2FA / MFA Required

**Solution:**
- Complete 2FA manually when prompted
- Tell Atlas to continue after you've logged in

### Verification Script Fails

**Check:**
- Make sure `.env.local` exists in project root
- Check file has no syntax errors (no extra quotes, etc.)
- Run with debug: `bash -x scripts/verify-env.sh`

### Database Connection Failed

**Check:**
- DATABASE_URL is correct
- Password has no typos
- Supabase project is active (not paused)
- Run: `psql "$DATABASE_URL" -c "SELECT 1"`

---

## What Atlas Will Create

### 1. Stripe Product
- **Name**: 10 Photo Restoration Credits
- **Price**: $9.99 USD
- **Type**: One-time payment

### 2. Stripe Webhook
- **URL**: http://localhost:3000/api/webhooks/stripe (or your production domain)
- **Events**:
  - `checkout.session.completed`
  - `charge.refunded`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 3. Environment File
Complete `.env.local` with 15+ variables configured

---

## After Successful Setup

You should have:
- ✅ `.env.local` file with all API keys
- ✅ Stripe product created at $9.99
- ✅ Stripe webhook configured
- ✅ Database migrations applied
- ✅ App running locally on http://localhost:3000
- ✅ Payment flow tested with test card

---

## Production Deployment

When ready to deploy:

1. **Switch Stripe to Live Mode**
   - Stripe Dashboard → Toggle "Test mode" to "Live mode"
   - Re-run Atlas to get live API keys
   - Update `.env.local` with live keys

2. **Update Webhook URL**
   - Change webhook URL to production domain
   - Stripe Dashboard → Webhooks → Edit endpoint

3. **Deploy to Vercel**
   ```bash
   # Add all environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add STRIPE_SECRET_KEY production
   # ... (repeat for all variables)

   # Deploy
   vercel --prod
   ```

---

## Security Reminders

⚠️ **NEVER commit `.env.local` to Git** (it's in .gitignore)

⚠️ **Keep these keys secret:**
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- `STRIPE_SECRET_KEY` (full account access)
- `DATABASE_URL` (contains password)

⚠️ **Stripe Test Mode:**
- Use test keys for development
- Switch to live keys only for production
- Test cards only work in test mode

---

## Need Help?

**Documentation:**
- Full setup guide: `ATLAS_SETUP_PROMPT.md`
- Environment variables: `.env.example`
- Migration guide: `lib/supabase/migrations/README.md`
- System overview: `CURRENT_STATUS.md`

**Common Issues:**
- Verification failed → Check `scripts/verify-env.sh` output
- Database errors → See `lib/supabase/migrations/README.md` troubleshooting
- Stripe errors → Make sure you're in Test Mode

**Support:**
- Check SHIP_IT_GUIDE.md for deployment help
- See SESSION_SUMMARY.md for technical details

---

**Estimated Total Time**: 20-25 minutes from start to working local app! 🚀
