---
phase: 05-operations
plan: 2
type: execute
wave: 3
depends_on:
  - 03-1
files_modified: []
autonomous: false
user_setup:
  - Run database migrations on production Supabase
  - Configure custom domain in Vercel
  - Upgrade Supabase to Pro plan
must_haves:
  truths:
    - All 8 database migrations applied to production
    - All tables and RPC functions exist in production database
    - Custom domain resolves with SSL
    - Supabase on Pro plan (not free tier)
  artifacts: []
  key_links:
    - lib/supabase/migrations/
    - scripts/apply-migrations.sh
---

<objective>
Apply database migrations to production, configure the custom domain, and upgrade Supabase. These are manual operations that establish the production data layer and public endpoint.

Output artifacts:
- Production database with all tables and functions
- Custom domain configured with SSL
- Supabase Pro plan active
</objective>

<tasks>

<task type="checkpoint:human-verify">
  <name>Upgrade Supabase to Pro plan</name>
  <files>N/A — Supabase Dashboard</files>
  <action>
    1. Go to Supabase Dashboard → Project Settings → Billing
    2. Upgrade from Free to Pro ($25/month)
    3. Enable point-in-time recovery (backups)
    4. Note the connection string (needed for migrations)
    5. Enable MFA on your Supabase account if not already enabled
  </action>
  <verify>
    Supabase Dashboard → Settings → shows "Pro" plan.
    Backups section shows recent backup or "Enabled".
  </verify>
  <done>
    - Supabase on Pro plan
    - Backups enabled
    - MFA enabled on admin account
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Apply database migrations to production</name>
  <files>lib/supabase/migrations/010-017</files>
  <action>
    1. Set DATABASE_URL to production Supabase connection string
    2. Run: `bash scripts/apply-migrations.sh`
    3. Alternatively, run each migration manually in Supabase SQL Editor:
       - 010_create_user_credits.sql
       - 011_credit_batches.sql
       - 012_payment_transactions.sql
       - 013_stripe_webhook_events.sql
       - 014_payment_refunds.sql
       - 015_extend_user_credits.sql
       - 016_database_functions.sql
       - 017_extend_upload_sessions.sql

    4. Verify tables exist:
       ```sql
       SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name;
       ```

    5. Verify RPC functions exist:
       ```sql
       SELECT routine_name FROM information_schema.routines
       WHERE routine_schema = 'public'
       ORDER BY routine_name;
       ```

    6. Verify RLS is enabled:
       ```sql
       SELECT tablename, rowsecurity FROM pg_tables
       WHERE schemaname = 'public';
       ```
  </action>
  <verify>
    All tables listed in schema overview exist.
    All RPC functions (check_quota, add_credits, deduct_credit, process_refund, expire_credits) exist.
    RLS enabled on all tables (rowsecurity = true).
  </verify>
  <done>
    - All 8 migrations applied
    - All tables exist
    - All RPC functions exist
    - RLS enabled on all tables
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Configure custom domain and DNS</name>
  <files>N/A — Vercel Dashboard + DNS provider</files>
  <action>
    1. Vercel Dashboard → Project Settings → Domains
    2. Add: retrophotoai.com
    3. Add: www.retrophotoai.com (redirect to apex)
    4. Configure DNS at your registrar:
       - A record: retrophotoai.com → 76.76.21.21 (Vercel)
       - CNAME: www.retrophotoai.com → cname.vercel-dns.com
    5. Wait for DNS propagation (usually 5-30 minutes)
    6. Verify SSL auto-provisioned
  </action>
  <verify>
    Run: `curl -I https://retrophotoai.com`
    Expected: HTTP/2 200, includes Strict-Transport-Security header

    Run: `curl -I https://www.retrophotoai.com`
    Expected: 301/308 redirect to https://retrophotoai.com
  </verify>
  <done>
    - retrophotoai.com resolves to Vercel deployment
    - www redirects to apex
    - SSL active (HTTPS works)
    - HSTS header present
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the production data layer and endpoint to work?
  1. Database has all tables and functions
  2. RLS prevents unauthorized data access
  3. Domain resolves with SSL
  4. Supabase won't pause for inactivity (Pro plan)
</verification>

<success_criteria>
  - All migrations applied, all tables/functions verified
  - Custom domain active with SSL
  - Supabase on Pro plan with backups
</success_criteria>

<output>
  Save execution summary to: .planning/05-operations/05-2-SUMMARY.md
</output>
