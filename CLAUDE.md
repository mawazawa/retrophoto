# RetroPhoto Development Guidelines

> AI-powered photo restoration application. Preserve memories by turning old photos into realistic HD in seconds.

## Quick Reference

```bash
# Development
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack (faster)
npm run build        # Production build
npm run start        # Start production server

# Quality
npm run lint         # ESLint
npm run typecheck    # TypeScript checking (tsc --noEmit)
npm test             # Unit tests (Vitest, excludes integration/e2e)
npm run test:prod    # Tests against production (retrophotoai.com)
npm run test:e2e     # E2E tests (Playwright, headless)
npm run test:e2e:ui  # E2E with interactive UI
npm run test:e2e:prod # E2E against production

# Analysis
npm run analyze      # Bundle analysis (ANALYZE=true next build)
npm run lighthouse   # Performance audit (Lighthouse CI)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.5 (App Router), React 19 |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS 4.0, shadcn/ui (New York style) |
| Animation | tailwindcss-animate |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (signed URLs) |
| Auth | Supabase Auth (OAuth + email via `@supabase/ssr`) |
| Payments | Stripe (checkout + webhooks) |
| AI | Replicate API (SwinIR super-resolution model) |
| Rate Limiting | Upstash Redis + in-memory fallback |
| Fingerprinting | FingerprintJS (guest quota tracking) |
| Image Processing | Sharp (server-side), gifenc (GIF generation) |
| Validation | Zod |
| Monitoring | Sentry (100% txn sampling, 10% session replay), Vercel Analytics |
| PWA | @ducanh2912/next-pwa (runtime caching, background sync) |
| Testing | Vitest + Testing Library, Playwright (5 device profiles) |

## Project Structure

```
retrophoto/
├── app/                              # Next.js App Router
│   ├── api/                          # API routes
│   │   ├── restore/route.ts          # Main restoration endpoint
│   │   ├── quota/route.ts            # Free tier quota check
│   │   ├── create-checkout-session/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── analytics/route.ts
│   │   └── cron/expire-credits/route.ts
│   ├── app/page.tsx                  # Main application (upload → restore)
│   ├── result/[id]/page.tsx          # Result display (SSG + fallback)
│   ├── auth/callback/route.ts        # OAuth/email callback
│   ├── about/page.tsx                # About page
│   ├── contact/page.tsx              # Contact page
│   ├── privacy/page.tsx              # Privacy policy
│   ├── terms/page.tsx                # Terms of service
│   ├── refund-policy/page.tsx        # Refund policy
│   ├── offline/page.tsx              # PWA offline fallback
│   ├── layout.tsx                    # Root layout (Supabase, Analytics, Toaster)
│   ├── page.tsx                      # Landing page
│   ├── global-error.tsx              # Global error boundary
│   ├── error.tsx                     # Route error handler
│   └── not-found.tsx                 # 404 handler
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui primitives
│   │   ├── button.tsx, dialog.tsx, input.tsx
│   │   ├── label.tsx, progress.tsx
│   │   └── toast.tsx, toaster.tsx
│   ├── auth/                         # Auth components
│   │   ├── sign-in-button.tsx        # OAuth/email sign-in
│   │   └── user-menu.tsx             # Authenticated user menu
│   ├── credits/                      # Credit system UI
│   │   ├── credit-balance.tsx        # Display available credits
│   │   ├── purchase-credits-button.tsx
│   │   └── purchase-history.tsx
│   ├── upload-zone.tsx               # Drag-drop upload with preview
│   ├── restore-progress.tsx          # Progress indicator
│   ├── comparison-slider.tsx         # Before/after slider (lazy-loaded)
│   ├── zoom-viewer.tsx               # Pinch-to-zoom viewer
│   ├── share-sheet.tsx               # Social sharing
│   ├── before-after-hero.tsx         # Landing page hero examples
│   ├── watermark-badge.tsx           # Subtle watermark for free results
│   ├── upgrade-prompt.tsx            # Upsell prompt
│   ├── error-boundary.tsx            # Error handling wrapper
│   ├── footer.tsx                    # Global footer
│   ├── skip-link.tsx                 # Accessibility skip-to-main
│   └── web-vitals.tsx                # Client-side web vitals tracking
│
├── lib/                              # Core utilities & services
│   ├── ai/                           # AI model integration
│   │   ├── restore.ts                # Replicate API (SwinIR)
│   │   ├── orchestrator.ts           # Multi-model routing
│   │   ├── triage.ts                 # Image classification
│   │   ├── quality-validator.ts      # Output quality assessment
│   │   └── types.ts                  # AI-related types
│   ├── api/                          # API utilities
│   │   ├── errors.ts                 # ApiError class + factories
│   │   ├── error-boundary.ts         # Route error wrapper
│   │   ├── types.ts                  # Request/response types
│   │   └── example-usage.ts          # Usage examples
│   ├── auth/client.ts                # Client-side auth utilities
│   ├── credits/quota.ts              # Credit deduction logic
│   ├── dal/                          # Data Access Layer
│   │   ├── index.ts                  # DAL exports
│   │   ├── upload-sessions.ts        # Session CRUD
│   │   ├── user-credits.ts           # Credit operations
│   │   └── user-quota.ts             # Free tier quota
│   ├── email/index.ts                # Email notifications
│   ├── hooks/                        # React hooks
│   │   └── use-keyboard-navigation.ts
│   ├── metrics/                      # Analytics & metrics
│   │   ├── analytics.ts              # Server-side event tracking
│   │   ├── client-analytics.ts       # Client-side events
│   │   └── web-vitals.ts             # Core Web Vitals
│   ├── observability/                # Logging & alerts
│   │   ├── logger.ts                 # Structured logger
│   │   └── alerts.ts                 # TTM threshold alerts
│   ├── pwa/background-sync.ts        # Offline restoration sync
│   ├── quota/                        # Free tier quota system
│   │   ├── tracker.ts                # Server-side enforcement (fail-closed)
│   │   └── client-tracker.ts         # Client fingerprint generation
│   ├── rate-limit/                   # Rate limiting
│   │   ├── index.ts                  # Hybrid limiter (Redis + memory)
│   │   └── upstash.ts                # Upstash Redis implementation
│   ├── security/                     # Security utilities
│   │   ├── headers.ts                # CSP, HSTS, X-Frame-Options
│   │   └── csrf.ts                   # CSRF token validation
│   ├── share/                        # Sharing features
│   │   ├── deep-link.ts              # Deep link generation
│   │   ├── og-card.tsx               # OpenGraph card (React → image)
│   │   └── gif-generator.ts          # Animated wipe-reveal GIF
│   ├── storage/uploads.ts            # Supabase Storage operations
│   ├── supabase/                     # Database clients
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookie-based)
│   │   ├── service-role.ts           # Service role (cached singleton)
│   │   ├── types.ts                  # Generated DB types
│   │   └── migrations/               # SQL migrations (010-017)
│   ├── utils/retry.ts                # Retry with exponential backoff
│   ├── validation/                   # Input validation
│   │   ├── schemas.ts                # Zod schemas
│   │   └── uuid.ts                   # UUID validation
│   └── utils.ts                      # cn(), file validation, error maps
│
├── tests/                            # Test suites
│   ├── unit/                         # Unit tests
│   │   └── restore-retry-logic.test.ts
│   ├── integration/                  # API integration tests
│   │   ├── api-restore.test.ts       # Full restoration flow
│   │   ├── api-quota.test.ts         # Quota checking
│   │   ├── api-quota-error-codes.test.ts
│   │   ├── payment-flow.test.ts      # Stripe integration
│   │   ├── upload-validation.test.ts # File validation
│   │   ├── quota-tracker.test.ts     # Quota tracking
│   │   └── webhook-idempotency.test.ts
│   ├── e2e/                          # Playwright E2E
│   │   ├── auth-flow.spec.ts
│   │   ├── restore-flow.spec.ts
│   │   ├── upload-flow.spec.ts
│   │   ├── quota-flow.spec.ts
│   │   ├── payment-flow.spec.ts
│   │   ├── share-flow.spec.ts
│   │   ├── zoom-flow.spec.ts
│   │   └── database-integration.spec.ts
│   ├── security/
│   │   └── quota-fail-closed.test.ts # Security invariants
│   ├── config/
│   │   └── vitest-playwright-exclusion.test.ts
│   ├── setup.ts                      # Global test configuration
│   └── mocks/supabase.ts             # Supabase mock client
│
├── scripts/                          # Utility scripts
│   ├── apply-migrations.sh           # DB migration runner
│   ├── apply-migrations-psql.sh      # psql migration runner
│   ├── apply-payment-migrations.mjs  # Payment schema migrations
│   ├── run-payment-migrations.js     # Payment migration runner
│   ├── test-stripe-flow.mjs          # Stripe flow testing
│   └── verify-env.sh                 # Environment verification
│
├── specs/                            # Feature specifications
│   ├── 001-build-the-mvp/            # MVP spec, plan, tasks
│   └── 002-implement-payment-processing/
│
├── .specify/                         # Specify framework
│   ├── memory/constitution.md        # Product principles
│   └── templates/                    # Spec/plan/task templates
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   ├── examples/                     # Before/after examples
│   └── logo*.png                     # Logo variations (16-1024px)
│
├── middleware.ts                      # Auth refresh + security headers
├── next.config.ts                     # PWA, Sentry, bundle analyzer
├── tailwind.config.ts                 # Design tokens + custom animations
├── vitest.config.ts                   # jsdom env, path aliases
├── playwright.config.ts              # 5 device profiles, retries
├── sentry.{client,server,edge}.config.ts
├── .eslintrc.json                    # next/core-web-vitals + a11y
├── .prettierrc                        # Semicolons, single quotes, 100 chars
├── components.json                   # shadcn/ui configuration
└── .lighthouserc.json                # Lighthouse CI config
```

## Architecture Overview

### Request Flow
```
Client → Middleware (auth refresh + security headers)
       → API Route → Rate Limiter → Service Layer → External APIs
                                         ↓
                                   Supabase (DB + Storage)
