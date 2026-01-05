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
npm run typecheck    # TypeScript checking
npm test             # Unit + integration tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run test:e2e:ui  # E2E with interactive UI

# Analysis
npm run analyze      # Bundle analysis
npm run lighthouse   # Performance audit
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.4.5 (App Router), React 19 |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS 4.0, shadcn/ui components |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (signed URLs) |
| Auth | Supabase Auth (OAuth + email) |
| Payments | Stripe (checkout + webhooks) |
| AI | Replicate API (SwinIR model) |
| Monitoring | Sentry, Vercel Analytics |
| Testing | Vitest, Playwright |

## Project Structure

```
retrophoto/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── restore/route.ts      # Main restoration endpoint
│   │   ├── quota/route.ts        # Free tier quota check
│   │   ├── create-checkout-session/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── analytics/route.ts
│   │   └── cron/expire-credits/route.ts
│   ├── app/page.tsx              # Main application
│   ├── result/[sessionId]/       # Result display
│   ├── auth/                     # Auth pages + callback
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── auth/                     # Auth components
│   ├── credits/                  # Credit system UI
│   ├── upload-zone.tsx           # Drag-drop upload
│   ├── restore-progress.tsx      # Progress indicator
│   ├── comparison-slider.tsx     # Before/after slider
│   ├── zoom-viewer.tsx           # Pinch-to-zoom
│   └── share-sheet.tsx           # Social sharing
│
├── lib/                          # Core utilities
│   ├── ai/restore.ts             # AI model integration
│   ├── auth/client.ts            # Auth utilities
│   ├── credits/                  # Credit tracking
│   ├── metrics/analytics.ts      # Event tracking
│   ├── observability/            # Logging + alerts
│   ├── pwa/                      # PWA background sync
│   ├── quota/tracker.ts          # Free tier quota
│   ├── share/                    # OG cards, GIFs, deep links
│   ├── storage/uploads.ts        # File upload utilities
│   ├── supabase/                 # DB clients
│   └── utils.ts                  # Common utilities
│
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # API integration tests
│   ├── e2e/                      # Playwright E2E
│   └── security/                 # Security tests
│
├── specs/                        # Feature specifications
├── middleware.ts                 # Auth middleware
├── tailwind.config.ts            # Tailwind + design tokens
└── vitest.config.ts              # Test configuration
```

## Architecture Overview

### Request Flow
```
Client → Middleware (auth) → API Route → Service Layer → External APIs
                                            ↓
                                      Supabase (DB + Storage)
```

### Key Patterns

1. **Guest Mode + Fingerprinting**: Anonymous users tracked via browser fingerprint for quota
2. **Server-Side AI**: All model invocations are server-only (API keys never exposed)
3. **RLS Security**: Row-Level Security enforced on all database tables
4. **Fail-Closed Quota**: If quota check fails, deny access (security-first)
5. **Webhook Idempotency**: Database-backed duplicate detection for Stripe events

## Database Schema

### Core Tables
- `user_quota` - Free tier tracking (fingerprint → restore_count)
- `upload_sessions` - Restoration sessions with TTL (24h auto-delete)
- `restoration_results` - AI outputs (restored_url, og_card, gif, deep_link)
- `user_credits` - Credit balance per user
- `credit_batches` - Purchase history with expiration (1 year)
- `payment_transactions` - Stripe payment records
- `stripe_webhook_events` - Webhook audit log (idempotency)

### RPC Functions
```sql
check_quota(user_fingerprint)      -- Check free tier quota
deduct_credit(p_user_id)           -- Deduct one credit
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
| POST | `/api/analytics` | Track TTM/events |
| POST | `/api/cron/expire-credits` | Scheduled credit expiration |

### API Response Patterns
```typescript
// Success
{ session_id, restored_url, og_card_url, gif_url, deep_link, ttm_seconds }

// Error
{ error: string, error_code: string, upgrade_url?: string }

// Error codes: QUOTA_EXCEEDED, INVALID_FILE_TYPE, FILE_TOO_LARGE,
//              AI_MODEL_ERROR, MISSING_FINGERPRINT, CREDIT_DEDUCTION_FAILED
```

## Code Conventions

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Path alias: `@/*` maps to project root
- Prefer explicit types over `any`

### Component Patterns
```typescript
// Use cn() for conditional classes
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
    // 1. Parse + validate input
    // 2. Check auth/quota
    // 3. Process request
    // 4. Return JSON response
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

## Testing

### Unit Tests (Vitest)
```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- path/to/test    # Run specific test
```

Test files: `*.test.ts` or `*.spec.ts` alongside source files

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Headless
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:prod       # Against production
```

Test files: `tests/e2e/*.spec.ts`

### Key Test Suites
- `tests/integration/api-restore.test.ts` - Full restoration flow
- `tests/integration/payment-flow.test.ts` - Stripe integration
- `tests/security/quota-fail-closed.test.ts` - Security invariants

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
# Multi-model AI (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
XAI_API_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=
```

## Performance SLOs

From the product constitution:
- **TTM p50**: ≤6 seconds (Time-to-Magic)
- **TTM p95**: ≤12 seconds
- **First interactive**: <1.5s on mid-tier devices
- **Failed restores**: <1% (with automatic retry once)
- **Uptime**: 99.9%

## Design System

### Touch Targets
- Minimum: 44×44px (WCAG AAA)
- Spacing between targets: ≥8px
- Primary actions in thumb-reach zone (bottom 60%)

### Typography (tailwind.config.ts)
- Hero: 36px
- Section: 24px
- Body: 18px
- Caption: 14px

### Colors
Dark-first design with muted tones and soft gradients.

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
2. Use `createClient()` from `@/lib/supabase/server` for DB
3. Add error handling with standardized error codes
4. Add logging via `logger`
5. Add integration tests in `tests/integration/`

### Adding a Component
1. Create in `components/` (or `components/ui/` for primitives)
2. Use `cn()` for class merging
3. Respect mobile-first and accessibility requirements
4. Add animations via Framer Motion (respect `prefers-reduced-motion`)

### Working with Credits
1. Check auth: `supabase.auth.getUser()`
2. Query credits: `user_credits.available_credits`
3. Deduct: `rpc('deduct_credit', { p_user_id })`
4. Add: `rpc('add_credits', { ... })`

### Handling Webhooks
1. Verify Stripe signature
2. Check idempotency in `stripe_webhook_events`
3. Process event
4. Update processing_status

## Troubleshooting

### "QUOTA_EXCEEDED" errors
- Check `user_quota` table for fingerprint
- Verify quota logic in `lib/quota/tracker.ts`

### Stripe webhook failures
- Check `stripe_webhook_events` for error status
- Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
- Check Stripe dashboard for delivery status

### AI restoration failures
- Check Replicate API status
- Verify `REPLICATE_API_TOKEN` is valid
- Check image resolution/format requirements

## Additional Documentation

- `README.md` - Full project overview
- `API_SPECIFICATION.md` - OpenAPI documentation
- `DEPLOYMENT_COMPLETE.md` - Production deployment guide
- `specs/` - Feature specifications and plans
- `.specify/memory/constitution.md` - Product principles

---

Last updated: 2025-12-28
