# ChatGPT Atlas Browser Agent - Pro Tips & Best Practices

**Purpose**: Maximize success rate and efficiency when using Atlas browser agent for RetroPhoto configuration.

---

## 🎯 Before You Start

### 1. Prepare Your Browser Environment

**In Atlas Browser:**
- Clear cookies/cache for clean slate
- Log into all required accounts BEFORE starting agent
- Keep all dashboard tabs open in background
- Disable browser extensions that might interfere (password managers, ad blockers)

**Accounts to pre-login:**
1. Supabase (https://supabase.com)
2. Stripe (https://stripe.com) - Switch to TEST MODE
3. Replicate (https://replicate.com)
4. Anthropic (https://console.anthropic.com)
5. Optional: OpenAI, Google AI Studio, X.AI, Groq

### 2. Prepare Your Environment

**Create these files first:**
```bash
cd /path/to/retrophoto
touch .env.local  # Empty file, Atlas will fill it
```

**Have ready:**
- Text editor for saving .env.local
- Terminal window for running verification
- Notepad for copying API keys (backup)

---

## ✅ Best Practices for Atlas Agent

### Checkpoint Strategy

Atlas will ask for approval at key points. When it does:

✅ **DO:**
- Review what Atlas extracted
- Verify API keys look correct (check format)
- Confirm products were created correctly
- Take screenshots of important steps
- Keep a backup copy of keys in secure location

❌ **DON'T:**
- Rush through checkpoints
- Skip verification steps
- Approve without checking values
- Close browser tabs mid-process

### Communication with Atlas

**Clear commands work best:**

✅ **Good:**
> "Continue to next phase"
> "That looks correct, proceed"
> "I've completed 2FA, continue"

❌ **Avoid:**
> "ok" (too vague)
> "looks good maybe?" (uncertain)
> "do whatever" (unclear instruction)

### Handling Errors

**If Atlas gets stuck:**

1. **Describe the issue:**
   > "I see a different layout than you expected"
   > "The API key is in a different location"

2. **Provide guidance:**
   > "The API keys are under Settings → Developers"
   > "Click on the 'Keys' tab first"

3. **Manual override:**
   > "I'll extract this one manually. Here's the key: sk_test_xxx"
   > "Skip this optional provider for now"

---

## 🔒 Security Best Practices

### API Key Handling

**When Atlas displays keys:**
- ✅ Copy to secure password manager immediately
- ✅ Verify format (sk_test_, eyJ, r8_, etc.)
- ✅ Check length (JWT tokens are ~200+ chars)
- ❌ Don't paste in chat/email
- ❌ Don't screenshot and share publicly
- ❌ Don't store in plain text files outside .env.local

### Test vs Live Mode

**For Stripe:**
- ✅ Use TEST MODE during development (keys start with `sk_test_`, `pk_test_`)
- ✅ Create test products (they don't cost money)
- ✅ Test with card 4242 4242 4242 4242
- ❌ Don't switch to Live Mode until production-ready
- ❌ Don't mix test and live keys

### Service Role Keys

**Supabase service_role key:**
- ⚠️ NEVER expose to client-side code
- ⚠️ Bypasses Row Level Security
- ✅ Only use in server-side code
- ✅ Keep in .env.local (server-only)

---

## 🚀 Optimization Tips

### Speed Up Configuration

**Parallel preparation:**
1. While Atlas navigates Supabase, open Stripe in another tab
2. Pre-create accounts before starting
3. Have 2FA codes ready
4. Use password manager for quick logins

**Skip optional providers initially:**
- Focus on required APIs first (Supabase, Stripe, Replicate, Anthropic)
- Add optional providers later (OpenAI, Google, etc.)
- Tell Atlas: "Skip optional providers, we'll add them later"

### Reduce Errors

**Common pitfalls to avoid:**
- Don't switch between projects mid-configuration
- Don't log out of accounts while Atlas is working
- Don't close browser tabs Atlas is using
- Don't navigate away from pages before Atlas is done

---

## 🐛 Troubleshooting Guide

### Problem: Atlas Can't Find API Keys

**Solutions:**
1. **Dashboard layout changed:**
   - Tell Atlas what you see: "I see Settings, but no API section"
   - Guide it: "Click on 'Developers' in the left sidebar"

2. **Need to scroll:**
   - "Scroll down to find Connection String section"
   - "API keys are below the fold"

3. **Manual fallback:**
   - Extract the key yourself
   - Tell Atlas: "Here's the key: [paste key]"
   - Continue to next step

### Problem: Atlas Creates Wrong Product

**Solutions:**
1. **Delete and recreate:**
   - Stripe Dashboard → Products → Delete test product
   - Tell Atlas: "Let's try creating the product again"

2. **Manual creation:**
   - Create product manually following specs
   - Tell Atlas: "Product created, here's the price ID: price_xxx"

### Problem: 2FA/MFA Interrupts Flow

**Solutions:**
1. **Complete 2FA:**
   - Approve the 2FA request
   - Tell Atlas: "2FA completed, continue"

2. **Disable temporarily:**
   - If possible, disable 2FA for duration of setup
   - Re-enable immediately after
   - **NEVER leave 2FA disabled**

### Problem: Atlas Can't Create .env.local File

**Expected behavior:**
- Atlas cannot write to filesystem directly
- It will show you the content instead

**Solution:**
1. Copy the entire file content Atlas shows
2. Create `.env.local` manually:
   ```bash
   nano .env.local
   # Paste content
   # Save with Ctrl+O, Exit with Ctrl+X
   ```

---

## 📋 Verification Checklist

After Atlas completes, verify:

### Supabase
- [ ] URL starts with `https://` and ends with `.supabase.co`
- [ ] Anon key starts with `eyJ`
- [ ] Service key starts with `eyJ`
- [ ] DATABASE_URL starts with `postgresql://`
- [ ] Can connect: `psql "$DATABASE_URL" -c "SELECT 1"`

### Stripe
- [ ] Secret key starts with `sk_test_` (test mode)
- [ ] Publishable key starts with `pk_test_` (test mode)
- [ ] Webhook secret starts with `whsec_`
- [ ] Price ID starts with `price_`
- [ ] Product shows in dashboard at $9.99

### AI Providers
- [ ] Replicate token starts with `r8_`
- [ ] Anthropic key starts with `sk-ant-`
- [ ] Optional keys either empty or valid format

### File Structure
- [ ] `.env.local` exists in project root
- [ ] `.env.local` is in `.gitignore`
- [ ] No syntax errors (no extra quotes, spaces)
- [ ] All required variables present
- [ ] Run: `./scripts/verify-env.sh` passes

---

## 🎓 Advanced Tips

### Custom Prompts

You can modify `ATLAS_SETUP_PROMPT.md` to:
- Skip optional providers entirely
- Add custom environment variables
- Change Stripe product pricing
- Add more webhook events

### Batch Processing

If configuring multiple projects:
1. Use Atlas to extract keys once
2. Save to password manager
3. Reuse keys for multiple projects (same Supabase project)

### Backup Strategy

**Save to secure location:**
```bash
# Encrypt .env.local for backup
gpg -c .env.local  # Creates .env.local.gpg
# Store .env.local.gpg in secure backup
rm .env.local  # Never store plain text in backup
```

---

## 🔄 Re-running Atlas

**If you need to reconfigure:**

1. **Partial re-run:**
   ```markdown
   Skip Phases 1-3, only regenerate Phase 4 with these updated values:
   - STRIPE_CREDITS_PRICE_ID=[new-price-id]
   ```

2. **Complete re-run:**
   - Delete `.env.local`
   - Run full prompt again
   - Atlas will extract fresh keys

3. **Switch to production:**
   - Modify prompt to specify "Live Mode" instead of "Test Mode"
   - Run again to get production keys
   - Update webhook URL to production domain

---

## 📊 Success Metrics

**You know Atlas succeeded when:**

1. **Verification passes:**
   ```bash
   ./scripts/verify-env.sh
   # All checks ✓
   ```

2. **Database connects:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1"
   # Returns: 1
   ```

3. **App starts:**
   ```bash
   npm run dev
   # Server running on http://localhost:3000
   ```

4. **Payment test works:**
   - Purchase 10 credits with test card
   - Credits appear in account
   - No errors in console

---

## 📞 When to Manual Override

**Use manual configuration if:**
- Atlas gets stuck after 3 attempts
- Dashboard UI significantly changed
- Need custom product configuration
- Dealing with enterprise accounts (different UIs)
- Time-sensitive (faster to do manually)

**Manual steps:**
1. Follow `SHIP_IT_GUIDE.md` instead
2. Use `.env.example` as template
3. Extract keys manually from dashboards
4. Create Stripe product via UI
5. Run `./scripts/verify-env.sh` to verify

---

## 🆘 Emergency Rollback

**If something goes wrong:**

1. **Stop Atlas immediately**
2. **Check what was created:**
   - Stripe Dashboard → Products (delete test products)
   - Stripe Dashboard → Webhooks (delete test webhooks)
   - Don't delete API keys (they're reusable)

3. **Start fresh:**
   - Delete `.env.local`
   - Clear browser cache
   - Re-login to all accounts
   - Run Atlas prompt again

---

## 💡 Pro Tips from Real Usage

1. **Have Stripe CLI ready** for testing webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Use environment-specific .env files:**
   - `.env.local` - Local development
   - `.env.production` - Production (Vercel will use this)

3. **Test immediately after configuration:**
   - Don't wait until deployment
   - Catch errors early
   - Verify webhooks work locally first

4. **Document any custom changes:**
   - If you modify product pricing
   - If you add custom metadata
   - If you change webhook events

---

**Ready to configure RetroPhoto in 15 minutes?** 🚀

Use these tips alongside `ATLAS_SETUP_PROMPT.md` for optimal results!
