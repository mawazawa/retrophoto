# Feature Specification: MVP Landing Page

**Feature Branch**: `001-build-the-mvp`
**Created**: 2025-10-02
**Status**: Draft
**Input**: User description: "Build the MVP landing page with upload → restore → preview flow"

## User Scenarios & Testing

### Primary User Story

A user visits the RetroPhoto landing page with an old, damaged family photo they want to restore. Without needing to create an account or see pricing information, they immediately upload their photo. The system processes the image and presents a beautiful before/after comparison slider showing the restored result in medium resolution. The user can zoom into facial details, interact with the slider, and share the result via native OS share sheet—all within 30 seconds of arriving on the site.

### Acceptance Scenarios

1. **Given** a new visitor lands on the homepage, **When** they see the interface, **Then** the only visible action is a prominent upload button with clear visual hierarchy

2. **Given** a user has selected a photo to upload, **When** the upload completes, **Then** the system immediately begins processing and displays real-time progress with shimmer effect (not spinning loader)

3. **Given** processing is complete, **When** the result renders, **Then** the user sees an interactive before/after slider with their original on the left and restored version on the right, with smooth 60fps interaction

4. **Given** the restored preview is displayed, **When** the user pinches to zoom on mobile or uses zoom controls, **Then** facial details are clearly visible and the zoom focuses intelligently on faces

5. **Given** the user wants to share their result, **When** they tap the share button, **Then** the native OS share sheet opens with pre-generated assets (OG card, animated GIF, deep link) ready to share

6. **Given** the user has completed one free restore, **When** they attempt to upload a second photo, **Then** a tasteful upgrade prompt appears explaining the free tier limit and offering paid options

### Edge Cases

- What happens when user uploads a file larger than 20MB? → System displays friendly error message: "Photo too large. Please upload images under 20MB."
- What happens when user uploads an invalid file type (non-image)? → System displays error: "Please upload a valid image file (JPG, PNG, HEIC, WEBP)."
- What happens when AI processing fails? → System automatically retries once, then displays error with option to try again or contact support
- What happens when user uploads an already-high-quality photo? → System processes it but the before/after difference may be minimal; micro-copy acknowledges this ("Your photo looks great already!")
- What happens when user is on slow 3G connection? → Progressive image loading, clear progress indicators, upload continues in background if user navigates away (PWA)
- What happens when user has JavaScript disabled? → Graceful degradation message with instructions to enable JS for full experience
- What happens when processing takes longer than 12 seconds (p95 threshold)? → Progress indicator remains visible, reassuring micro-copy appears ("Processing complex details..."), timeout at 60 seconds with retry option

## Requirements

### Functional Requirements

- **FR-001**: System MUST present a single-column mobile-first layout with upload as the primary call-to-action
- **FR-002**: System MUST accept image uploads in common formats (JPEG, PNG, HEIC, WEBP) up to 20MB without requiring account creation
- **FR-003**: System MUST validate uploaded files client-side (file type, size) before upload to provide immediate feedback
- **FR-004**: System MUST display real-time upload progress using shimmer effect (constitutional design system requirement)
- **FR-005**: System MUST invoke AI restoration server-side only (never expose API keys to client per Privacy principle)
- **FR-006**: System MUST generate medium-resolution output (2048px longest edge) for free tier users
- **FR-007**: System MUST display restored result in interactive before/after slider component with smooth 60fps interaction
- **FR-008**: System MUST support pinch-to-zoom on mobile and zoom controls on desktop with intelligent focus on facial areas
- **FR-009**: System MUST auto-generate share artifacts: OG card (before→after split), animated GIF (2-3s wipe reveal <5MB), deep link
- **FR-010**: System MUST integrate native OS share sheet on mobile for one-tap sharing
- **FR-011**: System MUST apply subtle corner watermark badge on free tier results (NOT across faces per Monetization Rules)
- **FR-012**: System MUST track first-restore completion time and flag if exceeds 30-second NSM threshold
- **FR-013**: System MUST store original upload for 24 hours (free tier) then auto-delete per Privacy principle
- **FR-014**: System MUST implement automatic retry once on processing failures per Quality Bars SLO
- **FR-015**: System MUST display tasteful upgrade prompt after first free restore completion (not blocking preview)
- **FR-016**: System MUST track user quota (1 free restore) client-side and server-side for enforcement
- **FR-017**: System MUST meet performance budgets: first interactive <1.5s on mid-tier devices, image decode <300ms
- **FR-018**: System MUST respect `prefers-reduced-motion` and disable animations accordingly per Accessibility principle
- **FR-019**: System MUST implement WCAG 2.1 AA compliance minimum (AAA target) including alt text, keyboard navigation, touch targets ≥44px
- **FR-020**: System MUST log Time-to-Magic (TTM) metrics for p50 and p95 monitoring against ≤6s and ≤12s thresholds
- **FR-021**: System MUST implement error handling with clear, friendly error messages (file size, format, processing failure, network issues)
- **FR-022**: System MUST function as PWA with offline shell and queued upload capability per Mobile-First Design Specs
- **FR-023**: System MUST implement haptic feedback on mobile for key moments (upload complete, restore complete) per Experience Pillars
- **FR-024**: System MUST track NSM metric: % of visitors reaching restored preview within 30 seconds
- **FR-025**: System MUST ensure sticky bottom CTA positioning on mobile (thumb-reach zone) per Mobile-First Design Specs

