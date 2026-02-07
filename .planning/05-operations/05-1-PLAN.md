---
phase: 05-operations
plan: 1
type: execute
wave: 3
depends_on:
  - 03-1
files_modified:
  - sentry.client.config.ts
  - sentry.server.config.ts
autonomous: true
user_setup:
  - Create Upstash Redis database (free tier)
  - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel
must_haves:
  truths:
    - Sentry sampling rates appropriate for production costs
    - Upstash Redis configured for distributed rate limiting
    - Rate limiter logs confirm Redis usage (not in-memory fallback)
  artifacts:
    - sentry.client.config.ts (patched)
    - sentry.server.config.ts (patched)
  key_links:
    - sentry.client.config.ts
    - sentry.server.config.ts
    - lib/rate-limit/index.ts
---

<objective>
Configure Sentry for cost-efficient production monitoring and set up Upstash Redis for distributed rate limiting.

Output artifacts:
- Patched Sentry configs with production-appropriate sampling
- Upstash Redis configured (manual dashboard step)
</objective>

<tasks>

<task type="auto">
  <name>Reduce Sentry sampling rates for production</name>
  <files>sentry.client.config.ts, sentry.server.config.ts</files>
  <action>
    In both files, change `tracesSampleRate` from `1.0` to `0.2` (20%).

    Keep `replaysOnErrorSampleRate` at `1.0` (capture all error sessions).
    Keep `replaysSessionSampleRate` at `0.1` (10% of general sessions).

    This reduces Sentry event volume by ~80% while maintaining full error visibility.

    In sentry.server.config.ts:
    - `tracesSampleRate: 0.2`

    In sentry.client.config.ts:
    - `tracesSampleRate: 0.2`
    - `replaysSessionSampleRate: 0.1` (keep)
    - `replaysOnErrorSampleRate: 1.0` (keep)
  </action>
  <verify>
    Run: `grep -n "tracesSampleRate" sentry.*.config.ts`
    Expected: shows 0.2 in both files
  </verify>
  <done>
    - Both Sentry configs use 20% transaction sampling
    - Error replay remains at 100%
    - Session replay remains at 10%
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Set up Upstash Redis for rate limiting</name>
  <files>N/A — Upstash Console</files>
  <action>
    1. Go to https://console.upstash.com/
    2. Create a new Redis database:
       - Name: retrophoto-ratelimit
       - Region: US-East-1 (closest to Vercel default region)
       - Type: Regional (free tier is sufficient for beta)
    3. Copy the REST URL and REST Token
    4. Set in Vercel Dashboard:
       - UPSTASH_REDIS_REST_URL [Sensitive]
       - UPSTASH_REDIS_REST_TOKEN [Sensitive]

    The rate limiter in `lib/rate-limit/index.ts` will auto-detect these
    env vars and switch from in-memory to Redis-backed limiting.
  </action>
  <verify>
    After deployment, check server logs for rate limiter initialization.
    Expected: "Using Upstash Redis" (not "Using in-memory fallback")

    Test: Hit /api/restore rapidly 6+ times.
    Expected: 429 response on exceeding limit.
    Wait 5+ minutes, try again.
    Expected: still rate limited (not reset by cold start).
  </verify>
  <done>
    - Upstash Redis database created
    - Env vars set in Vercel
    - Rate limiter uses Redis (confirmed via logs)
    - Rate limits persist across serverless cold starts
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for production monitoring and rate limiting to work?
  1. Sentry receives error events within 60 seconds of occurrence
  2. Sentry transaction volume is ~20% of total requests (not 100%)
  3. Rate limiter persists state across cold starts (Redis, not memory)
  4. Rate limiter correctly blocks excessive requests (429 response)
</verification>

<success_criteria>
  - Sentry sampling reduced to 20% transactions
  - Upstash Redis configured and verified
  - Rate limiting works across cold starts
</success_criteria>

<output>
  Save execution summary to: .planning/05-operations/05-1-SUMMARY.md
</output>
