# Implementation Plan: MVP Landing Page

**Branch**: `001-build-the-mvp` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/mathieuwauters/Desktop/code/retrophoto/specs/001-build-the-mvp/spec.md`

## Summary

Build the core RetroPhoto MVP: a mobile-first landing page where users upload old photos and receive AI-restored results within 30 seconds without creating an account. The experience centers on an Upload → Restore → Preview flow with an interactive before/after slider, auto-generated share artifacts (OG card, GIF, deep link), and tasteful monetization after value delivery. Constitutional requirements enforced: TTM p95 ≤12s, first interactive <1.5s, WCAG AA compliance, 44px touch targets, shimmer progress indicators, and subtle corner watermarking for free tier.

## Technical Context

**Language/Version**: TypeScript 5.7+ with strict mode
**Primary Dependencies**: Next.js 15.4.5 (App Router), React 19, Tailwind CSS 4.0 beta, shadcn/ui, Framer Motion
**Storage**: Supabase (Postgres with RLS, Storage with TTL policies, Auth for future phases)
**Testing**: Playwright (E2E), Vitest (unit), React Testing Library
**Target Platform**: Web (mobile-first PWA), Chrome/Safari/Firefox latest 2 versions
**Project Type**: Web (single Next.js application, no separate frontend/backend split for MVP)
**Performance Goals**:
- TTM p95: ≤12 seconds (constitutional SLO)
- TTM p50: ≤6 seconds (constitutional SLO)
- First interactive: <1.5 seconds on mid-tier devices
- Image decode: <300ms
- Slider interaction: 60fps (120fps on capable devices)
- Failed restores: <1% with auto-retry

**Constraints**:
- Upload size: ≤20MB
- Free tier quota: 1 restore per user (browser fingerprint tracking)
- Image retention: 24h auto-delete for free tier
- Server-side only AI model invocations (never expose keys)
- WCAG 2.1 AA minimum (AAA target)
- Offline-capable PWA shell

**Scale/Scope**:
- MVP single-page application
- Estimated 1000 beta users for initial launch
- Target: 30s to first restored preview (NSM)
- No authentication required for MVP (quota via browser fingerprint)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Mission & Core Values
- **Zero Friction to Wow**: Upload → Restore → Preview with no sign-up/paywall → COMPLIANT (FR-002, FR-015)
- **Delight > Everything**: Shimmer progress, confetti success, interactive slider → COMPLIANT (DR-004, DR-005)
- **Beauty as Moat**: Typography hierarchy, soft gradients, immersive slider → COMPLIANT (DR-001, DR-002, DR-003)

### ✅ Principle III: Mobile-First Always
- 44px touch targets → COMPLIANT (FR-019)
- Single-column layout → COMPLIANT (FR-001)
- Sticky bottom CTA in thumb-reach zone → COMPLIANT (FR-025)
- 3G latency budgets → COMPLIANT (PR-006)

### ✅ Principle IV: First-Run Nirvana
- No sign-up before first restore → COMPLIANT (FR-002)
- No pricing wall before preview → COMPLIANT (FR-015)
- No settings/preferences screens → COMPLIANT (two-step flow only)

### ✅ Principle V: Share-Ready by Default
- Auto-generated OG card, GIF, deep link → COMPLIANT (FR-009)
- Native OS share sheet → COMPLIANT (FR-010)

### ✅ Principle VI: Trust & Privacy
- Server-side only model invocations → COMPLIANT (FR-005)
- 24h auto-delete for free tier → COMPLIANT (FR-013)
- No API key exposure → COMPLIANT (FR-005)

### ✅ Principle VII: Tasteful Monetization
- Preview never blocked → COMPLIANT (FR-015)
- Subtle corner watermark (not across faces) → COMPLIANT (FR-011)
- Upgrade prompt after value delivery → COMPLIANT (FR-015)

### ✅ Principle VIII: North-Star Metrics & Quality Bars
- NSM: 30s to preview → TRACKED (FR-012, FR-024)
- TTM p95: ≤12s → ENFORCED (PR-001, FR-020)
- TTM p50: ≤6s → ENFORCED (PR-002, FR-020)
- Failed restores <1% with retry → ENFORCED (PR-007, FR-014)

### ✅ Principle IX: Experience Pillars
- Two-step flow (Upload → Restore) → COMPLIANT (FR-001)
- Interactive before/after slider → COMPLIANT (FR-007)
- Pinch-to-zoom with face focus → COMPLIANT (FR-008)
- One-tap native share → COMPLIANT (FR-010)

### ✅ Principle X: Mobile-First Design Specifications
- Sticky bottom CTA → COMPLIANT (FR-025)
- Safe areas (notch/gesture bars) → COMPLIANT (DR-006)
- Haptic feedback → COMPLIANT (FR-023)
- PWA offline shell → COMPLIANT (FR-022)

### ✅ Principle XIV: Architecture Standards
- Next.js 15+ App Router → COMPLIANT (architecture choice)
- Tailwind + shadcn/ui → COMPLIANT (DR-001)
- Supabase (Auth, Postgres, Storage, RLS) → COMPLIANT (architecture choice)
- Server Actions for restore API → COMPLIANT (design decision)
- Sentry + structured logs → COMPLIANT (observability requirement)

### ✅ Principle XV: Performance & Cost Guardrails
- P95 compute: ≤$0.03/image → MONITORED (cost tracking required)
- Idempotent job keys → REQUIRED (retry logic)
- Circuit breaker on surge → REQUIRED (queue management)

### ✅ Principle XVI: Privacy, Security, Compliance
- Server-side only invocations → COMPLIANT (FR-005)
- 24h TTL auto-delete → COMPLIANT (FR-013)
- WCAG 2.1 AA → COMPLIANT (FR-019)
- Clear AI disclosure → COMPLIANT (watermark badge)

### ✅ Principle XVII: Design System
- Tailwind + shadcn/ui → COMPLIANT
- 36/24/18/14 typography → COMPLIANT (DR-001)
- Shimmer progress, confetti success → COMPLIANT (DR-004, DR-005)
- Dark-first with light mode → REQUIRED (Phase 1: dark theme; Phase 2: light mode toggle with system preference detection)

**Constitution Check Result**: ✅ PASS - All principles compliant, no violations requiring justification.

## Project Structure

### Documentation (this feature)
```
specs/001-build-the-mvp/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── restore-api.yaml # POST /api/restore endpoint
│   └── quota-api.yaml   # GET /api/quota endpoint
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

