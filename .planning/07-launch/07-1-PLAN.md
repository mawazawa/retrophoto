---
phase: 07-launch
plan: 1
type: execute
wave: 5
depends_on:
  - 06-1
files_modified: []
autonomous: false
user_setup:
  - Send beta invitation emails
must_haves:
  truths:
    - All Phase 01-06 verified and complete
    - Beta allowlist populated with tester emails
    - Beta invitations sent
    - 24-hour monitoring completed without critical issues
  artifacts:
    - .planning/07-launch/07-1-SUMMARY.md (launch report)
  key_links:
    - .planning/STATE.md
    - .planning/ROADMAP.md
---

<objective>
Execute the beta launch: final pre-launch verification, send invitations, and monitor for 24 hours.

Output artifacts:
- Pre-launch checklist completed
- Beta invitations sent
- 24-hour monitoring report
</objective>

<tasks>

<task type="checkpoint:human-verify">
  <name>Pre-launch verification checklist</name>
  <files>N/A</files>
  <action>
    Final verification before inviting users:

    Infrastructure:
    - [ ] Vercel production deployment is live and healthy
    - [ ] DNS propagated (dig retrophotoai.com returns Vercel IP)
    - [ ] SSL certificate valid (check browser padlock)
    - [ ] All env vars set in Vercel (no "undefined" in browser console)

    Services:
    - [ ] Stripe live mode webhook active (check Stripe Dashboard)
    - [ ] Sentry receiving events (trigger a test error)
    - [ ] Upstash Redis responding (check Upstash Console)
    - [ ] Replicate API accessible (test one restoration)
    - [ ] Supabase database healthy (check Dashboard)
    - [ ] Cron job scheduled (check Vercel Crons)

    Gating:
    - [ ] BETA_MODE_ENABLED=true
    - [ ] BETA_ALLOWED_EMAILS contains all beta tester emails
    - [ ] Non-allowlisted user cannot checkout (verified)

    Security:
    - [ ] CSRF rejects localhost in production (verified)
    - [ ] No credentials in source code (verified)
    - [ ] Price validation in webhook (verified)
    - [ ] Rate limiting active (verified)
  </action>
  <verify>
    All checklist items checked.
  </verify>
  <done>
    - Every item on the pre-launch checklist verified
    - No blockers remaining
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Send beta invitations and begin monitoring</name>
  <files>N/A</files>
  <action>
    1. Prepare invitation email:
       - Welcome to RetroPhoto beta
       - Sign-up link: https://retrophotoai.com
       - How it works: upload → restore → download
       - Pricing: 10 credits for $9.99
       - Optional: promo code for first purchase discount
       - Feedback channel (email, form, or Slack)

    2. Send to all beta testers on the allowlist

    3. Monitor for 24 hours:
       - [ ] Check Sentry every 4 hours for new errors
       - [ ] Check Stripe Dashboard for payment issues
       - [ ] Check Supabase Dashboard for database health
       - [ ] Check Vercel Analytics for response times
       - [ ] Respond to beta tester feedback within 4 hours
       - [ ] TTM metrics within SLO (≤6s p50, ≤12s p95)
  </action>
  <verify>
    After 24 hours:
    - No critical errors in Sentry
    - No payment failures in Stripe
    - Database healthy
    - At least one successful restoration by a beta tester
  </verify>
  <done>
    - Beta invitations sent
    - 24-hour monitoring completed
    - No critical issues discovered
    - Beta launch successful
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the beta to be successful?
  1. At least one beta tester completed a restoration
  2. At least one beta tester purchased credits
  3. No critical errors in the first 24 hours
  4. Response to any feedback within 4 hours
</verification>

<success_criteria>
  - Pre-launch checklist completed
  - Beta invitations sent
  - 24-hour monitoring shows no critical issues
  - Beta launch declared successful
</success_criteria>

<output>
  Save execution summary to: .planning/07-launch/07-1-SUMMARY.md
</output>
