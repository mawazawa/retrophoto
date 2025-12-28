# RetroPhoto: Next 10 Highest-Leverage Actions (V2)

> **Generated**: December 28, 2025
> **Prerequisite**: Actions 1-10 completed (security, rate limiting, validation, TypeScript, OG branding, parallelization, email, AI simplification)
> **Constraint**: Each subtask touches ≤4-5 files with clear success criteria

---

## Executive Summary

These 10 actions focus on **production hardening, SEO, accessibility, and reliability** improvements building on the security and performance foundation already established.

---

## Action 11: Implement HTTP Security Headers

**Impact**: CRITICAL - OWASP compliance
**Effort**: Medium
**Dependencies**: None

### Problem
No Content-Security-Policy, X-Frame-Options, or HSTS headers configured.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 11.1 | Create security headers config | `lib/security/headers.ts` | Export header configuration object |
| 11.2 | Add CSP header with allowed origins | `lib/security/headers.ts` | Supabase, Replicate, Sentry allowed |
| 11.3 | Add X-Frame-Options: DENY | `lib/security/headers.ts` | Prevent clickjacking |
| 11.4 | Add X-Content-Type-Options: nosniff | `lib/security/headers.ts` | Prevent MIME sniffing |
| 11.5 | Add Referrer-Policy | `lib/security/headers.ts` | strict-origin-when-cross-origin |
| 11.6 | Add Strict-Transport-Security | `lib/security/headers.ts` | HSTS with 1-year max-age |
| 11.7 | Add Permissions-Policy | `lib/security/headers.ts` | Disable unused browser features |
| 11.8 | Apply headers in middleware | `middleware.ts` | Headers added to all responses |
| 11.9 | Add headers to next.config.ts | `next.config.ts` | Backup header configuration |
| 11.10 | Test with securityheaders.com | - | A+ rating achieved |
| 11.11 | Document CSP policy | `CLAUDE.md` | Add security headers section |
| 11.12 | Add security header tests | `tests/security/headers.test.ts` | Verify all headers present |

---

## Action 12: Upgrade Rate Limiting to Distributed Cache

**Impact**: HIGH - Required for horizontal scaling
**Effort**: Medium
**Dependencies**: Upstash Redis account

### Problem
Current in-memory rate limiter doesn't work across serverless instances.

### Subtasks (14 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 12.1 | Install Upstash packages | `package.json` | `@upstash/redis`, `@upstash/ratelimit` |
| 12.2 | Add Upstash env vars | `.env.local.template` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| 12.3 | Create Redis client utility | `lib/redis/client.ts` | Export configured Redis client |
| 12.4 | Create distributed rate limiter | `lib/rate-limit/distributed.ts` | Using Upstash sliding window |
| 12.5 | Add fallback to in-memory | `lib/rate-limit/index.ts` | Use Redis if configured, else memory |
| 12.6 | Remove setInterval cleanup | `lib/rate-limit/index.ts` | Prevent memory leak |
| 12.7 | Update restore route | `app/api/restore/route.ts` | Use new rate limiter |
| 12.8 | Update quota route | `app/api/quota/route.ts` | Use new rate limiter |
| 12.9 | Update checkout route | `app/api/create-checkout-session/route.ts` | Use new rate limiter |
| 12.10 | Update analytics route | `app/api/analytics/route.ts` | Use new rate limiter |
| 12.11 | Add rate limit metrics | `lib/observability/metrics.ts` | Track rate limit hits |
| 12.12 | Add unit tests | `lib/rate-limit/distributed.test.ts` | Test Redis rate limiting |
| 12.13 | Add integration test | `tests/integration/rate-limit.test.ts` | Test across requests |
| 12.14 | Document Redis setup | `CLAUDE.md` | Add Redis configuration section |

---

## Action 13: Add SEO Infrastructure

**Impact**: HIGH - Organic traffic acquisition
**Effort**: Small
**Dependencies**: None