Since this is a **Next.js web application** (not separate frontend/backend), we use the App Router structure:

```
retrophoto/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (dark theme, fonts, metadata)
│   ├── page.tsx                 # Landing page (upload UI)
│   ├── globals.css              # Tailwind base + custom CSS
│   ├── api/                     # API routes
│   │   ├── restore/route.ts    # POST /api/restore (server-side AI call)
│   │   └── quota/route.ts      # GET /api/quota (check user quota)
│   └── result/[id]/page.tsx    # Result page (slider, share)
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── upload-zone.tsx          # Drag-drop upload with validation
│   ├── restore-progress.tsx     # Shimmer progress indicator
│   ├── comparison-slider.tsx    # Before/after interactive slider
│   ├── zoom-viewer.tsx          # Pinch-to-zoom with face detection
│   ├── share-sheet.tsx          # Native share integration
│   └── upgrade-prompt.tsx       # Tasteful monetization modal
│
├── lib/                         # Utilities and services
│   ├── supabase/
│   │   ├── client.ts           # Supabase client (browser)
│   │   ├── server.ts           # Supabase server client
│   │   └── schema.sql          # Database schema
│   ├── ai/
│   │   └── restore.ts          # NanoBana API integration
│   ├── storage/
│   │   └── uploads.ts          # Supabase Storage helpers
│   ├── share/
│   │   ├── og-card.ts          # Generate OG card image
│   │   ├── gif-generator.ts    # Generate animated GIF
│   │   └── deep-link.ts        # Generate shareable URL
│   ├── quota/
│   │   └── tracker.ts          # Browser fingerprint tracking
│   ├── metrics/
│   │   └── analytics.ts        # TTM, NSM tracking
│   └── utils.ts                # Shared utilities
│
├── public/                      # Static assets
│   ├── fonts/                  # Typography assets
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
│
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   │   ├── upload-flow.spec.ts
│   │   ├── restore-flow.spec.ts
│   │   └── share-flow.spec.ts
│   ├── integration/            # Integration tests
│   │   ├── api-restore.test.ts
│   │   └── api-quota.test.ts
│   └── unit/                   # Vitest unit tests
│       ├── upload-validation.test.ts
│       └── quota-tracker.test.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── playwright.config.ts
├── vitest.config.ts
└── .env.local.example
```

