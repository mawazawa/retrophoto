# Research — Production Deployment Best Practices (February 2026)

> Compiled from 4 parallel research agents. All sources verified for recency.

## Next.js 15.5 Production

**Critical**: CVE-2025-55182 "React2Shell" RCE vulnerability (CVSS 10.0) patched in 15.5.9. RetroPhoto already at `^15.5.9` — no action needed.

**Caching change**: Next.js 15 changed from cached-by-default to uncached-by-default for GET routes and client router cache. Opt in with `cache: 'force-cache'` or `next: { revalidate }`.

**Production checklist items**:
- Server Components by default (no client JS overhead)
- Error boundaries with meaningful fallbacks
- Lighthouse audits before launch
- TypeScript strict mode throughout

**Source**: [nextjs.org/docs/app/guides/production-checklist](https://nextjs.org/docs/app/guides/production-checklist)

## Supabase Production

**Plan**: Pro ($25/mo) minimum. Free tier pauses projects for inactivity.
**RLS**: Must be enabled on ALL public tables. Views bypass RLS by default.
**Connection pooling**: Supavisor, transaction mode on port 6543 for serverless.
**Rate limits**: Review auth rate limits. Contact support 2 weeks before high-load events.

**Source**: [supabase.com/docs/guides/deployment/going-into-prod](https://supabase.com/docs/guides/deployment/going-into-prod)

## Stripe Live Mode

**Key rule**: Test-mode objects (products, prices) do NOT exist in live mode. Must recreate.
**Webhook best practices**: Subscribe only to needed events. Respond 200 within 5 seconds. Implement idempotency.
**Retry behavior**: 3 days of exponential backoff. After that, endpoint is disabled.

**Source**: [docs.stripe.com/get-started/checklist/go-live](https://docs.stripe.com/get-started/checklist/go-live)

## Vercel Production

**5 pillars**: Operational excellence, security, reliability, performance, cost optimization.
**Env vars**: Mark secrets as "Sensitive". Set per environment (Production/Preview/Development).
**Domains**: Auto-SSL. Add via dashboard, configure DNS (A or CNAME).
**Cron**: Requires vercel.json. Pro plan ($20/mo) or higher.

**Source**: [vercel.com/docs/production-checklist](https://vercel.com/docs/production-checklist)

## Sentry + Next.js 15

**Current SDK**: @sentry/nextjs 10.38.0 (Feb 2026)
**Production sampling**: 10-20% transactions, 100% error replays, 10% session replays
**Source maps**: Use `withSentryConfig` wrapper, `widenClientFileUpload: true`

**Source**: [docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Upstash Redis

**Current SDK**: @upstash/ratelimit 2.0.8
**Why**: HTTP-based, no connection pooling needed, pay-per-request
**Algorithms**: Fixed window, sliding window, token bucket
**Tip**: Ephemeral cache for DDoS protection (saves Redis calls)

**Source**: [upstash.com/docs/redis/sdks/ratelimit-ts/overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)

## Replicate (SwinIR)

**Stats**: 6.2M+ runs, ~4s average run time
**Production**: Consider Deployments for dedicated hardware (eliminates cold boots)
**Rate limits**: Vary by plan. Implement exponential backoff (already done via p-retry)

**Source**: [replicate.com/jingyunliang/swinir](https://replicate.com/jingyunliang/swinir)

## Security Headers

**CSP**: Nonce-based recommended but allowlist-based is acceptable for beta
**Required headers**: HSTS (max-age=63072000), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin)

**Source**: [nextjs.org/docs/app/guides/content-security-policy](https://nextjs.org/docs/app/guides/content-security-policy)