### Problem
Missing robots.txt, sitemap.xml, and structured data.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 13.1 | Create robots.txt | `public/robots.txt` | Allow all crawlers, reference sitemap |
| 13.2 | Create sitemap.xml | `public/sitemap.xml` | List all public routes |
| 13.3 | Add sitemap generation script | `scripts/generate-sitemap.ts` | Auto-generate sitemap |
| 13.4 | Add JSON-LD for homepage | `app/page.tsx` | WebApplication schema |
| 13.5 | Add JSON-LD for result pages | `app/result/[id]/page.tsx` | ImageObject schema |
| 13.6 | Add canonical URLs | `app/layout.tsx` | Prevent duplicate content |
| 13.7 | Add og:url meta tags | `app/page.tsx` | Correct page URL |
| 13.8 | Add Twitter card meta | `app/layout.tsx` | summary_large_image |
| 13.9 | Verify Google indexing | - | Submit sitemap to Search Console |
| 13.10 | Test with rich results | - | Google Rich Results Test passes |
| 13.11 | Add meta description to all pages | `app/*/page.tsx` | Unique descriptions |
| 13.12 | Document SEO requirements | `CLAUDE.md` | Add SEO section |

---

## Action 14: Implement Error Boundaries

**Impact**: MEDIUM-HIGH - Graceful failure handling
**Effort**: Medium
**Dependencies**: None

### Problem
No React Error Boundary; component crashes show blank screen.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 14.1 | Create ErrorBoundary component | `components/error-boundary.tsx` | Catch and display errors |
| 14.2 | Add fallback UI | `components/error-boundary.tsx` | User-friendly error message |
| 14.3 | Integrate with Sentry | `components/error-boundary.tsx` | Report errors to Sentry |
| 14.4 | Add retry button | `components/error-boundary.tsx` | Allow page refresh |
| 14.5 | Wrap app layout | `app/layout.tsx` | Boundary at root level |
| 14.6 | Create error.tsx for route errors | `app/error.tsx` | Next.js error boundary |
| 14.7 | Create global-error.tsx | `app/global-error.tsx` | Root layout error handling |
| 14.8 | Add loading states | `app/loading.tsx` | Suspense fallback |
| 14.9 | Handle network errors in components | `components/upload-zone.tsx` | Show retry UI |
| 14.10 | Add error logging utility | `lib/observability/error-logger.ts` | Centralized error reporting |
| 14.11 | Add error boundary tests | `tests/unit/error-boundary.test.tsx` | Verify error catching |
| 14.12 | Document error handling | `CLAUDE.md` | Add error handling section |

---

## Action 15: Add Dynamic Meta Tags for Result Pages

**Impact**: MEDIUM - Better social sharing
**Effort**: Small
**Dependencies**: None

### Problem
Result pages don't have dynamic metadata for social sharing.

### Subtasks (10 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 15.1 | Add generateMetadata function | `app/result/[id]/page.tsx` | Export metadata function |
| 15.2 | Fetch session data for metadata | `app/result/[id]/page.tsx` | Get title from session |
| 15.3 | Add og:image with OG card URL | `app/result/[id]/page.tsx` | Point to /api/og-card/[id] |
| 15.4 | Add Twitter card metadata | `app/result/[id]/page.tsx` | summary_large_image |
| 15.5 | Add dynamic title | `app/result/[id]/page.tsx` | "Your Restored Photo | RetroPhoto" |
| 15.6 | Add dynamic description | `app/result/[id]/page.tsx` | Describe restoration |
| 15.7 | Add canonical URL | `app/result/[id]/page.tsx` | Deep link URL |
| 15.8 | Test with Facebook debugger | - | OG image displays correctly |
| 15.9 | Test with Twitter validator | - | Card renders correctly |
| 15.10 | Document metadata pattern | `CLAUDE.md` | Add dynamic metadata section |

---

## Action 16: Complete PWA Offline Support

**Impact**: MEDIUM-HIGH - Offline reliability
**Effort**: Medium
**Dependencies**: None

### Problem
Background sync has no cleanup; no offline fallback page.

### Subtasks (14 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 16.1 | Add TTL to queued uploads | `lib/pwa/background-sync.ts` | 7-day expiration |
| 16.2 | Implement queue cleanup | `lib/pwa/background-sync.ts` | Remove expired items |
| 16.3 | Add queue size limit | `lib/pwa/background-sync.ts` | Max 50MB or 10 items |
| 16.4 | Create offline fallback page | `app/offline/page.tsx` | User-friendly offline message |
| 16.5 | Register offline route in SW | `app/sw.ts` | Serve offline page when network fails |
| 16.6 | Add offline detection hook | `lib/hooks/use-online-status.ts` | Track online/offline state |
| 16.7 | Show offline banner | `components/offline-banner.tsx` | Notify user when offline |
| 16.8 | Add to layout | `app/layout.tsx` | Include offline banner |
| 16.9 | Implement retry with backoff | `lib/pwa/background-sync.ts` | Exponential backoff for retries |
| 16.10 | Add sync success notification | `lib/pwa/notifications.ts` | Notify when sync completes |
| 16.11 | Test offline mode | - | App works offline |
| 16.12 | Add PWA manifest improvements | `public/manifest.json` | Better icons and display |
| 16.13 | Document offline behavior | `CLAUDE.md` | Add PWA section |
| 16.14 | Add Lighthouse PWA audit | `package.json` | npm run lighthouse:pwa |