```

### Key Patterns

1. **Guest Mode + Fingerprinting**: Anonymous users tracked via FingerprintJS for quota enforcement
2. **Server-Side AI**: All model invocations are server-only (API keys never exposed)
3. **RLS Security**: Row-Level Security enforced on all database tables
4. **Fail-Closed Quota**: If quota check fails, deny access (security-first)
5. **Webhook Idempotency**: Database-backed duplicate detection for Stripe events
6. **Data Access Layer**: All DB operations go through `lib/dal/` — not raw Supabase queries in routes
7. **Hybrid Rate Limiting**: Upstash Redis when available, in-memory fallback for development
8. **Structured Error Handling**: `ApiError` class with typed error codes, wrapped by `error-boundary.ts`

## Database Schema

### Core Tables
- `user_quota` — Free tier tracking (fingerprint → restore_count)
- `upload_sessions` — Restoration sessions with TTL (24h auto-delete)
- `restoration_results` — AI outputs (restored_url, og_card, gif, deep_link)
- `user_credits` — Aggregate credit balance (available, used, expired, purchased)
- `credit_batches` — Individual purchases with 365-day expiration (FIFO deduction)
- `payment_transactions` — Immutable Stripe payment audit trail
- `stripe_webhook_events` — Webhook processing audit + idempotency
- `payment_refunds` — Refund tracking
- `analytics_events` — TTM/NSM metrics

### Migrations
SQL migrations live in `lib/supabase/migrations/` (010-017). Run with `scripts/apply-migrations.sh`.

### RPC Functions
```sql
check_quota(user_fingerprint)      -- Check free tier quota
deduct_credit(p_user_id)           -- Deduct one credit (FIFO batch selection)
add_credits(p_user_id, ...)        -- Add credits from purchase
process_refund(...)                -- Handle Stripe refunds
expire_credits()                   -- Cron: cleanup expired credits
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/restore` | Upload + AI restoration |
| GET | `/api/quota?fingerprint=X` | Check free tier quota |
| POST | `/api/create-checkout-session` | Initiate Stripe checkout |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/analytics` | Track TTM/NSM events |
| POST | `/api/cron/expire-credits` | Scheduled credit expiration |
| GET | `/auth/callback` | OAuth/email auth callback |

