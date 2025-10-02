# RetroPhoto - AI Photo Restoration MVP

Restore old photos in seconds with AI. Turn damaged vintage photos into realistic HD.

## 🎯 Mission

RetroPhoto delivers zero-friction photo restoration for everyone. No sign-up, no paywall before value delivery—just upload and see your restored photo in seconds.

## ✨ Features

- **Zero-Friction Upload**: Drag-drop or tap to upload (no account required)
- **AI Restoration**: Powered by Codeformer model via Replicate API
- **Interactive Preview**: Before/after slider with 60fps smooth interaction
- **Pinch-to-Zoom**: Inspect facial details on mobile and desktop
- **One-Tap Sharing**: Native OS share sheet with auto-generated OG cards and GIFs
- **PWA Support**: Install as app, works offline with queued uploads
- **Free Tier**: 1 free restore per user (browser fingerprint tracking)
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support

## 🏗️ Tech Stack

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5.7 (strict mode)
- **Styling**: Tailwind CSS 4.0 + shadcn/ui
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: Replicate API (Codeformer model)
- **Analytics**: Sentry (error tracking + TTM alerts), Vercel Analytics
- **Testing**: Playwright (E2E), Vitest (unit), Lighthouse CI (performance)
- **PWA**: next-pwa with background sync

## 📦 Installation

```bash
# Clone repository
git clone <repo-url>
cd retrophoto

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your API keys (see Configuration section)

# Run database migrations
# (Instructions in supabase/migrations/README.md)

# Start development server
npm run dev
```

## ⚙️ Configuration

### Required Environment Variables

```env
# Supabase (database + storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Replicate API (AI restoration)
REPLICATE_API_TOKEN=your-replicate-api-token

# Sentry (error tracking + TTM monitoring)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

See `.env.local.example` for full list.

## 🚀 Development

```bash
# Start dev server
npm run dev

# Start with Turbopack (faster)
npm run dev:turbo

# Type checking
npm run typecheck

# Run tests
npm test                # Unit tests
npm run test:e2e        # E2E tests
npm run test:e2e:ui     # E2E with UI

# Performance audits
npm run lighthouse      # Lighthouse CI
npm run analyze         # Bundle size analysis
```

## 🏛️ Architecture

### Database Schema

- **user_quota**: Tracks free tier usage (1 restore per fingerprint)
- **upload_sessions**: Photo restoration sessions with status tracking
- **restoration_results**: AI-restored images + share artifacts (OG card, GIF, deep link)
- **analytics_events**: TTM/NSM metrics tracking

See `specs/001-build-the-mvp/data-model.md` for full schema.

### API Endpoints

- `POST /api/restore`: Main restoration endpoint (upload → AI → result)
- `GET /api/quota`: Check remaining quota for fingerprint
- `GET /api/og-card/[sessionId]`: Dynamic OG card generation
- `POST /api/analytics`: Track NSM/TTM metrics

See `specs/001-build-the-mvp/contracts/` for OpenAPI specs.

### Key Libraries

- **@supabase/ssr**: Supabase client (browser + server)
- **replicate**: AI model API client
- **react-compare-slider**: Before/after slider
- **react-zoom-pan-pinch**: Pinch-to-zoom viewer
- **@fingerprintjs/fingerprintjs**: Browser fingerprinting for quota
- **gifenc**: Animated GIF generation
- **sharp**: Image processing (resolution validation)
- **@sentry/nextjs**: Error tracking + performance monitoring
- **@vercel/analytics**: Web vitals tracking

## 📊 Performance Targets (Constitutional)

- **TTM p95**: ≤12 seconds (upload to restored result)
- **TTM p50**: ≤6 seconds
- **NSM**: ≤30 seconds (page load to preview visible)
- **First Interactive**: <1.5 seconds
- **Image Decode**: <300ms
- **Slider Interaction**: 60fps
- **LCP**: <2.5s, **CLS**: <0.1, **TBT**: <300ms

Monitored via Sentry alerts and Vercel Analytics.

## ♿ Accessibility

- **WCAG 2.1 AA** compliant (AAA target)
- Touch targets ≥44×44px (constitutional requirement)
- Keyboard navigation (Tab, Arrow keys, Space, Enter)
- Screen reader support (ARIA labels, live regions)
- `prefers-reduced-motion` support
- High contrast focus indicators

## 🧪 Testing

### Unit Tests (lib/)

```bash
npm test
```

- File validation (`validateImageFile`)
- Quota tracking (`generateFingerprint`)
- Deep link generation
- Error messages
- Logger formatting

### E2E Tests (tests/)

```bash
npm run test:e2e
```

- Contract tests (API spec compliance)
- Upload flow (drag-drop, validation)
- Slider interaction
- Share flow (native + fallback)
- Quota enforcement
- Zoom functionality

### Performance Tests

```bash
npm run lighthouse
```

Validates constitutional performance thresholds.

## 📱 PWA Features

- **Offline Shell**: Works without network
- **Background Sync**: Queued uploads retry when online
- **Push Notifications**: Restore completion alerts
- **Add to Home Screen**: Install as native-like app
- **Service Worker**: Caches images and API responses

## 🎨 Design System

### Typography Hierarchy (Constitutional)

- **Hero**: 36px (4xl)
- **Sections**: 24px (2xl)
- **Body**: 18px (lg)
- **Captions**: 14px (sm)

### Brand Primitives

- **Colors**: Calm, muted tones with soft gradients
- **Progress**: Shimmer effect (not spinners)
- **Success**: Subtle confetti pulse (2s, dismissible)
- **Haptics**: 50ms tap on upload/restore complete

### Mobile-First Design Specs

- Single-column layout
- Sticky bottom CTA (thumb-reach zone)
- Safe areas (iOS notch, Android gestures)
- 44px minimum touch targets

## 🔒 Privacy & Security

- **24h TTL**: Original uploads auto-delete after 24 hours
- **Server-Side AI**: API keys never exposed to client
- **No Auth for MVP**: Browser fingerprinting for quota (no PII)
- **RLS Policies**: Database-level security via Supabase

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Push to main branch (auto-deploys)
git push origin main

# Or deploy manually
vercel deploy --prod
```