---

## Action 17: Optimize Database Queries

**Impact**: MEDIUM - Performance at scale
**Effort**: Medium
**Dependencies**: Database access

### Problem
Queries use `select('*')`, no indexes documented, potential N+1 queries.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 17.1 | Audit all database queries | - | List all queries with columns |
| 17.2 | Replace select('*') in restore route | `app/api/restore/route.ts` | Select only needed columns |
| 17.3 | Replace select('*') in result page | `app/result/[id]/page.tsx` | Select only needed columns |
| 17.4 | Join upload_sessions + restoration_results | `app/result/[id]/page.tsx` | Single query instead of two |
| 17.5 | Create index migration for fingerprint | `supabase/migrations/018_add_indexes.sql` | Index on user_quota.fingerprint |
| 17.6 | Create index for session lookups | `supabase/migrations/018_add_indexes.sql` | Index on restoration_results.session_id |
| 17.7 | Create index for user credits | `supabase/migrations/018_add_indexes.sql` | Index on user_credits.user_id |
| 17.8 | Add query timing logs | `lib/observability/query-logger.ts` | Log slow queries |
| 17.9 | Test query performance | - | All queries <100ms |
| 17.10 | Add pagination utility | `lib/supabase/pagination.ts` | Reusable pagination helper |
| 17.11 | Document query patterns | `CLAUDE.md` | Add database optimization section |
| 17.12 | Add migration guide | `supabase/migrations/README.md` | Document index creation |

---

## Action 18: Add Web Vitals Monitoring

**Impact**: MEDIUM - Performance observability
**Effort**: Medium
**Dependencies**: None

### Problem
No Core Web Vitals tracking (LCP, FID, CLS, INP).

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 18.1 | Install web-vitals package | `package.json` | `npm install web-vitals` |
| 18.2 | Create Web Vitals reporter | `lib/metrics/web-vitals.ts` | Export vitals reporter |
| 18.3 | Report to Sentry | `lib/metrics/web-vitals.ts` | Send vitals to Sentry |
| 18.4 | Report to analytics endpoint | `lib/metrics/web-vitals.ts` | POST to /api/analytics |
| 18.5 | Add to app layout | `app/layout.tsx` | Initialize vitals tracking |
| 18.6 | Track LCP | `lib/metrics/web-vitals.ts` | Largest Contentful Paint |
| 18.7 | Track FID/INP | `lib/metrics/web-vitals.ts` | First Input Delay / Interaction to Next Paint |
| 18.8 | Track CLS | `lib/metrics/web-vitals.ts` | Cumulative Layout Shift |
| 18.9 | Set performance budgets | `lib/metrics/web-vitals.ts` | LCP <2.5s, CLS <0.1 |
| 18.10 | Add Sentry performance alerts | `lib/observability/alerts.ts` | Alert on threshold breach |
| 18.11 | Create performance dashboard query | - | Sentry dashboard configuration |
| 18.12 | Document SLOs | `CLAUDE.md` | Add Web Vitals SLOs |

---

## Action 19: Implement Retry Logic for External Calls

**Impact**: MEDIUM - Reliability
**Effort**: Medium
**Dependencies**: None