### API Response Patterns
```typescript
// Success
{ session_id, restored_url, og_card_url, gif_url, deep_link, ttm_seconds }

// Error
{ error: string, error_code: string, upgrade_url?: string }

// Error codes: QUOTA_EXCEEDED, INVALID_FILE_TYPE, FILE_TOO_LARGE,
//              AI_MODEL_ERROR, MISSING_FINGERPRINT, CREDIT_DEDUCTION_FAILED
```

### Error Handling
Use `ApiError` from `lib/api/errors.ts` which provides factory functions:
```typescript
import { badRequest, forbidden, notFound } from '@/lib/api/errors'
throw badRequest('Invalid file type', 'INVALID_FILE_TYPE')
```

Wrap route handlers with `withErrorBoundary` from `lib/api/error-boundary.ts` for consistent error responses.

## Code Conventions

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Path alias: `@/*` maps to project root
- Target: ES2017, Module: ESNext, Resolution: bundler
- Prefer explicit types over `any` (eslint rule: `@typescript-eslint/no-explicit-any: warn`)

### Component Patterns
```typescript
// Use cn() for conditional classes (clsx + tailwind-merge)
import { cn } from '@/lib/utils'

<div className={cn(
  "base-styles",
  condition && "conditional-styles"
)} />
```

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse + validate input (Zod schemas from lib/validation/schemas.ts)
    // 2. Rate limit check (lib/rate-limit/)
    // 3. Check auth/quota
    // 4. Process via DAL (lib/dal/)
    // 5. Return JSON response
    return NextResponse.json({ ... })
  } catch (error) {
    logger.error('Operation failed', { error })
    return NextResponse.json(
      { error: 'User-friendly message', error_code: 'CODE' },
      { status: 500 }
    )
  }
}
```

### Logging Pattern
```typescript
import { logger } from '@/lib/observability/logger'

