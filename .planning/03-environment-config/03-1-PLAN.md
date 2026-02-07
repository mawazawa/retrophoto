---
phase: 03-environment-config
plan: 1
type: execute
wave: 2
depends_on:
  - 01-1
  - 01-2
files_modified:
  - vercel.json
autonomous: false
user_setup:
  - Set all environment variables in Vercel Dashboard (see checklist below)
  - Create Stripe live mode product and price
  - Create Stripe live mode webhook endpoint
must_haves:
  truths:
    - All required env vars set in Vercel production environment
    - Stripe live webhook endpoint active and receiving events
    - Stripe live mode product/price created with correct ID
    - Vercel cron job scheduled for credit expiration
  artifacts:
    - vercel.json (new — cron configuration)
  key_links:
    - .planning/STATE.md
    - scripts/verify-env.sh
---

<objective>
Configure the production environment: Vercel env vars, Stripe live mode, and scheduled cron.

This plan is partially manual (Vercel Dashboard, Stripe Dashboard) and partially automated (vercel.json creation). The checklist below guides the manual steps.

Output artifacts:
- `vercel.json` with cron configuration
- Verified Vercel environment variables
- Active Stripe live webhook endpoint
</objective>

<tasks>

<task type="checkpoint:human-verify">
  <name>Set Vercel environment variables</name>
  <files>N/A — Vercel Dashboard</files>
  <action>
    Open Vercel Dashboard → Project Settings → Environment Variables → Production.
    Set each variable (mark secrets as Sensitive):

    Required:
    - [ ] NEXT_PUBLIC_SUPABASE_URL (production Supabase URL)
    - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (production anon key)
    - [ ] SUPABASE_SERVICE_ROLE_KEY [Sensitive]
    - [ ] REPLICATE_API_TOKEN [Sensitive]
    - [ ] STRIPE_SECRET_KEY (sk_live_...) [Sensitive]
    - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)
    - [ ] STRIPE_WEBHOOK_SECRET (whsec_... from live endpoint) [Sensitive]
    - [ ] STRIPE_CREDITS_PRICE_ID (live mode price ID)
    - [ ] NEXT_PUBLIC_BASE_URL (https://retrophotoai.com)
    - [ ] CRON_SECRET (random 32+ char string) [Sensitive]
    - [ ] BETA_MODE_ENABLED (true)
    - [ ] BETA_ALLOWED_EMAILS (comma-separated beta tester emails)

    Optional but recommended:
    - [ ] SENTRY_DSN
    - [ ] NEXT_PUBLIC_SENTRY_DSN
    - [ ] SENTRY_ORG
    - [ ] SENTRY_PROJECT
    - [ ] STRIPE_EXPECTED_AMOUNT (999)
    - [ ] STRIPE_EXPECTED_CURRENCY (usd)
  </action>
  <verify>
    Confirm each checkbox above is checked.
    Run verify-env.sh against production if possible.
  </verify>
  <done>
    - All required env vars set in Vercel production
    - Sensitive values marked as Sensitive
    - BETA_MODE_ENABLED set to true
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Configure Stripe live mode</name>
  <files>N/A — Stripe Dashboard</files>
  <action>
    1. Create live mode product:
       Stripe Dashboard → Products → + Add product
       Name: "RetroPhoto Credits"
       Price: $9.99 one-time
       Note the Price ID (starts with price_)

    2. Create live mode webhook:
       Stripe Dashboard → Developers → Webhooks → + Add endpoint
       URL: https://retrophotoai.com/api/webhooks/stripe
       Events: checkout.session.completed, payment_intent.succeeded,
               payment_intent.payment_failed, charge.refunded
       Note the Signing Secret (starts with whsec_)

    3. Send test webhook from Stripe Dashboard:
       Click "Send test webhook" → select checkout.session.completed
       Verify 200 response
  </action>
  <verify>
    Stripe Dashboard → Webhooks → endpoint shows "Active" status.
    Test webhook returns 200.
  </verify>
  <done>
    - Live mode product created with correct price
    - Live webhook endpoint active and tested
    - Price ID and webhook secret saved to Vercel env vars
  </done>
</task>

<task type="auto">
  <name>Create vercel.json with cron configuration</name>
  <files>vercel.json</files>
  <action>
    Create `vercel.json` at project root:

    ```json
    {
      "crons": [
        {
          "path": "/api/cron/expire-credits",
          "schedule": "0 3 * * *"
        }
      ]
    }
    ```

    This schedules credit expiration to run daily at 3:00 AM UTC.
    The endpoint already exists and validates the CRON_SECRET Bearer token.

    Do NOT add other Vercel configuration (headers, redirects, etc.) —
    these are handled by next.config.ts and middleware.ts.
  </action>
  <verify>
    Run: `cat vercel.json | python3 -m json.tool`
    Expected: valid JSON with crons array
  </verify>
  <done>
    - vercel.json exists with daily cron at 3 AM UTC
    - JSON is valid
    - No other configuration added (keep minimal)
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the production environment to be ready?
  1. Deploying to Vercel succeeds (all required env vars present)
  2. Stripe live webhook receives test event and returns 200
  3. Cron job appears in Vercel Dashboard → Crons
  4. BETA_MODE_ENABLED=true gates checkout
</verification>

<success_criteria>
  - All env vars set in Vercel Dashboard
  - Stripe live mode webhook tested and active
  - vercel.json created with cron configuration
  - No configuration conflicts with next.config.ts
</success_criteria>

<output>
  Save execution summary to: .planning/03-environment-config/03-1-SUMMARY.md
</output>
