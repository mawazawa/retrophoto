# ChatGPT Atlas Browser Agent - Complete RetroPhoto Configuration

**Purpose**: This prompt guides ChatGPT Atlas browser agent to automatically configure all API keys, create Stripe products, set up webhooks, and generate a complete `.env.local` file for RetroPhoto.

**Estimated Time**: 15-20 minutes
**Prerequisites**: User must be logged into all required accounts in Atlas browser

---

## 🤖 COPY THIS ENTIRE PROMPT TO ATLAS AGENT MODE

---

# RetroPhoto Production Configuration Task

I need you to help me configure a Next.js photo restoration app called RetroPhoto. You will extract API keys from multiple services, create a Stripe product, configure webhooks, and generate a complete `.env.local` file.

## Your Task Checklist

Complete these steps in order. Ask for approval at each checkpoint.

---

### PHASE 1: SUPABASE CONFIGURATION

**Navigate to**: https://supabase.com/dashboard

#### Step 1.1: Get API Keys
1. Click on my project (should be visible in dashboard)
2. Click "Project Settings" (gear icon in left sidebar)
3. Click "API" section
4. Extract these values:
   - **Project URL** (starts with https://)
   - **anon/public key** (long JWT token starting with eyJ)
   - **service_role key** (long JWT token - KEEP SECRET)
5. Store these as:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[Project URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
   SUPABASE_SERVICE_ROLE_KEY=[service_role key]
   ```

#### Step 1.2: Get Database Connection String
1. Still in Project Settings, click "Database" section
2. Scroll to "Connection string" section
3. Select "URI" tab (not "Connection pooling")
4. Copy the connection string that looks like:
   `postgresql://postgres.[ref]:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres`
5. Replace `[PASSWORD]` with the actual database password shown
6. Store as:
   ```
   DATABASE_URL=[full connection string with password]
   SUPABASE_DB_PASSWORD=[just the password part]
   ```

**Checkpoint**: Show me the extracted Supabase values (redact passwords but show structure).

---

### PHASE 2: STRIPE CONFIGURATION

**Navigate to**: https://dashboard.stripe.com

**IMPORTANT**: Make sure you're in **TEST MODE** (toggle in top right should say "Test mode").

#### Step 2.1: Get API Keys
1. Click "Developers" in top navigation
2. Click "API keys" in left sidebar
3. Extract these values:
   - **Secret key** (starts with `sk_test_`)
   - **Publishable key** (starts with `pk_test_`)
4. Store as:
   ```
   STRIPE_SECRET_KEY=[secret key]
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[publishable key]
   ```

#### Step 2.2: Create Product
1. Click "Products" in left sidebar (or go to https://dashboard.stripe.com/test/products)
2. Click "+ Add product" button
3. Fill in the form:
   - **Name**: `10 Photo Restoration Credits`
   - **Description**: `Purchase 10 credits to restore old photos. Credits expire 1 year after purchase.`
   - **Pricing model**: Select "Standard pricing"
   - **Price**: `9.99` USD
   - **Billing period**: One time
   - **Tax code**: Leave default or select "General - Electronically Supplied Services"
4. Click "Add product"
5. After creation, you'll see the product page
6. Look for "Pricing" section, find the **Price ID** (starts with `price_`)
7. Copy the Price ID
8. Store as:
   ```
   STRIPE_CREDITS_PRICE_ID=[price ID]
   ```

**Checkpoint**: Confirm product created and show me the Price ID.

#### Step 2.3: Create Webhook Endpoint
1. Click "Developers" → "Webhooks" (or go to https://dashboard.stripe.com/test/webhooks)
2. Click "+ Add endpoint" button
3. Fill in the form:
   - **Endpoint URL**: `https://[YOUR-VERCEL-DOMAIN].vercel.app/api/webhooks/stripe`
     - **NOTE**: Replace `[YOUR-VERCEL-DOMAIN]` with:
       - For local testing: `http://localhost:3000/api/webhooks/stripe` (use Stripe CLI forwarding)
       - For production: `https://your-actual-domain.com/api/webhooks/stripe`
   - **Description**: `RetroPhoto payment webhook`
   - **Events to send**: Click "Select events" and add:
     - `checkout.session.completed`
     - `charge.refunded`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
4. Click "Add endpoint"
5. After creation, click on the webhook you just created
6. Find the **Signing secret** (starts with `whsec_`)
7. Click "Reveal" if needed, then copy it
8. Store as:
   ```
   STRIPE_WEBHOOK_SECRET=[signing secret]
   ```

**Checkpoint**: Confirm webhook created and show me the signing secret (first 10 chars only).

---

### PHASE 3: AI PROVIDER APIS

#### Step 3.1: Replicate (REQUIRED)
1. Navigate to: https://replicate.com/account/api-tokens
2. If no token exists, click "Create token"
3. Copy the token (starts with `r8_`)
4. Store as:
   ```
   REPLICATE_API_TOKEN=[token]
   ```

#### Step 3.2: Anthropic (REQUIRED)
1. Navigate to: https://console.anthropic.com/settings/keys
2. If no key exists, click "Create Key"
   - Name it: "RetroPhoto Triage"
3. Copy the API key (starts with `sk-ant-`)
4. Store as:
   ```
   ANTHROPIC_API_KEY=[key]
   ```

#### Step 3.3: OpenAI (OPTIONAL - Phase 2)
1. Navigate to: https://platform.openai.com/api-keys
2. If creating new key, click "Create new secret key"
   - Name: "RetroPhoto GPT-5"
3. Copy the key (starts with `sk-proj-` or `sk-`)
4. Store as:
   ```
   OPENAI_API_KEY=[key]
   ```
5. **If user doesn't want to configure now, use empty value**

#### Step 3.4: Google AI (OPTIONAL - Phase 2)
1. Navigate to: https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key (starts with `AIza`)
4. Store as:
   ```
   GOOGLE_AI_API_KEY=[key]
   ```
5. **If user doesn't want to configure now, use empty value**

#### Step 3.5: X.AI / Grok (OPTIONAL - Phase 2)
1. Navigate to: https://console.x.ai/
2. Look for API keys section
3. Create key if needed
4. Store as:
   ```
   XAI_API_KEY=[key]
   ```
5. **If user doesn't want to configure now, use empty value**

#### Step 3.6: Groq (OPTIONAL - Phase 2)
1. Navigate to: https://console.groq.com/keys
2. Click "Create API Key"
   - Name: "RetroPhoto Quality Validator"
3. Copy the key (starts with `gsk_`)
4. Store as:
   ```
   GROQ_API_KEY=[key]
   ```
5. **If user doesn't want to configure now, use empty value**

**Checkpoint**: Confirm which AI providers were configured (list them).

---

### PHASE 4: GENERATE .ENV.LOCAL FILE

#### Step 4.1: Compile All Values
Using all the values you collected, create a complete `.env.local` file with this exact format:

```bash
# ============================================
# RetroPhoto Production Environment Variables
# ============================================
# Generated by ChatGPT Atlas Agent
# Date: [TODAY'S DATE]
# ============================================

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=[value from Step 1.1]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[value from Step 1.1]
SUPABASE_SERVICE_ROLE_KEY=[value from Step 1.1]
DATABASE_URL=[value from Step 1.2]
SUPABASE_DB_PASSWORD=[value from Step 1.2]

# STRIPE
STRIPE_SECRET_KEY=[value from Step 2.1]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[value from Step 2.1]
STRIPE_WEBHOOK_SECRET=[value from Step 2.3]
STRIPE_CREDITS_PRICE_ID=[value from Step 2.2]

# AI PROVIDERS (REQUIRED)
REPLICATE_API_TOKEN=[value from Step 3.1]
ANTHROPIC_API_KEY=[value from Step 3.2]

# AI PROVIDERS (OPTIONAL - Phase 2)
OPENAI_API_KEY=[value from Step 3.3 or leave empty]
GOOGLE_AI_API_KEY=[value from Step 3.4 or leave empty]
XAI_API_KEY=[value from Step 3.5 or leave empty]
GROQ_API_KEY=[value from Step 3.6 or leave empty]

# APPLICATION
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=[generate random string or leave for user]

# MONITORING (OPTIONAL)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

#### Step 4.2: Present the File
Show me the complete `.env.local` file content in a code block so I can copy it.

**Final Checkpoint**: Show me the complete file with all values filled in.

---

### PHASE 5: NEXT STEPS INSTRUCTIONS

After you've generated the `.env.local` file, provide me with these instructions:

```markdown
## ✅ Configuration Complete!

### Next Steps:

1. **Save the .env.local file**
   - Create a file called `.env.local` in your RetroPhoto project root
   - Copy and paste the content I provided above
   - Save the file

2. **Apply Database Migrations** (10 minutes)
   ```bash
   cd /path/to/retrophoto
   chmod +x scripts/apply-migrations-psql.sh
   ./scripts/apply-migrations-psql.sh
   ```

3. **Verify Migration**
   ```bash
   psql "$DATABASE_URL" -c "\dt"  # Should show 8 tables
   psql "$DATABASE_URL" -c "\df"  # Should show 4 functions
   ```

4. **Test Local Development**
   ```bash
   npm install
   npm run dev
   ```
   Visit: http://localhost:3000

5. **Test Payment Flow**
   - Go to the app
   - Try to purchase credits
   - Use Stripe test card: `4242 4242 4242 4242`
   - Verify credits appear in your account

6. **Deploy to Production**
   ```bash
   # Add environment variables to Vercel
   vercel env add [variable-name] production
   # ... repeat for all variables

   # Deploy
   vercel --prod
   ```

7. **Update Webhook URL** (if deploying to production)
   - Go back to Stripe Dashboard → Webhooks
   - Update endpoint URL to production domain
   - Keep the signing secret the same
```

---

## 🎯 Success Criteria

You will have successfully completed this task when:

- ✅ All Supabase credentials extracted
- ✅ All Stripe API keys extracted
- ✅ Stripe product "10 Photo Restoration Credits" created at $9.99
- ✅ Stripe webhook configured for RetroPhoto endpoints
- ✅ All required AI provider API keys extracted (Replicate + Anthropic)
- ✅ Complete `.env.local` file generated with all values
- ✅ Next steps instructions provided

---

## ⚠️ Important Security Notes

**Remind me to:**
1. NEVER commit `.env.local` to Git (it's already in `.gitignore`)
2. Keep `SUPABASE_SERVICE_ROLE_KEY` secret (bypasses Row Level Security)
3. Keep `STRIPE_SECRET_KEY` secret (full access to Stripe account)
4. Switch Stripe from "Test mode" to "Live mode" only when ready for production
5. Update webhook URL when deploying to production

---

## 🆘 If You Encounter Issues

**Atlas Agent Limitations:**
- If you cannot create files directly, just show me the content and I'll save it manually
- If you need me to confirm login credentials, pause and ask me
- If any API dashboard has changed layout, describe what you see and ask for guidance
- If a service requires 2FA, I'll need to handle that step manually

**Common Issues:**
- **Can't find API keys**: Look for "Settings", "Developers", "API Keys", or "Integrations" sections
- **Stripe product creation fails**: Make sure you're in Test Mode
- **Webhook URL unknown**: Use `http://localhost:3000/api/webhooks/stripe` for now, we'll update later

---

## 📊 Progress Tracking

As you complete each phase, update me with:
```
✅ Phase 1: Supabase - Complete
✅ Phase 2: Stripe - Complete
⏳ Phase 3: AI Providers - In Progress
⏸️ Phase 4: Generate File - Pending
⏸️ Phase 5: Instructions - Pending
```

---

**Start now and ask for confirmation at each checkpoint!**

---

# END OF ATLAS PROMPT