logger.uploadStart(fingerprint, fileSize, fileType)
logger.restorationStart(sessionId)
logger.restorationComplete(sessionId, durationMs, ttmSeconds)
logger.error('Message', { context })
```

### Validation Pattern
```typescript
import { someSchema } from '@/lib/validation/schemas'
const parsed = someSchema.parse(input) // throws ZodError on invalid input
```

### Formatting
- Prettier: semicolons, single quotes, trailing commas (ES5), 100-char line width
- Tailwind class sorting via `prettier-plugin-tailwindcss`

## Testing

### Unit Tests (Vitest)
```bash
npm test                    # Run all (excludes integration + e2e)
npm test -- --watch         # Watch mode
npm test -- path/to/test    # Run specific test
```

Test files: `*.test.ts` colocated alongside source files in `lib/`, plus `tests/unit/`.

Vitest is configured with jsdom environment and excludes `tests/e2e/` and `tests/integration/`.

### Integration Tests
Integration tests in `tests/integration/` are excluded from the default `npm test` run. They test full API route flows with mocked Supabase.

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Headless (5 device profiles)
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:prod       # Against retrophotoai.com
```

Test files: `tests/e2e/*.spec.ts`

Playwright tests run against 5 device profiles: Chromium, Firefox, WebKit, Pixel 5, iPhone 12. Configured with 2 retries in CI, HTML reporter, trace on first retry.

### Key Test Suites
- `tests/integration/api-restore.test.ts` — Full restoration flow
- `tests/integration/payment-flow.test.ts` — Stripe integration
- `tests/integration/webhook-idempotency.test.ts` — Webhook deduplication
- `tests/security/quota-fail-closed.test.ts` — Security invariants
- `lib/observability/logger.test.ts` — Logger behavior
- `lib/quota/tracker.test.ts` — Quota enforcement logic

## Environment Variables

### Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
REPLICATE_API_TOKEN=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CREDITS_PRICE_ID=
```

### Optional
```env
# Multi-model AI routing
ANTHROPIC_API_KEY=           # Claude for triage
OPENAI_API_KEY=              # GPT for portraits
GOOGLE_AI_API_KEY=           # Gemini for landscapes
XAI_API_KEY=                 # Grok for documents
GROQ_API_KEY=                # Kimi for validation