### Problem
No retry for image fetches, Stripe calls, or AI model invocations.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 19.1 | Install p-retry package | `package.json` | `npm install p-retry` |
| 19.2 | Create retry utility | `lib/utils/retry.ts` | Configurable retry wrapper |
| 19.3 | Add timeout utility | `lib/utils/timeout.ts` | Promise timeout wrapper |
| 19.4 | Retry image fetches in GIF generator | `lib/share/gif-generator.ts` | 3 retries with backoff |
| 19.5 | Retry image fetches in OG card | `lib/share/og-card.tsx` | 3 retries with backoff |
| 19.6 | Add timeout to Replicate calls | `lib/ai/restore.ts` | 60s timeout |
| 19.7 | Retry Stripe checkout creation | `app/api/create-checkout-session/route.ts` | 2 retries |
| 19.8 | Add circuit breaker for AI | `lib/ai/circuit-breaker.ts` | Fail fast after repeated failures |
| 19.9 | Log retry attempts | `lib/observability/logger.ts` | Track retry metrics |
| 19.10 | Add retry tests | `lib/utils/retry.test.ts` | Test exponential backoff |
| 19.11 | Document retry behavior | `CLAUDE.md` | Add reliability section |
| 19.12 | Add integration test | `tests/integration/retry.test.ts` | Test with mock failures |

---

## Action 20: Add Keyboard Navigation & Focus Management

**Impact**: MEDIUM - WCAG 2.1 accessibility
**Effort**: Small
**Dependencies**: None

### Problem
Dialogs may lack focus trap; no visible focus indicators.

### Subtasks (12 tasks)

| # | Task | Files | Success Criteria |
|---|------|-------|------------------|
| 20.1 | Audit focus management in dialogs | `components/ui/dialog.tsx` | Verify focus trap works |
| 20.2 | Add visible focus styles | `tailwind.config.ts` | focus-visible ring styles |
| 20.3 | Add focus to comparison slider | `components/comparison-slider.tsx` | Keyboard-accessible slider |
| 20.4 | Add keyboard nav to share sheet | `components/share-sheet.tsx` | Arrow key navigation |
| 20.5 | Add Escape key to close modals | `components/ui/dialog.tsx` | Escape closes dialog |
| 20.6 | Add ARIA live regions | `components/restore-progress.tsx` | Announce progress updates |
| 20.7 | Add skip-to-content link | `app/layout.tsx` | Skip navigation for screen readers |
| 20.8 | Test with keyboard only | - | All actions accessible via keyboard |
| 20.9 | Test with VoiceOver/NVDA | - | Screen reader compatible |
| 20.10 | Add axe accessibility tests | `tests/a11y/accessibility.test.ts` | Automated a11y testing |
| 20.11 | Run Lighthouse accessibility | - | Score >90 |
| 20.12 | Document accessibility | `CLAUDE.md` | Add accessibility section |

---

## Implementation Order

```
Week 1 (Security & SEO):
├── Action 11: HTTP Security Headers (Days 1-2)
├── Action 13: SEO Infrastructure (Day 3)
└── Action 15: Dynamic Meta Tags (Days 4-5)

Week 2 (Reliability & Performance):
├── Action 12: Distributed Rate Limiting (Days 1-2)
├── Action 17: Database Optimization (Day 3)
├── Action 19: Retry Logic (Days 4-5)
└── Action 18: Web Vitals Monitoring (Day 5)

Week 3 (UX & Accessibility):
├── Action 14: Error Boundaries (Days 1-2)
├── Action 16: PWA Offline Support (Days 3-4)
└── Action 20: Keyboard Navigation (Day 5)
```

---

## Success Metrics

| Metric | Current | Target | Action |
|--------|---------|--------|--------|
| SecurityHeaders.com grade | Unknown | A+ | #11 |
| Rate limit scalability | 1 instance | N instances | #12 |
| Google PageSpeed SEO | Unknown | 100 | #13 |
| Error recovery rate | 0% | 95% | #14 |
| Social preview quality | Basic | Rich | #15 |
| Offline capability | Partial | Full | #16 |
| Query performance p95 | Unknown | <100ms | #17 |
| Web Vitals LCP | Unknown | <2.5s | #18 |
| External call success | ~95% | 99.5% | #19 |
| Lighthouse a11y | Unknown | >90 | #20 |

---

## Dependencies Between Actions

```
Independent (can start immediately):
├── Action 11: Security Headers
├── Action 13: SEO Infrastructure
├── Action 14: Error Boundaries
├── Action 15: Dynamic Meta Tags
├── Action 20: Keyboard Navigation

Requires setup:
├── Action 12: Distributed Rate Limiting (needs Upstash account)
├── Action 17: Database Optimization (needs migration access)
├── Action 18: Web Vitals (needs Sentry configured)

Sequential:
├── Action 16: PWA Offline (should follow Action 14 for error handling)
└── Action 19: Retry Logic (can enhance Action 12's resilience)
```

---

**Last Updated**: December 28, 2025
