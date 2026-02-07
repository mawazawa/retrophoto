# Tech Recency Audit — February 7, 2026

> Comprehensive version check across all dependencies, APIs, and services. Findings categorized by launch impact.

## Executive Summary

**14 packages are current.** 8 have significant updates available. 3 are critical for the beta launch decision.

The biggest strategic question: **Should we upgrade to Next.js 16 before launch?**

**Answer: No.** Next.js 16 is a major rewrite (async APIs enforced, middleware renamed to proxy, Turbopack default, `next lint` removed). This is a 4-8 hour migration that introduces risk right before launch. Stay on 15.5.x, patch to 15.5.11 for the December 2025 security fixes, and plan the Next.js 16 migration as a post-launch sprint.

---

## Critical for Launch

### 1. Next.js — Patch to 15.5.11

| | |
|---|---|
| **Current** | `^15.5.9` |
| **Recommended** | `^15.5.11` |
| **Latest** | `16.1.6` (Oct 2025 major release) |
| **Action** | Patch only. Do NOT upgrade to 16 before launch. |

Next.js 15.5.11 includes the December 2025 security advisory patches (CVE-2025-55184 DoS, CVE-2025-55183 source code exposure). The `^15.5.9` semver range will auto-resolve to 15.5.11 on `npm install`.

Next.js 16 breaking changes (defer to post-launch):
- All request APIs (`cookies()`, `headers()`, `params`, `searchParams`) now async
- `middleware.ts` deprecated in favor of `proxy.ts`
- Turbopack is default (custom Webpack config ignored)
- `next lint` removed — must use ESLint directly
- `experimental_ppr` removed, replaced by `"use cache"` directive

**Reference**: [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16)

### 2. React — Patch to 19.2.4

| | |
|---|---|
| **Current** | `^19.2.3` |
| **Recommended** | `^19.2.4` |
| **Action** | Auto-resolves on `npm install` |

React 19.2.4 adds DoS mitigations to Server Actions and hardens Server Components. Security patch, no breaking changes.