# Rate Limiting (falls back to in-memory if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
USE_REDIS_RATE_LIMIT=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=
DATABASE_URL=                # For running migrations directly
```

## Security

### Middleware (`middleware.ts`)
- Refreshes Supabase auth sessions on every request
- Applies security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Differentiates API vs static asset headers
- Allows guest mode on `/app` (fingerprint-based quota, no auth required)
- Matcher excludes `_next/static`, `_next/image`, favicon, image files

### Rate Limiting (`lib/rate-limit/`)
- Hybrid architecture: Upstash Redis (distributed) when configured, in-memory fallback for dev
- Pre-configured limits: restore (20 req/min), checkout (5 req/min)

### CSRF Protection (`lib/security/csrf.ts`)
- Token validation for state-changing operations

### Content Security Policy (`lib/security/headers.ts`)
- CSP with allowlists for Supabase, Replicate, Stripe, Sentry, Vercel
- Applied via both middleware and `next.config.ts` headers

## PWA Configuration

- Manifest: `public/manifest.json` (standalone display, dark theme)
- Service worker: `@ducanh2912/next-pwa` with runtime caching
  - Supabase images: CacheFirst, 24h TTL, 50 entries
  - Replicate images: CacheFirst, 7d TTL, 20 entries
  - API responses: NetworkFirst, 5min TTL, 10s timeout
- Background sync: `lib/pwa/background-sync.ts` for offline restoration queuing
- Disabled in development mode

## Performance SLOs

- **TTM p50**: ≤6 seconds (Time-to-Magic)
- **TTM p95**: ≤12 seconds
- **First interactive**: <1.5s on mid-tier devices
- **Failed restores**: <1% (with automatic retry once via `p-retry`)
- **Uptime**: 99.9%

## Design System

### Touch Targets
- Minimum: 44x44px (WCAG AAA)
- Spacing between targets: ≥8px
- Primary actions in thumb-reach zone (bottom 60%)

### Typography (tailwind.config.ts)
- Hero: 36px
- Section: 24px
- Body: 18px
- Caption: 14px

### Colors
Dark-first design (`darkMode: 'class'`) with CSS variable-based theming (HSL format). Muted tones and soft gradients.

### Animations
Custom Tailwind animations: shimmer, slide-in, fade-in. All animations respect `prefers-reduced-motion`.

## Constitutional Principles

Key non-negotiables (from `.specify/memory/constitution.md`):

1. **Zero Friction to Wow**: Preview before any account/pricing wall
2. **Mobile-First Always**: Touch targets ≥44px, single-column layouts
3. **First-Run Nirvana**: Upload → Restore → Preview (no interruptions)
4. **Share-Ready by Default**: Auto-generate OG cards, GIFs, deep links
5. **Tasteful Monetization**: Show result before upsell, subtle watermarks
6. **Fail-Closed Security**: Deny on quota check failure
7. **Server-Side AI**: Never expose API keys to client

## Common Tasks

### Adding a New API Route
1. Create `app/api/[name]/route.ts`
2. Define Zod schema in `lib/validation/schemas.ts`
3. Add DAL functions in `lib/dal/` for database operations
4. Use `ApiError` from `lib/api/errors.ts` for error handling
5. Add rate limiting via `lib/rate-limit/`
6. Add logging via `logger` from `lib/observability/logger`
7. Add integration tests in `tests/integration/`

### Adding a Component
1. Create in `components/` (or `components/ui/` for shadcn primitives)
2. Use `cn()` from `lib/utils` for class merging
3. Respect mobile-first and accessibility requirements (44px touch targets)
4. Add animations via Framer Motion or tailwindcss-animate (respect `prefers-reduced-motion`)

### Working with Credits
1. Check auth: `supabase.auth.getUser()`
2. Query credits via DAL: `lib/dal/user-credits.ts`
3. Deduct: `rpc('deduct_credit', { p_user_id })` (FIFO batch selection)
4. Add: `rpc('add_credits', { p_user_id, ... })`

### Handling Webhooks
1. Verify Stripe signature
2. Check idempotency in `stripe_webhook_events`
3. Process event
4. Update processing_status

### Running Database Migrations
```bash
# Using the migration scripts
bash scripts/apply-migrations.sh
# Or with psql directly
bash scripts/apply-migrations-psql.sh
```

Migrations are in `lib/supabase/migrations/` numbered 010-017.

## Troubleshooting

### "QUOTA_EXCEEDED" errors
- Check `user_quota` table for fingerprint
- Verify quota logic in `lib/quota/tracker.ts`
- Confirm fail-closed behavior: DB errors = deny access

### Stripe webhook failures
- Check `stripe_webhook_events` for error status
- Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
- Check Stripe dashboard for delivery status

### AI restoration failures
- Check Replicate API status
- Verify `REPLICATE_API_TOKEN` is valid
- Check image resolution/format requirements
- Review retry logic in `lib/utils/retry.ts` (exponential backoff)

### Rate limiting issues
- Check if `UPSTASH_REDIS_REST_URL` is configured (falls back to in-memory)
- In-memory limiter resets on server restart
- Review limits in `lib/rate-limit/index.ts`

## Additional Documentation

- `README.md` — Full project overview
- `API_SPECIFICATION.md` — OpenAPI documentation
- `DEPLOYMENT_COMPLETE.md` — Production deployment guide
- `CURRENT_STATUS.md` — Current development state
- `MANIFESTO.md` — Product vision
- `specs/` — Feature specifications and plans
- `.specify/memory/constitution.md` — Product principles

---

Last updated: 2026-02-07
