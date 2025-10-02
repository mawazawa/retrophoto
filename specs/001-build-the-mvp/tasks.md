# Tasks: MVP Landing Page

**Input**: Design documents from `/Users/mathieuwauters/Desktop/code/retrophoto/specs/001-build-the-mvp/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- **Tests**: `tests/e2e/`, `tests/integration/`, `tests/unit/`

---

## Phase 3.1: Setup

- [ ] T001: Initialize Next.js 15.4.5 project with TypeScript strict mode in repository root
- [ ] T002: Configure Tailwind CSS 4.0 beta with custom theme (36/24/18/14 typography, calm palette, soft gradients)
- [ ] T003: [P] Install and configure shadcn/ui (init + add button, dialog, progress components)
- [ ] T004: [P] Set up ESLint with strict rules and eslint-plugin-jsx-a11y for WCAG enforcement
- [ ] T005: [P] Configure Prettier with Tailwind plugin for consistent formatting
- [ ] T006: Initialize Supabase project and configure connection (lib/supabase/client.ts and lib/supabase/server.ts)
- [ ] T007: [P] Set up Playwright for E2E tests (playwright.config.ts, tests/e2e/ directory)
- [ ] T008: [P] Set up Vitest for unit tests (vitest.config.ts, tests/unit/ directory)
- [ ] T009: [P] Configure Lighthouse CI for performance/accessibility audits (.lighthouserc.json)
- [ ] T010: Create environment variables template (.env.local.example) with Supabase, Replicate API keys

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T011: [P] Contract test POST /api/restore with valid image → 200 + session_id in tests/integration/api-restore.test.ts
- [ ] T012: [P] Contract test POST /api/restore with oversized image (>20MB) → 400 in tests/integration/api-restore.test.ts
- [ ] T013: [P] Contract test POST /api/restore with invalid file type → 400 in tests/integration/api-restore.test.ts
- [ ] T014: [P] Contract test POST /api/restore when quota exhausted → 429 in tests/integration/api-restore.test.ts
- [ ] T015: [P] Contract test GET /api/quota with new fingerprint → remaining: 1 in tests/integration/api-quota.test.ts
- [ ] T016: [P] Contract test GET /api/quota after 1 restore → remaining: 0 in tests/integration/api-quota.test.ts

### E2E Tests (User Journeys)
- [ ] T017: [P] E2E test: Upload → Restore → Preview flow completes <30s (NSM) in tests/e2e/upload-flow.spec.ts
- [ ] T018: [P] E2E test: Before/after slider interaction at 60fps in tests/e2e/restore-flow.spec.ts
- [ ] T019: [P] E2E test: Share button opens native share sheet with OG card in tests/e2e/share-flow.spec.ts
- [ ] T020: [P] E2E test: Second upload triggers quota exceeded + upgrade prompt in tests/e2e/quota-flow.spec.ts
- [ ] T021: [P] E2E test: Pinch-to-zoom on result image focuses on faces in tests/e2e/zoom-flow.spec.ts

### Integration Tests (Component Behavior)
- [ ] T022: [P] Integration test: File upload validation (20MB limit, JPEG/PNG/HEIC/WEBP only) in tests/integration/upload-validation.test.ts
- [ ] T023: [P] Integration test: Fingerprint tracking persists across sessions in tests/integration/quota-tracker.test.ts

---

## Phase 3.3: Database Schema (ONLY after tests are failing)

- [ ] T024: [P] Create Supabase migration 001: CREATE ENUM types (session_status, event_type) in lib/supabase/migrations/001_create_enums.sql
- [ ] T025: [P] Create Supabase migration 002: CREATE TABLE user_quota with indexes and RLS policies in lib/supabase/migrations/002_user_quota.sql
- [ ] T026: [P] Create Supabase migration 003: CREATE TABLE upload_sessions with FK and indexes in lib/supabase/migrations/003_upload_sessions.sql
- [ ] T027: [P] Create Supabase migration 004: CREATE TABLE restoration_results with 1:1 FK and CASCADE in lib/supabase/migrations/004_restoration_results.sql
- [ ] T028: [P] Create Supabase migration 005: CREATE TABLE analytics_events with indexes in lib/supabase/migrations/005_analytics_events.sql
- [ ] T029: Create Supabase migration 006: CREATE FUNCTION check_quota(fingerprint TEXT) in lib/supabase/migrations/006_check_quota_function.sql
- [ ] T030: Create Supabase migration 007: CREATE FUNCTION cleanup_expired_sessions() in lib/supabase/migrations/007_cleanup_function.sql
- [ ] T031: Create Supabase migration 008: Schedule cron job for cleanup (hourly) in lib/supabase/migrations/008_cron_schedule.sql
- [ ] T032: [P] Create Supabase Storage bucket 'uploads' with 20MB limit, 24h TTL, RLS in Supabase dashboard or migration
- [ ] T033: [P] Create Supabase Storage bucket 'restorations' (public, CDN-cached) in Supabase dashboard or migration
- [ ] T034: Run all migrations: npx supabase db push (verify schema in Supabase dashboard)

---

## Phase 3.4: Core Implementation - Library Utilities

### Supabase Client Setup
- [ ] T035: [P] Create Supabase browser client with auth config in lib/supabase/client.ts
- [ ] T036: [P] Create Supabase server client for API routes in lib/supabase/server.ts

### Storage Helpers
- [ ] T037: [P] Create upload helper: uploadOriginalImage(file, fingerprint) → Supabase Storage URL in lib/storage/uploads.ts
- [ ] T038: [P] Create storage helper: uploadRestoredImage(file, sessionId) → public URL in lib/storage/uploads.ts

### AI Integration
- [ ] T039: Create Replicate API client with NanoBana model integration in lib/ai/restore.ts
- [ ] T040: Implement retry logic (max 1 retry) with exponential backoff using p-retry in lib/ai/restore.ts

### Share Artifact Generation
- [ ] T041: [P] Create OG card generator using @vercel/og (before→after split layout) in lib/share/og-card.ts
- [ ] T042: [P] Create GIF generator using gifenc (2-3s wipe reveal, <5MB) in lib/share/gif-generator.ts
- [ ] T043: [P] Create deep link generator (format: /result/[sessionId]) in lib/share/deep-link.ts

### Quota Tracking
- [ ] T044: Create browser fingerprint utility using @fingerprintjs/fingerprintjs in lib/quota/tracker.ts
- [ ] T045: Create server-side quota validation (calls Supabase check_quota function) in lib/quota/tracker.ts

### Metrics & Analytics
- [ ] T046: [P] Create TTM tracking utility (server-side timestamps) in lib/metrics/analytics.ts
- [ ] T047: [P] Create NSM tracking utility (performance.mark + beacon API) in lib/metrics/analytics.ts

### Utilities
- [ ] T048: [P] Create image validation utilities (file type, size <20MB) in lib/utils.ts
- [ ] T049: [P] Create error handling utilities (friendly error messages) in lib/utils.ts

---

## Phase 3.5: Core Implementation - API Routes

- [ ] T050: Implement POST /api/restore endpoint (multipart upload, AI processing, share artifacts) in app/api/restore/route.ts
- [ ] T050a: Validate restored image output is 2048px longest edge (FR-006 compliance) in app/api/restore/route.ts
- [ ] T051: Implement GET /api/quota endpoint (fingerprint-based quota check) in app/api/quota/route.ts
- [ ] T052: Implement GET /api/og-card/[sessionId] Edge Function (dynamic OG card generation) in app/api/og-card/[sessionId]/route.tsx
- [ ] T053: [P] Implement POST /api/analytics endpoint (beacon receiver for NSM tracking) in app/api/analytics/route.ts

---

## Phase 3.6: Core Implementation - React Components

### shadcn/ui Base Components (already installed via T003)
- [ ] T054: [P] Customize Progress component for shimmer effect (gradient keyframe animation) in components/ui/progress.tsx
- [ ] T055: [P] Customize Dialog component for upgrade prompt styling in components/ui/dialog.tsx

### Custom Feature Components
- [ ] T056: [P] Create UploadZone component (drag-drop, file validation, shimmer progress) in components/upload-zone.tsx
- [ ] T056a: [P] Implement haptic feedback via Vibration API on upload complete (FR-023) in components/upload-zone.tsx
- [ ] T057: [P] Create RestoreProgress component (shimmer indicator, reassuring micro-copy) in components/restore-progress.tsx
- [ ] T057a: [P] Implement haptic feedback via Vibration API on restore complete (FR-023) in components/restore-progress.tsx
- [ ] T058: Create ComparisonSlider component (react-compare-slider wrapper, 60fps interaction) in components/comparison-slider.tsx
- [ ] T059: Create ZoomViewer component (pinch-to-zoom, face detection focus using face-api.js) in components/zoom-viewer.tsx
- [ ] T060: [P] Create ShareSheet component (Web Share API with copy-link fallback) in components/share-sheet.tsx
- [ ] T061: [P] Create UpgradePrompt component (tasteful modal, dismissible, not blocking) in components/upgrade-prompt.tsx
- [ ] T062: [P] Create WatermarkBadge component (subtle corner badge, not across faces) in components/watermark-badge.tsx

---

## Phase 3.7: Core Implementation - Pages

- [ ] T063: Create root layout with dark theme, fonts, metadata in app/layout.tsx
- [ ] T064: Create global styles (Tailwind base, custom CSS variables) in app/globals.css
- [ ] T065: Implement landing page (upload UI, quota check, NSM tracking) in app/page.tsx
- [ ] T066: Implement result page (slider, zoom, share, upgrade prompt) in app/result/[id]/page.tsx
- [ ] T066a: Implement confetti pulse animation on restore complete using Framer Motion (DR-005) in app/result/[id]/page.tsx
- [ ] T067: [P] Create offline fallback page (PWA offline shell) in app/offline/page.tsx
- [ ] T068: [P] Create 404 page (custom not found) in app/not-found.tsx

---

## Phase 3.8: Integration - PWA Configuration

- [ ] T069: Install and configure next-pwa plugin in next.config.js
- [ ] T070: [P] Create PWA manifest (name, icons 192x512, theme color) in public/manifest.json
- [ ] T071: [P] Create service worker with network-first API, cache-first static strategy (auto-generated by next-pwa, customize if needed)
- [ ] T072: [P] Add PWA icons (192x192, 512x512) in public/icons/
- [ ] T073: Configure background sync for queued uploads (Workbox BackgroundSyncPlugin) in next.config.js

---

## Phase 3.9: Integration - Observability

- [ ] T074: [P] Initialize Sentry for error tracking (sentry.client.config.ts, sentry.server.config.ts)
- [ ] T075: [P] Configure Vercel Analytics in app/layout.tsx
- [ ] T076: Create custom Sentry alerts for TTM p95 >12s threshold in Sentry dashboard
- [ ] T077: [P] Add structured logging for TTM/NSM metrics in lib/metrics/analytics.ts

---

## Phase 3.10: Polish - Unit Tests

- [ ] T078: [P] Unit test: File upload validation logic in tests/unit/upload-validation.test.ts
- [ ] T079: [P] Unit test: Quota tracker fingerprint generation in tests/unit/quota-tracker.test.ts
- [ ] T080: [P] Unit test: Deep link URL formatting in tests/unit/deep-link.test.ts
- [ ] T081: [P] Unit test: Error message generation in tests/unit/error-messages.test.ts

---

## Phase 3.11: Polish - Performance Optimization

- [ ] T082: Implement lazy loading for ComparisonSlider component using React.lazy in app/result/[id]/page.tsx
- [ ] T083: Implement lazy loading for ZoomViewer component using React.lazy in app/result/[id]/page.tsx
- [ ] T084: [P] Optimize images with next/image (blur placeholder, responsive sizes) in all components
- [ ] T085: [P] Add preload hints for critical fonts in app/layout.tsx
- [ ] T086: Run Lighthouse audit: ensure Performance ≥80, Accessibility ≥90 (adjust as needed)
- [ ] T086a: Manual test: upload already-high-quality image, verify graceful micro-copy for minimal restoration delta ("Your photo looks great already!")

---

## Phase 3.12: Polish - Accessibility Refinement

- [ ] T087: [P] Implement keyboard navigation for ComparisonSlider (Arrow keys, Tab, Space/Enter) in components/comparison-slider.tsx
- [ ] T088: [P] Add ARIA live regions for progress updates in components/restore-progress.tsx
- [ ] T089: [P] Add ARIA labels for all interactive elements (upload button, slider, share button) in all components
- [ ] T090: [P] Verify touch target sizing ≥44px for all buttons/links (add Tailwind .min-touch-44 class)
- [ ] T091: Run axe accessibility audit: fix all critical and serious issues (via Lighthouse or axe DevTools)
- [ ] T092: Test with screen readers: NVDA (Windows), VoiceOver (Mac), ensure logical navigation

---

## Phase 3.13: Polish - Error Handling & Edge Cases

- [ ] T093: Implement friendly error messages for all 400/429/500 responses in app/api/restore/route.ts
- [ ] T094: [P] Add timeout handling (60s) with reassuring micro-copy in components/restore-progress.tsx
- [ ] T095: [P] Implement graceful degradation for JavaScript-disabled users (noscript tag in app/layout.tsx)
- [ ] T096: [P] Add loading states for slow connections (skeleton UI) in app/page.tsx and app/result/[id]/page.tsx

---

## Phase 3.14: Polish - Documentation

- [ ] T097: [P] Create README.md with setup instructions, env vars, npm scripts
- [ ] T098: [P] Document API endpoints (generate from OpenAPI specs in contracts/)
- [ ] T099: [P] Add inline code comments for complex logic (AI retry, quota enforcement, share generation)
- [ ] T100: [P] Create CONTRIBUTING.md with development workflow, testing guidelines

---

## Dependencies

### Critical Path (Sequential)
1. **Setup (T001-T010)** → All other phases
2. **Tests (T011-T023)** → Core Implementation (must fail first)
3. **Database Schema (T024-T034)** → API Routes (T050-T053)
4. **Library Utilities (T035-T049)** → API Routes (T050-T053)
5. **API Routes (T050-T053)** → Pages (T063-T068)
6. **Components (T054-T062)** → Pages (T063-T068)
7. **Core (T001-T068)** → Integration (T069-T077)
8. **Integration (T069-T077)** → Polish (T078-T100)

### Task-Level Dependencies
- T050 (POST /api/restore) depends on: T037-T038 (storage helpers), T039-T043 (AI integration + share artifact generation), T044-T045 (quota tracking and validation)
- T050a (resolution validation) depends on: T050 (must be implemented as part of restore endpoint)
- T051 (GET /api/quota) depends on: T045 (quota validation)
- T065 (landing page) depends on: T056-T057 (upload components), T044 (fingerprint)
- T066 (result page) depends on: T058-T062 (slider, zoom, share, upgrade components)
- T066a (confetti animation) depends on: T066 (must be integrated into result page)

---

## Parallel Execution Examples

### Setup Phase (Run Together)
```bash
# Launch T003, T004, T005, T007, T008, T009 in parallel:
Task: "Install and configure shadcn/ui (init + add button, dialog, progress components)"
Task: "Set up ESLint with strict rules and eslint-plugin-jsx-a11y for WCAG enforcement"
Task: "Configure Prettier with Tailwind plugin for consistent formatting"
Task: "Set up Playwright for E2E tests (playwright.config.ts, tests/e2e/ directory)"
Task: "Set up Vitest for unit tests (vitest.config.ts, tests/unit/ directory)"
Task: "Configure Lighthouse CI for performance/accessibility audits (.lighthouserc.json)"
```

### Contract Tests (Run Together)
```bash
# Launch T011-T016 in parallel (different files):
Task: "Contract test POST /api/restore with valid image → 200 + session_id in tests/integration/api-restore.test.ts"
Task: "Contract test POST /api/restore with oversized image (>20MB) → 400 in tests/integration/api-restore.test.ts"
Task: "Contract test POST /api/restore with invalid file type → 400 in tests/integration/api-restore.test.ts"
Task: "Contract test POST /api/restore when quota exhausted → 429 in tests/integration/api-restore.test.ts"
Task: "Contract test GET /api/quota with new fingerprint → remaining: 1 in tests/integration/api-quota.test.ts"
Task: "Contract test GET /api/quota after 1 restore → remaining: 0 in tests/integration/api-quota.test.ts"
```

### E2E Tests (Run Together)
```bash
# Launch T017-T021 in parallel (independent test files):
Task: "E2E test: Upload → Restore → Preview flow completes <30s (NSM) in tests/e2e/upload-flow.spec.ts"
Task: "E2E test: Before/after slider interaction at 60fps in tests/e2e/restore-flow.spec.ts"
Task: "E2E test: Share button opens native share sheet with OG card in tests/e2e/share-flow.spec.ts"
Task: "E2E test: Second upload triggers quota exceeded + upgrade prompt in tests/e2e/quota-flow.spec.ts"
Task: "E2E test: Pinch-to-zoom on result image focuses on faces in tests/e2e/zoom-flow.spec.ts"
```

### Database Migrations (Run Together)
```bash
# Launch T024-T028 in parallel (different migration files):
Task: "Create Supabase migration 001: CREATE ENUM types (session_status, event_type) in lib/supabase/migrations/001_create_enums.sql"
Task: "Create Supabase migration 002: CREATE TABLE user_quota with indexes and RLS policies in lib/supabase/migrations/002_user_quota.sql"
Task: "Create Supabase migration 003: CREATE TABLE upload_sessions with FK and indexes in lib/supabase/migrations/003_upload_sessions.sql"
Task: "Create Supabase migration 004: CREATE TABLE restoration_results with 1:1 FK and CASCADE in lib/supabase/migrations/004_restoration_results.sql"
Task: "Create Supabase migration 005: CREATE TABLE analytics_events with indexes in lib/supabase/migrations/005_analytics_events.sql"
```

### Library Utilities (Run Together)
```bash
# Launch T035-T036, T037-T038, T041-T043, T046-T049 in parallel (different files):
Task: "Create Supabase browser client with auth config in lib/supabase/client.ts"
Task: "Create Supabase server client for API routes in lib/supabase/server.ts"
Task: "Create upload helper: uploadOriginalImage(file, fingerprint) → Supabase Storage URL in lib/storage/uploads.ts"
Task: "Create storage helper: uploadRestoredImage(file, sessionId) → public URL in lib/storage/uploads.ts"
Task: "Create OG card generator using @vercel/og (before→after split layout) in lib/share/og-card.ts"
Task: "Create GIF generator using gifenc (2-3s wipe reveal, <5MB) in lib/share/gif-generator.ts"
Task: "Create deep link generator (format: /result/[sessionId]) in lib/share/deep-link.ts"
Task: "Create TTM tracking utility (server-side timestamps) in lib/metrics/analytics.ts"
Task: "Create NSM tracking utility (performance.mark + beacon API) in lib/metrics/analytics.ts"
Task: "Create image validation utilities (file type, size <20MB) in lib/utils.ts"
Task: "Create error handling utilities (friendly error messages) in lib/utils.ts"
```

### React Components (Run Together)
```bash
# Launch T054-T057, T060-T062 in parallel (different component files):
Task: "Customize Progress component for shimmer effect (gradient keyframe animation) in components/ui/progress.tsx"
Task: "Customize Dialog component for upgrade prompt styling in components/ui/dialog.tsx"
Task: "Create UploadZone component (drag-drop, file validation, shimmer progress) in components/upload-zone.tsx"
Task: "Create RestoreProgress component (shimmer indicator, reassuring micro-copy) in components/restore-progress.tsx"
Task: "Create ShareSheet component (Web Share API with copy-link fallback) in components/share-sheet.tsx"
Task: "Create UpgradePrompt component (tasteful modal, dismissible, not blocking) in components/upgrade-prompt.tsx"
Task: "Create WatermarkBadge component (subtle corner badge, not across faces) in components/watermark-badge.tsx"
```

---

## Notes

- **TDD Enforcement**: Tests T011-T023 MUST be written and failing before starting implementation (T024+)
- **Parallel [P] Tasks**: Different files = safe to parallelize, same file = sequential
- **Constitutional Compliance**: All tasks must meet constitutional requirements (TTM ≤12s, WCAG AA, 44px targets, etc.)
- **Commit Strategy**: Commit after each completed task with meaningful message (e.g., "feat: implement POST /api/restore endpoint (T050)")
- **Testing Cadence**: Run relevant tests after each task (contract tests after API routes, E2E tests after pages)
- **Verification**: Execute quickstart.md scenarios after Phase 3.13 to validate all requirements

---

## Estimated Timeline

- **Phase 3.1 (Setup)**: 1-2 days
- **Phase 3.2 (Tests)**: 2-3 days
- **Phase 3.3 (Database)**: 1 day
- **Phase 3.4 (Library Utilities)**: 3-4 days
- **Phase 3.5 (API Routes)**: 2-3 days
- **Phase 3.6 (Components)**: 4-5 days
- **Phase 3.7 (Pages)**: 2-3 days
- **Phase 3.8-3.9 (Integration)**: 1-2 days
- **Phase 3.10-3.14 (Polish)**: 3-4 days

**Total**: ~20-30 days (single developer, full-time)

**With parallelization** (2-3 developers): ~12-18 days

---

**Task Count**: 105 tasks (T001-T100 + 5 subtasks: T050a, T056a, T057a, T066a, T086a)

*Based on Constitution v1.0.0 and Implementation Plan from specs/001-build-the-mvp/plan.md*
