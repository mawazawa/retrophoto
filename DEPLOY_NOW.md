# 🚀 DEPLOYMENT GUIDE - Ship RetroPhoto NOW!

**Current Status**: ✅ All code ready, all bugs fixed
**Time to Production**: 20 minutes
**Let's GO!** 💰

---

## 🎯 FASTEST PATH TO PRODUCTION (20 min total)

### Step 1: Deploy to Vercel (2 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from current branch (it's ready!)
vercel --prod
```

Vercel will give you a URL like: `https://retrophoto.vercel.app`

**Write this URL down!** You'll need it for Stripe webhook.

---

### Step 2: Use Atlas to Configure Everything (15 min) ⚡

**This is THE FASTEST way!**

1. Open ChatGPT Atlas browser
2. Log into these accounts:
   - Supabase (https://supabase.com)
   - Stripe (https://stripe.com) - Switch to TEST MODE
   - Replicate (https://replicate.com)
   - Anthropic (https://console.anthropic.com)

3. Copy the ENTIRE contents of `ATLAS_SETUP_PROMPT.md`
4. Paste into Atlas Agent Mode
5. Let Atlas extract all keys and generate `.env.local`
6. Save the `.env.local` file
7. Add each variable to Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # ... (repeat for all variables from .env.local)
   ```

**Atlas will**:
- ✅ Extract all API keys automatically
- ✅ Create Stripe product ($9.99 for 10 credits)
- ✅ Create Stripe webhook
- ✅ Generate complete .env.local file

---

### Step 3: Apply Database Migrations (3 min)

```bash
# Set DATABASE_URL from Atlas output
export DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Apply all migrations
./scripts/apply-migrations-psql.sh
```

Should see:
```
✓ 010_create_user_credits.sql applied successfully
✓ 011_credit_batches.sql applied successfully
... (8 migrations)
🎉 All new migrations applied successfully!
```

---

### Step 4: Redeploy with Environment Variables (1 min)

```bash
vercel --prod
```

---

### Step 5: Test Payment Flow (2 min)

1. Visit: `https://your-vercel-url.vercel.app`
2. Click "Buy 10 Credits"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect to `/app?success=true` ✅
6. Check Stripe Dashboard → Payments (should see $9.99)
7. Check database: `SELECT * FROM user_credits;` (should see 10 credits)

---

### Step 6: Go LIVE! (2 min)

Once testing works:

1. **Switch Stripe to Live Mode**:
   - Toggle in Stripe Dashboard (top right)
   - Get live API keys from: https://dashboard.stripe.com/apikeys
   - Update in Vercel:
     ```bash
     vercel env add STRIPE_SECRET_KEY production
     # (paste live key: sk_live_...)
     
     vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
     # (paste live key: pk_live_...)
     ```

2. **Update Stripe Webhook to Live Mode**:
   - Stripe Dashboard → Webhooks (in Live Mode)
   - Click on your webhook
   - Get new signing secret
   - Update in Vercel:
     ```bash
     vercel env add STRIPE_WEBHOOK_SECRET production
     # (paste new signing secret)
     ```

3. **Final Deploy**:
   ```bash
   vercel --prod
   ```

---

## ✅ YOU'RE LIVE AND MAKING MONEY! 💰

**What's working**:
- ✅ Landing page with CTA buttons
- ✅ /app page for photo upload
- ✅ Free tier (1 photo for guests)
- ✅ Credit purchase ($9.99 for 10 credits)
- ✅ Payment success messages
- ✅ Credit balance display
- ✅ Photo restoration with credit deduction
- ✅ Guest and authenticated user support

**Revenue potential**: $3,600-$6,000/year from 1000 monthly visitors

---

## 🎯 QUICK START (Copy-Paste Commands)

```bash
# 1. Deploy
npm install -g vercel
vercel login
vercel --prod

# 2. Use Atlas to get env vars (see ATLAS_SETUP_PROMPT.md)

# 3. Add env vars to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_CREDITS_PRICE_ID production
vercel env add REPLICATE_API_TOKEN production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add CRON_SECRET production

# 4. Apply migrations
export DATABASE_URL="postgresql://..."
./scripts/apply-migrations-psql.sh

# 5. Redeploy
vercel --prod

# 6. Test with card: 4242 4242 4242 4242

# 7. Switch Stripe to Live Mode & redeploy

# 8. START MAKING MONEY! 🚀
```

---

## 🆘 Troubleshooting

### Deployment fails
- Check `vercel logs` for errors
- Verify all env vars are set
- Make sure you're on Node.js 18+

### Database connection fails
- Double-check DATABASE_URL password
- Verify Supabase project is active
- Test: `psql "$DATABASE_URL" -c "SELECT 1"`

### Stripe webhook not working
- Verify webhook URL is correct
- Check signing secret matches
- Look at Stripe Dashboard → Webhooks → Events

### Upload returns 500 error
- Check migrations applied: `psql "$DATABASE_URL" -c "\dt"`
- Check env vars set: `vercel env ls`
- Check Vercel logs: `vercel logs`

---

## 📞 Support

- Detailed review: `PRODUCTION_READINESS_REVIEW.md`
- Atlas guide: `ATLAS_SETUP_PROMPT.md`
- Quick start: `START_HERE_ATLAS.md`
- Migration guide: `lib/supabase/migrations/README.md`

---

**EVERYTHING IS READY! Just follow these steps and you'll be live in 20 minutes!** 🎉

**LET'S SHIP IT!** 🚀💰