**Structure Decision**: Next.js App Router (single application) chosen because:
- MVP scope doesn't require separate frontend/backend repos
- Server Actions provide server-side security for AI model calls
- App Router enables streaming for progress indicators
- Simplified deployment (single Vercel project)
- Constitutional architecture (Principle XIV) specifies Next.js with App Router

## Phase 0: Outline & Research

No NEEDS CLARIFICATION markers in Technical Context. All requirements clearly specified in constitution and feature spec. Research focuses on implementation best practices and library selection.

### Research Tasks:

1. **Next.js 15.4.5 App Router Best Practices**
   - Server Actions vs API Routes for AI model invocations
   - Streaming responses for real-time progress
   - Image optimization with next/image
   - PWA configuration in Next.js 15

2. **shadcn/ui Component Selection**
   - Button (primary CTA)
   - Progress (shimmer effect customization)
   - Dialog (upgrade prompt)
   - Identify gaps requiring custom components (slider, zoom viewer)

3. **Before/After Slider Implementation**
   - React libraries: react-compare-slider, react-before-after-slider-component
   - Performance requirements: 60fps interaction
   - Touch gesture support (pinch-to-zoom, swipe)
   - Accessibility (keyboard navigation, screen reader support)

4. **Image Processing Pipeline**
   - Client-side validation (file type, size <20MB)
   - Server-side processing (resize, optimize for AI model)
   - CDN strategy (Cloudflare R2 or Supabase Storage CDN)
   - TTL auto-deletion implementation (Supabase Storage lifecycle policies)

5. **AI Model Integration (NanoBana)**
   - API endpoint, authentication method
   - Request/response format
   - Rate limiting and circuit breaker patterns
   - Cost per request (budget ≤$0.03/image)
   - Retry logic for transient failures

6. **Share Artifact Generation**
   - OG card: Canvas API or headless browser (Playwright)
   - Animated GIF: gifenc, gif.js, or canvas-to-gif
   - Deep link routing strategy (result/[id] dynamic route)
   - Native share sheet integration (Web Share API)

7. **Quota Tracking Without Authentication**
   - Browser fingerprinting library: @fingerprintjs/fingerprintjs-pro or ClientJS
   - Server-side validation (prevent client manipulation)
   - Supabase RLS policies for quota enforcement
   - Privacy implications and GDPR compliance

8. **Performance Monitoring**
   - TTM tracking (server-side timestamps)
   - NSM tracking (client-side analytics)
   - Sentry integration for error tracking
   - Vercel Analytics vs custom solution

9. **Accessibility Requirements**
   - WCAG 2.1 AA automated testing tools (axe-core, Lighthouse CI)
   - Keyboard navigation patterns for slider
   - Screen reader announcements for progress states
   - Touch target sizing enforcement

10. **PWA Implementation**
    - Service worker strategy (network-first for API, cache-first for static)
    - Offline shell UI
    - Background sync for queued uploads
    - next-pwa vs manual implementation

**Output**: research.md with decisions, rationale, and alternatives

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Extract entities from feature spec → `data-model.md`

**Entities**:
- **UploadSession**: id (UUID), user_fingerprint (string), original_url (string), status (enum: pending/processing/complete/failed), created_at (timestamp), ttl_expires_at (timestamp), retry_count (int)
- **RestorationResult**: id (UUID), session_id (FK), restored_url (string), og_card_url (string), gif_url (string), deep_link (string), watermark_applied (boolean), created_at (timestamp), cdn_cached (boolean)
- **UserQuota**: fingerprint (PK string), restore_count (int), last_restore_at (timestamp), created_at (timestamp)
- **AnalyticsEvent**: id (UUID), event_type (enum: upload_start/restore_complete/share_click/upgrade_view), session_id (FK), ttm_seconds (decimal), created_at (timestamp)

**Validation Rules**:
- UploadSession.original_url: Must be valid Supabase Storage URL
- UploadSession.retry_count: Max 1 (constitutional SLO)
- UserQuota.restore_count: Max 1 for free tier enforcement
- AnalyticsEvent.ttm_seconds: Flag if >30s (NSM threshold), >12s (p95 threshold)