### Performance Requirements

- **PR-001**: Time-to-Magic (TTM) p95 MUST be ≤12 seconds (constitutional requirement)
- **PR-002**: Time-to-Magic (TTM) p50 MUST be ≤6 seconds (constitutional requirement)
- **PR-003**: First interactive time MUST be <1.5 seconds on mid-tier devices (constitutional requirement)
- **PR-004**: Image preview decode MUST be <300ms (constitutional requirement)
- **PR-005**: Before/after slider interaction MUST maintain 60fps (or 120fps on capable devices)
- **PR-006**: Page load MUST work on 3G connections with progressive enhancement
- **PR-007**: Failed restores MUST be <1% with automatic retry (constitutional SLO)

### Design System Requirements

- **DR-001**: Typography hierarchy MUST follow constitutional standards: 36px hero, 24px sections, 18px body, 14px captions
- **DR-002**: Color palette MUST use calm, muted tones with soft gradients and matte finishes
- **DR-003**: Before/after slider MUST be full-screen, immersive hero element per Brand Primitives
- **DR-004**: Progress indicators MUST use shimmer effect (not spinning loaders) per constitutional Micro-Interactions
- **DR-005**: Success moment MUST display subtle confetti pulse (dismissible) per constitutional Micro-Interactions
- **DR-006**: Layout MUST respect iOS notch/Dynamic Island and Android gesture bars (safe areas)

### Key Entities

- **Upload Session**: Represents a single photo restoration session including original image reference, processing status, result reference, timestamps, quota tracking. Ephemeral (24h retention for free tier).

- **Restoration Result**: Represents the AI-processed output including medium-res image URL, watermark badge metadata, share artifact URLs (OG card, GIF, deep link), generation timestamp. Cached on CDN with immutable URL.

- **Share Artifact Set**: Collection of auto-generated shareable assets including before→after OG card image, 2-3s animated GIF (<5MB), deep link URL, copy template. Generated synchronously with restoration result.

- **User Quota**: Tracks free tier usage (1 restore per user) using client-side flag and server-side validation. Persists across sessions via browser fingerprinting or local storage (no account required for MVP).

**Note**: Entity descriptions above are intentionally non-technical (business stakeholder focused). For detailed database schema including field types, indexes, RLS policies, and state transitions, see `data-model.md`.

**Naming Conventions**:
- Documentation (spec/plan): PascalCase (e.g., "UploadSession")
- Database/code: snake_case (e.g., "upload_sessions")

**Out-of-Scope for MVP** (deferred to Phase 2):
- Referral mechanics: While Constitution XI defines referral tracking ("Give: 1 extra free restore when referred friend completes first restore"), this feature is explicitly deferred post-MVP. Phase 1 focuses on core restoration flow; Phase 2 will add referral attribution, bonus credits, and referral dashboard.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (NSM: 30s to preview, TTM p95: ≤12s)
- [x] Scope is clearly bounded (MVP landing page only)
- [x] Dependencies and assumptions identified (constitutional principles, no auth for MVP)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted (upload, restore, preview, share, mobile-first)
- [x] Ambiguities marked (none - constitutional principles provide clarity)
- [x] User scenarios defined (primary story + 6 acceptance scenarios + 7 edge cases)
- [x] Requirements generated (25 functional, 7 performance, 6 design system)
- [x] Entities identified (4 key entities)
- [x] Review checklist passed

---

**Constitutional Alignment Notes**:
- Principle I (Mission): Upload → Restore → Preview flow delivers zero-friction first wow
- Principle IV (First-Run Nirvana): No sign-up, no paywall, no settings before first result
- Principle VII (Tasteful Monetization): Preview never blocked, upgrade prompt after value delivery
- Principle VIII (North-Star Metrics): NSM tracked (30s to preview), TTM p95 ≤12s enforced
- Principle IX (Experience Pillars): Two-step flow, interactive slider, one-tap share
- Principle X (Mobile-First Design Specs): Single-column, 44px targets, sticky CTA, haptics
- Principle XVII (Design System): Shimmer progress, confetti success, 36/24/18/14 typography
