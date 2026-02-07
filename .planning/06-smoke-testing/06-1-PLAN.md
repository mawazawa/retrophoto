---
phase: 06-smoke-testing
plan: 1
type: execute
wave: 4
depends_on:
  - 05-1
  - 05-2
files_modified: []
autonomous: false
user_setup: []
must_haves:
  truths:
    - Free tier flow works end-to-end in production
    - Payment flow works end-to-end in production
    - Auth flow works end-to-end in production
    - E2E test suite passes against production
  artifacts:
    - .planning/06-smoke-testing/06-1-SUMMARY.md (test results)
  key_links:
    - tests/e2e/
---

<objective>
Validate every critical user path in the production environment. This is the final gate before inviting beta testers. Manual smoke tests first, then automated E2E suite.

Output artifacts:
- Completed smoke test checklists
- Playwright HTML test report
</objective>

<tasks>

<task type="checkpoint:human-verify">
  <name>Smoke test: Free tier flow</name>
  <files>N/A — browser testing</files>
  <action>
    Open https://retrophotoai.com in an incognito window. Test:

    - [ ] Landing page loads in under 3 seconds
    - [ ] Click "Try Free" or equivalent CTA → navigates to /app
    - [ ] Upload a photo (drag-drop or file picker) — use a real old photo
    - [ ] Restoration completes (progress indicator visible, result appears)
    - [ ] Time from upload to result ≤12 seconds
    - [ ] Before/after comparison slider works (drag left/right)
    - [ ] Zoom viewer works (pinch to zoom on mobile or scroll on desktop)
    - [ ] Share button works (generates shareable link)
    - [ ] Result page loads at the shared URL
    - [ ] Second restoration attempt shows "Quota Exceeded" with upgrade prompt
    - [ ] Mobile layout correct (test on phone or device emulator)
  </action>
  <verify>
    All checklist items above checked.
  </verify>
  <done>
    - Free tier works end-to-end
    - Performance within SLO
    - Mobile layout correct
    - Quota enforcement works
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Smoke test: Payment and auth flow</name>
  <files>N/A — browser testing</files>
  <action>
    Test authentication:
    - [ ] Sign up with a beta-allowlisted email
    - [ ] Email verification received
    - [ ] Click verification link → authenticated
    - [ ] User menu shows email and sign-out option

    Test payment (use a real card with small amount or Stripe test coupon):
    - [ ] Click "Buy Credits" → Stripe Checkout loads
    - [ ] Complete purchase
    - [ ] Redirected back to app with success message
    - [ ] Credit balance shows 10 credits
    - [ ] Restore a photo → credits decrease by 1
    - [ ] Check Supabase: stripe_webhook_events has the event
    - [ ] Check Supabase: user_credits shows correct balance

    Test beta gating:
    - [ ] Sign in as a NON-allowlisted user
    - [ ] Attempt to purchase → see waitlist message or 403
    - [ ] Free tier still works for this user

    Test sign out:
    - [ ] Sign out → returned to landing page
    - [ ] Sign in again → session restored, credits preserved
  </action>
  <verify>
    All checklist items above checked.
  </verify>
  <done>
    - Auth flow works end-to-end
    - Payment flow works end-to-end
    - Credits system works (add, deduct, persist)
    - Beta gating works
  </done>
</task>

<task type="auto">
  <name>Run E2E test suite against production</name>
  <files>tests/e2e/</files>
  <action>
    Run the Playwright E2E suite against the production URL:

    ```bash
    TEST_EMAIL=<beta_email> TEST_PASSWORD=<beta_password> npm run test:e2e:prod
    ```

    This runs all E2E specs against https://retrophotoai.com with 5 device profiles.

    If tests fail:
    1. Capture the HTML report
    2. Document failures in the summary
    3. Categorize as: blocking (must fix before launch) or non-blocking (can fix post-launch)
  </action>
  <verify>
    Playwright HTML report shows test results.
    Document pass/fail count in summary.
  </verify>
  <done>
    - E2E suite executed against production
    - Results documented
    - Blocking failures identified (if any)
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the product to be safe for beta testers?
  1. A new user can upload a photo and see the restored result
  2. A paying user can purchase credits and use them
  3. A non-invited user cannot purchase but can try free tier
  4. No JavaScript errors in the browser console
  5. No 500 errors in the server logs
  6. Performance within SLO (≤12s TTM p95)
</verification>

<success_criteria>
  - All manual smoke test checklists completed
  - E2E test suite results documented
  - No blocking failures remaining
  - Product ready for beta testers
</success_criteria>

<output>
  Save execution summary to: .planning/06-smoke-testing/06-1-SUMMARY.md
</output>