**State Transitions**:
- UploadSession: pending → processing → complete/failed
- On failed + retry_count < 1: processing → pending (retry)
- On ttl_expires_at reached: any state → deleted (Supabase cron job)

### 2. Generate API contracts → `/contracts/`

**restore-api.yaml** (POST /api/restore):
```yaml
openapi: 3.0.0
paths:
  /api/restore:
    post:
      summary: Restore uploaded photo using AI
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: Image file (JPEG, PNG, HEIC, WEBP)
                fingerprint:
                  type: string
                  description: Browser fingerprint for quota tracking
              required: [file, fingerprint]
      responses:
        '200':
          description: Restoration complete
          content:
            application/json:
              schema:
                type: object
                properties:
                  session_id:
                    type: string
                    format: uuid
                  restored_url:
                    type: string
                    format: uri
                  og_card_url:
                    type: string
                    format: uri
                  gif_url:
                    type: string
                    format: uri
                  deep_link:
                    type: string
                    format: uri
                  ttm_seconds:
                    type: number
                    format: float
        '400':
          description: Invalid file (type, size, or format)
        '429':
          description: Quota exceeded (free tier limit reached)
        '500':
          description: Processing failed (after retry)
```

**quota-api.yaml** (GET /api/quota):
```yaml
openapi: 3.0.0
paths:
  /api/quota:
    get:
      summary: Check user quota remaining
      parameters:
        - name: fingerprint
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Quota status
          content:
            application/json:
              schema:
                type: object
                properties:
                  remaining:
                    type: integer
                    description: Number of free restores remaining
                  limit:
                    type: integer
                    description: Total free tier limit (1)
                  requires_upgrade:
                    type: boolean
```

### 3. Generate contract tests

**tests/integration/api-restore.test.ts**:
- Test: POST /api/restore with valid image → 200 + session_id
- Test: POST /api/restore with oversized image (>20MB) → 400
- Test: POST /api/restore with invalid file type → 400
- Test: POST /api/restore when quota exhausted → 429
- Test: POST /api/restore with processing failure → retry once → 500 if still fails
- **These tests MUST FAIL initially (no implementation yet)**

**tests/integration/api-quota.test.ts**:
- Test: GET /api/quota with new fingerprint → remaining: 1
- Test: GET /api/quota after 1 restore → remaining: 0
- **These tests MUST FAIL initially**

### 4. Extract test scenarios from user stories → `quickstart.md`

**Quickstart Test Scenarios** (manual verification):
1. Landing page loads <1.5s on mobile (Lighthouse audit)
2. Upload button is prominent, 44px touch target measured
3. Upload photo (<20MB JPEG) → shimmer progress appears
4. Processing completes <12s → before/after slider renders
5. Slider interaction 60fps (Chrome DevTools Performance)
6. Pinch-to-zoom works on mobile Safari (manual touch test)
7. Tap share button → native share sheet opens with OG card preview
8. View deep link in new tab → slider recreates successfully
9. Attempt second upload → upgrade prompt appears (not blocking)
10. Verify watermark badge in corner (not across face)

### 5. Update agent file (CLAUDE.md)

Run script: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`

**Output**: data-model.md, /contracts/*, failing integration tests, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → Supabase schema + migration task [P]
- Each component → React component + unit test task [P]
- Each user story → E2E test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- **Setup**: Next.js project init, Supabase setup, Tailwind config, shadcn/ui install
- **Tests First (TDD)**:
  - Contract tests for /api/restore and /api/quota [P]
  - E2E tests for upload, restore, share flows [P]
- **Core Implementation**:
  - Supabase schema (upload_sessions, restoration_results, user_quota, analytics_events) [P]
  - API routes (/api/restore, /api/quota)
  - React components (upload-zone, restore-progress, comparison-slider, zoom-viewer, share-sheet, upgrade-prompt) [P]
- **Integration**:
  - AI model integration (NanoBana API)
  - Share artifact generation (OG card, GIF, deep link)
  - Quota tracking (fingerprint + RLS)
  - Metrics tracking (TTM, NSM)
- **Polish**:
  - PWA configuration (manifest, service worker)
  - Accessibility audit (WCAG AA)
  - Performance optimization (lazy loading, image optimization)
  - Error handling refinement

**Estimated Output**: ~40-50 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

*No constitutional violations - this section is empty.*

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (none present)
- [x] Complexity deviations documented (none - fully compliant)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