**Reference**: [react.dev/versions](https://react.dev/versions)

### 3. Stripe Node SDK — Major Version Available

| | |
|---|---|
| **Current** | `^19.1.0` (API version `2025-09-30.clover`) |
| **Latest** | `20.3.1` (API version `2026-01-28.clover`) |
| **Action** | Stay on v19 for launch. Upgrade to v20 post-launch. |

Stripe v20 pins to a newer API version. Upgrading changes webhook event shapes and API behavior. Testing the webhook handler, checkout flow, and refund handling against a new API version is not worth the risk right before launch.

**Reference**: [docs.stripe.com/upgrades](https://docs.stripe.com/upgrades)

---

## High Priority (Address Before or Shortly After Launch)

### 4. TypeScript — Two Minors Behind

| | |
|---|---|
| **Current** | `5.7` |
| **Latest** | `5.9.3` |
| **Action** | Upgrade to `5.9` post-launch |

TypeScript 5.9 has significant performance improvements (type instantiation caching benefits Zod and tRPC), `import defer`, and `--module node20`. No breaking changes from 5.7 → 5.9.

Note: TypeScript 7.0 "Project Corsa" (native Go rewrite, 10x faster) is in preview. Not production-ready yet.

**Reference**: [devblogs.microsoft.com/typescript/announcing-typescript-5-9/](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)

### 5. Vitest — Major Version Available

| | |
|---|---|
| **Current** | `^3.2.4` |
| **Latest** | `4.0.18` |
| **Action** | Stay on v3 for launch. Upgrade to v4 post-launch. |

Vitest 4.0 has breaking changes in Browser Mode APIs. Since the project uses jsdom (not browser mode), migration should be straightforward but is not worth the risk before launch.

**Reference**: [vitest.dev/blog/vitest-4](https://vitest.dev/blog/vitest-4)

### 6. @ducanh2912/next-pwa — Abandoned, Successor Available

| | |
|---|---|
| **Current** | `^10.2.9` |
| **Successor** | `@serwist/next@9.5.4` |
| **Action** | Migrate to Serwist post-launch |

The package hasn't been updated in a year. Its own author created Serwist as the successor. Serwist has active Next.js 15/16 support and Turbopack compatibility.

**Reference**: [serwist.pages.dev/docs/next/getting-started](https://serwist.pages.dev/docs/next/getting-started)

### 7. FingerprintJS — Major Version Available

| | |
|---|---|
| **Current** | `^4.6.2` |
| **Latest** | `5.0.1` |
| **Action** | Test fingerprint consistency, then upgrade post-launch |

v5 changes TypeScript compilation target from ES5 to ES2018 and switches license from BUSL-1.1 to MIT. **Risk**: fingerprint hashes may differ between v4 and v5, breaking existing guest quota tracking in the `user_quota` table.

**Reference**: [github.com/fingerprintjs/fingerprintjs/releases](https://github.com/fingerprintjs/fingerprintjs/releases)

### 8. ESLint — v10 Drops .eslintrc

| | |
|---|---|
| **Current** | `.eslintrc.json` (legacy format) |
| **Latest** | ESLint `10.0.0` (Feb 2026) |
| **Action** | Migrate to flat config post-launch, before Next.js 16 upgrade |

ESLint 10 completely removes the `.eslintrc` config system. The project must migrate to `eslint.config.mjs` before upgrading. This is also required for Next.js 16 (which removes `next lint`).

**Reference**: [eslint.org/blog/2026/02/eslint-v10.0.0-released/](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/)

---

## Medium Priority (Post-Launch Improvements)

### 9. shadcn/ui — Unified Radix Package

The project uses 4 separate `@radix-ui/react-*` packages. shadcn/ui now supports a unified `radix-ui` package. Run `npx shadcn migrate` to consolidate.

### 10. Node.js — CI Should Use Node 24

Node.js 24 is the Active LTS ("Krypton"). Node 20 reaches EOL April 2026 (2 months). The project's `@types/node@^24.6.2` already targets Node 24. CI workflow should use `node-version: 24`.

### 11. AI Models — Faster Alternatives to SwinIR

Real-ESRGAN (~6s vs SwinIR ~12s) could halve TTM. CodeFormer excels at face restoration. DDColor handles B&W colorization. This maps to the multi-model orchestrator already scaffolded in `lib/ai/orchestrator.ts`. v2 feature.

### 12. Framer Motion → "motion"

CLAUDE.md lists "Framer Motion" but the package isn't in package.json. The project uses `tailwindcss-animate` instead. Remove from tech stack documentation.

### 13. Supabase — Stripe Sync Engine

Supabase now has one-click Stripe Sync Engine integration. Could simplify payment data querying. Evaluate for v2.

---

## Already Current (No Action Needed)

| Package | Version | Status |
|---------|---------|--------|
| `@supabase/ssr` | `^0.8.0` | Latest |
| `postcss` | `^8.5.6` | Latest |
| `@lhci/cli` | `^0.15.1` | Latest |
| `react-dropzone` | `^14.3.8` | Latest |
| `react-compare-slider` | `^3.1.0` | Latest |
| `p-retry` | `^7.1.1` | Latest |
| `web-vitals` | `^5.1.0` | Latest |
| `gifenc` | `^1.0.3` | Latest (stable, no updates) |
| `prettier` | `^3.6.2` | Auto-resolves to 3.8.1 |
| `tailwindcss` | `^4.0.0` | Auto-resolves to 4.1.18 |
| `@supabase/supabase-js` | `^2.89.0` | Auto-resolves to 2.95.3 |
| `@stripe/stripe-js` | `^8.6.0` | Auto-resolves to 8.7.0 |
| `replicate` | `^1.2.0` | Auto-resolves to 1.4.0 |
| `zod` | `^4.2.1` | Auto-resolves to 4.3.6 |
| `@sentry/nextjs` | `^10.32.1` | Auto-resolves to 10.38.0 |
| `@upstash/ratelimit` | `^2.0.7` | Auto-resolves to 2.0.8 |
| `@upstash/redis` | `^1.36.0` | Auto-resolves to 1.36.1 |
| `@playwright/test` | `^1.55.1` | Auto-resolves to 1.58.1 |
| `sharp` | `^0.34.4` | Auto-resolves to 0.34.5 |

---

## Launch Decision Matrix

| Package | Pre-Launch Action | Post-Launch Action |
|---------|-------------------|-------------------|
| next | `npm install` (auto-patches to 15.5.11) | Migrate to Next.js 16 (4-8h sprint) |
| react | `npm install` (auto-patches to 19.2.4) | — |
| stripe | Stay on v19 | Upgrade to v20 + test webhooks |
| typescript | Stay on 5.7 | Upgrade to 5.9 |
| vitest | Stay on v3 | Upgrade to v4 |
| next-pwa | Keep current | Migrate to @serwist/next |
| fingerprintjs | Stay on v4 | Test hash consistency, upgrade to v5 |
| eslint | Keep .eslintrc.json | Migrate to flat config |
| node (CI) | Use Node 24 in GitHub Actions | — |
| All others | `npm install` picks up latest within semver | — |

**Pre-launch command**: `rm -rf node_modules package-lock.json && npm install` — this picks up all auto-resolving patches (React 19.2.4, Next.js 15.5.11, Tailwind 4.1.18, Sentry 10.38.0, etc.)

---

## CLAUDE.md Corrections

The following items in CLAUDE.md need updating:

1. **Framer Motion**: Listed in tech stack but NOT installed. Remove or replace with "tailwindcss-animate"
2. **Node.js CI version**: GitHub Actions should use Node 24 (not 20). Node 20 EOL April 2026.
3. **Next.js version**: Pin description should say "15.5" (not generic "15.5")
