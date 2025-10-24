# 🚀 START HERE: Complete RetroPhoto Setup in 20 Minutes Using Atlas

**You asked for it, you got it!** ChatGPT Atlas browser agent will now handle ALL the configuration for you. Just follow these simple steps.

---

## 📋 What You Need (5 minutes prep)

### 1. Create Accounts (if you haven't already)

Visit these sites and create accounts:
- ✅ [Supabase](https://supabase.com/dashboard) - Create a new project
- ✅ [Stripe](https://stripe.com) - Create account, switch to **TEST MODE**
- ✅ [Replicate](https://replicate.com) - Create account
- ✅ [Anthropic](https://console.anthropic.com) - Create account

**Optional** (Phase 2 - can skip for now):
- [OpenAI](https://platform.openai.com)
- [Google AI Studio](https://aistudio.google.com)
- [X.AI](https://console.x.ai)
- [Groq](https://groq.com)

### 2. Log Into All Accounts

Open ChatGPT Atlas browser and log into the accounts above. Keep all tabs open in background.

---

## 🤖 The Magic: Copy This to Atlas Agent Mode

### Step 1: Open Atlas Agent Mode

1. Open **ChatGPT Atlas** browser
2. Enable **Agent Mode** (available for Plus/Pro users)
3. Make sure you're logged into Supabase, Stripe, Replicate, and Anthropic

### Step 2: Copy the Prompt

Open the file `ATLAS_SETUP_PROMPT.md` and **copy the ENTIRE contents**.

### Step 3: Paste into Atlas

Paste the entire prompt into Atlas Agent Mode and hit Enter.

### Step 4: Sit Back and Watch

Atlas will now:
- ✅ Navigate to Supabase dashboard
- ✅ Extract your Project URL, anon key, service key, database URL
- ✅ Navigate to Stripe dashboard
- ✅ Extract API keys (secret key, publishable key)
- ✅ Create Stripe product: "10 Photo Restoration Credits" at $9.99
- ✅ Create Stripe webhook with all required events
- ✅ Extract webhook signing secret
- ✅ Navigate to Replicate and get API token
- ✅ Navigate to Anthropic and get API key
- ✅ Generate complete `.env.local` file with all values

**Atlas will ask for approval at checkpoints.** Just review and say "continue" or "looks good".

**Estimated time:** 15 minutes

---

## 💾 Step 5: Save the .env.local File

When Atlas finishes, it will show you a complete `.env.local` file that looks like this:

```bash
# ============================================
# RetroPhoto Production Environment Variables
# ============================================

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.xxxxx:[password]@aws-0-region.pooler.supabase.com:5432/postgres
SUPABASE_DB_PASSWORD=your-password

# STRIPE
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_CREDITS_PRICE_ID=price_xxxxxxxxxxxxx

# AI PROVIDERS
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# APPLICATION
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=your-random-string

# ... (more variables)
```

**Copy this entire output** and save it:

```bash
cd /path/to/retrophoto
nano .env.local
# Paste the content from Atlas
# Save with Ctrl+O, Exit with Ctrl+X
```

---

## ✅ Step 6: Verify Everything Works

Run the verification script:

```bash
chmod +x scripts/verify-env.sh
./scripts/verify-env.sh
```

**Expected output:**
```
=== RetroPhoto Environment Verification ===

Checking required variables...
✓ NEXT_PUBLIC_SUPABASE_URL = https://xx...
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
✓ SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
✓ DATABASE_URL = postgresql...
✓ STRIPE_SECRET_KEY = sk_test_...
✓ STRIPE_WEBHOOK_SECRET = whsec_...
✓ STRIPE_CREDITS_PRICE_ID = price_...
✓ REPLICATE_API_TOKEN = r8_...
✓ ANTHROPIC_API_KEY = sk-ant-...

Validating formats...
✓ Supabase URL format valid
✓ Supabase anon key format valid
✓ Database URL format valid
✓ Stripe secret key format valid
⚠ Stripe is in TEST MODE (sk_test_...)

Testing database connection...
✓ Database connection successful

=== All verifications passed! ===
```

If you see **all green checkmarks ✓**, you're ready to go!

---

## 🗄️ Step 7: Apply Database Migrations

```bash
./scripts/apply-migrations-psql.sh
```

**Expected output:**
```
=== RetroPhoto Migration Application (psql) ===

Testing database connection...
✓ Database connection successful

→ Applying: 010_create_user_credits.sql
✓ 010_create_user_credits.sql applied successfully

→ Applying: 011_credit_batches.sql
✓ 011_credit_batches.sql applied successfully

... (8 migrations total)

=== Migration Summary ===
  Applied: 8
  Skipped: 0
  Total: 8

🎉 All new migrations applied successfully!
```

---

## 🎮 Step 8: Test Locally

Start the development server:

```bash
npm install  # If you haven't already
npm run dev
```

Visit: **http://localhost:3000**

You should see the RetroPhoto app! 🎉

---

## 💳 Step 9: Test Payment Flow

1. Click "Purchase Credits" (or navigate to payment page)
2. Click "Buy 10 Credits for $9.99"
3. Use Stripe test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVC:** Any 3 digits (e.g., 123)
   - **ZIP:** Any 5 digits (e.g., 12345)
4. Complete checkout
5. You should see: "Payment successful! 10 credits added to your account"

**Check your credits:**
- Look for credit balance in UI
- Should show: **10 credits available**

---

## 📸 Step 10: Test Photo Restoration

1. Upload an old photo (drag & drop or click upload)
2. Click "Restore Photo"
3. Wait ~5-10 seconds
4. See your restored photo! ✨
5. Check credit balance: Should now show **9 credits** (1 used)

---

## 🎉 YOU'RE DONE!

**Congratulations!** You just configured a complete payment system with:
- ✅ Credit-based payments
- ✅ FIFO credit tracking
- ✅ 1-year credit expiration
- ✅ Refund support
- ✅ Multi-model AI architecture
- ✅ Quality validation

**Total time:** ~20-25 minutes

---

## 🚀 Next Steps: Deploy to Production

When ready to go live:

### 1. Switch Stripe to Live Mode
- Stripe Dashboard → Toggle "Test mode" OFF
- Re-run Atlas to get live API keys (or copy manually)
- Update `.env.local` with live keys

### 2. Update Webhook URL
- Stripe Dashboard → Webhooks → Edit endpoint
- Change URL to: `https://your-production-domain.com/api/webhooks/stripe`

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
# ... (repeat for all variables in .env.local)

# Deploy
vercel --prod
```

### 4. Test in Production
- Use live Stripe card (real payment)
- Verify credits added
- Test photo restoration
- Check database for transaction records

---

## 🆘 Troubleshooting

### Atlas Gets Stuck

**Try:**
- Describe what you see to Atlas
- Guide it to correct location: "Click on Developers → API Keys"
- Manual override: "I'll get this key myself: [paste key]"

### Verification Script Fails

**Check:**
- `.env.local` exists in project root
- No syntax errors (extra quotes, spaces)
- All required variables have values
- Run with debug: `bash -x scripts/verify-env.sh`

### Database Connection Failed

**Check:**
- `DATABASE_URL` has correct password
- Supabase project is active (not paused)
- Test manually: `psql "$DATABASE_URL" -c "SELECT 1"`

### Payment Test Fails

**Check:**
- Stripe is in TEST MODE
- Using test card: 4242 4242 4242 4242
- Webhook is configured correctly
- Check browser console for errors

---

## 📚 Additional Resources

**Need more details?**
- Full Atlas prompt: `ATLAS_SETUP_PROMPT.md`
- Pro tips & best practices: `ATLAS_TIPS.md`
- Quick reference: `ATLAS_QUICK_START.md`
- Environment variables: `.env.example`
- Migration guide: `lib/supabase/migrations/README.md`
- System overview: `CURRENT_STATUS.md`

**Need help?**
- Check verification output for specific errors
- See `ATLAS_TIPS.md` troubleshooting section
- Review `SHIP_IT_GUIDE.md` for deployment help

---

## 🔒 Security Reminders

⚠️ **NEVER commit `.env.local` to Git** (it's already in .gitignore)

⚠️ **Keep these keys SECRET:**
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses database security
- `STRIPE_SECRET_KEY` - Full access to Stripe account
- `DATABASE_URL` - Contains database password

⚠️ **Stripe Test vs Live:**
- Test keys: `sk_test_*`, `pk_test_*`
- Live keys: `sk_live_*`, `pk_live_*`
- **NEVER mix test and live keys**

---

## 🎯 Success Criteria

You'll know everything worked when:

- ✅ Verification script shows all green ✓
- ✅ Database migrations applied (8 migrations)
- ✅ App runs on http://localhost:3000
- ✅ Can purchase 10 credits with test card
- ✅ Credits appear in account (10 → 9 after restoration)
- ✅ Photo restoration works
- ✅ No errors in browser console

---

**Ready to configure RetroPhoto in 20 minutes?**

**Just copy `ATLAS_SETUP_PROMPT.md` to Atlas Agent Mode and go!** 🚀

---

**Questions? Check the troubleshooting section above or see `ATLAS_TIPS.md` for advanced help.**