### Environment Setup

1. Add all environment variables in Vercel dashboard
2. Configure Supabase project URL and keys
3. Add Replicate API token
4. Configure Sentry DSN for error tracking
5. Deploy database migrations via Supabase CLI

## 📚 Documentation

- **Specification**: `specs/001-build-the-mvp/spec.md` (25 functional requirements)
- **Implementation Plan**: `specs/001-build-the-mvp/plan.md` (technical decisions)
- **Data Model**: `specs/001-build-the-mvp/data-model.md` (4 tables, functions, RLS)
- **API Contracts**: `specs/001-build-the-mvp/contracts/` (OpenAPI 3.0)
- **Quickstart Testing**: `specs/001-build-the-mvp/quickstart.md` (8 manual test scenarios)
- **Tasks**: `specs/001-build-the-mvp/tasks.md` (105 tasks, TDD approach)

## 🏛️ Constitutional Principles

RetroPhoto follows 18 non-negotiable principles defined in `.specify/memory/constitution.md`:

1. **Mission**: Zero friction to wow
2. **User-Centric Obsession**: Empathy and clarity
3. **Mobile-First Always**: Touch-optimized, 44px targets
4. **First-Run Nirvana**: No sign-up before value
5. **Share-Ready by Default**: OG cards, GIFs, deep links
6. **Trust & Privacy**: 24h TTL, server-side processing
7. **Tasteful Monetization**: Preview never blocked
8. **North-Star Metrics**: NSM ≤30s, TTM p95 ≤12s
9. **Experience Pillars**: Two-step flow, interactive slider
10. **Mobile-First Design Specs**: Single-column, sticky CTA

See constitution.md for full list.

## 🤝 Contributing

See `CONTRIBUTING.md` for development workflow, code standards, and PR guidelines.

## 📄 License

[License type here]

## 🙏 Acknowledgments

- **Codeformer**: AI restoration model by sczhou
- **Replicate**: AI model hosting
- **Supabase**: Database and storage
- **Vercel**: Hosting and analytics
- **shadcn/ui**: UI component library
- **Claude Code**: AI-assisted development
