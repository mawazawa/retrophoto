<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0 (MAJOR - Initial constitution ratification)

Principles Defined:
- Mission & Core Values (Zero Friction to Wow, Beauty as Moat)
- User-Centric Obsession
- Mobile-First Always
- First-Run Nirvana
- Share-Ready by Default
- Trust & Privacy
- Tasteful Monetization
- North-Star Metrics & Quality Bars
- Experience Pillars
- Mobile-First Design Specifications
- Growth & Share System
- Monetization Rules
- Model & Image Policy
- Architecture Standards
- Performance & Cost Guardrails
- Privacy, Security, Compliance
- Design System
- Experimentation & Decision-Making
- Out-of-Scope Boundaries
- Governance & Change Management

Templates Status:
✅ .specify/templates/plan-template.md - Constitution Check section references this document
✅ .specify/templates/spec-template.md - Requirements align with constitutional principles
✅ .specify/templates/tasks-template.md - Task categorization supports constitutional compliance

Follow-up TODOs:
- RATIFICATION_DATE set to 2025-10-02 (today) as initial constitution
- All principles derived from provided product constitution
-->

# RetroPhoto Constitution

## Core Principles

### I. Mission & Core Values

**Preserve memories by turning old photos into realistic HD in seconds.**

Non-negotiable commitments:
- **Zero Friction to Wow**: Users MUST reach their first restored preview before any account creation, pricing wall, or settings configuration
- **Delight > Everything**: User experience quality supersedes technical optimization when trade-offs arise
- **Beauty as Moat**: Exquisite UI, motion design, and share flows are strategic differentiators in a commoditized AI model landscape

**Rationale**: When models commoditize, product excellence becomes the sustainable competitive advantage.

### II. User-Centric Obsession

Every screen, interaction, and decision MUST answer: "What's the next easiest action for this user?"

Rules:
- Design decisions default to reducing user cognitive load
- Feature additions require proof they simplify (not complicate) core flows
- Analytics MUST track friction points (abandoned uploads, incomplete flows)
- User testing MUST validate that paths are intuitive without documentation

**Rationale**: Complexity kills conversion; simplicity scales.

### III. Mobile-First Always

All design and engineering MUST prioritize mobile constraints and ergonomics:
- Thumb-reach zones for primary actions (bottom 60% of screen)
- Touch targets MUST be ≥44×44px
- Performance budgets MUST assume mid-tier devices (not flagship)
- Layouts MUST be single-column, responsive
- Latency budgets MUST account for 3G connections

**Rationale**: Mobile is the primary access point for photo restoration use cases.

### IV. First-Run Nirvana

The initial user experience MUST NOT include:
- Sign-up or login requirements before value delivery
- Pricing walls or plan selection screens
- Settings, preferences, or configuration steps
- Tutorial overlays or onboarding carousels

First interaction MUST be: Upload → Restore → Preview.

**Rationale**: Trust is earned through delivered value, not demanded upfront.

### V. Share-Ready by Default

Every restored image MUST automatically generate a shareable artifact set:
- Before/after comparison slider (interactive)
- OG card optimized for social platforms
- 2-3 second animated GIF (wipe reveal transition)
- Deep link to recreate experience

Share flow MUST be accessible in one tap via native share sheet.

**Rationale**: Viral growth depends on share-worthy output, not referral prompts.

### VI. Trust & Privacy

User data handling MUST follow these rules:
- AI model invocations MUST occur server-side only (never expose API keys client-side)
- Image storage MUST be ephemeral by default (24h for free tier, 30d for paid with user opt-in)
- User control MUST include: delete-all, export history, clear data
- AI disclosure MUST be clear and unobtrusive (subtle badge on free results)
- Consent mechanisms MUST precede data collection, not follow it

**Rationale**: Trust is fragile with personal photos; privacy protection is non-negotiable.

### VII. Tasteful Monetization

Monetization MUST enhance (not degrade) user experience:
- Previews MUST NEVER be blocked by paywalls
- Users MUST see full restored result (medium-res) before upgrade prompts
- Free tier watermarks MUST be subtle corner badges (NEVER across faces or key subjects)
- Upgrade moments MUST occur naturally: after value delivery, during share flow, when attempting second restore, when zooming for high-res details
- Pricing MUST be transparent (no hidden fees, clear credit/plan terms)

**Rationale**: Paywall-first approaches poison first-run experiences; value-first monetization converts better.

### VIII. North-Star Metrics & Quality Bars

**North-Star Metric (NSM)**: Percentage of new visitors who reach restored preview within 30 seconds.

**Performance SLOs**:
- Time-to-Magic (TTM) p95: ≤12 seconds
- Time-to-Magic (TTM) p50: ≤6 seconds
- Free-to-paid conversion: ≥18% within 24 hours (target; iterate)
- Share rate: ≥35% of free completions trigger share flow
- Uptime: 99.9%
- Failed restores: <1% (with automatic retry once)

**Enforcement**: Features that degrade NSM or SLOs MUST provide offsetting improvement justification.

**Rationale**: Without measurable bars, quality erosion is invisible until catastrophic.

### IX. Experience Pillars (UX Doctrine)

**Two-Step Flow**: Core user journey MUST be: (1) Upload photo → (2) Restore. No intermediate steps.

**Preview That Sells**:
- Instant before/after slider (interactive, smooth)
- Zoom capability focused on facial details
- Micro-copy that celebrates emotional moments ("Look at those eyes!")

**Share in One Tap**:
- Native OS share sheet integration
- Auto-generated social-optimized assets (OG image, GIF)
- Deep links for web recreation

**Beautiful Defaults**:
- Typography hierarchy maintained across all screens
- Soft shadows, subtle motion (respects `prefers-reduced-motion`)
- Haptic feedback on mobile for key moments (upload complete, restore complete)

**Accessible by Design**:
- WCAG 2.1 AA compliance minimum (AAA target)
- Reduced-motion mode MUST disable animations
- Alt text propagation for screen readers

### X. Mobile-First Design Specifications

**Layout Requirements**:
- Single-column layouts (no multi-column grids on mobile)
- Sticky bottom Primary CTA (persistent, always visible)
- Safe area respect (iOS notch/Dynamic Island, Android gesture bars)
- Bottom-sheet patterns for secondary actions

**Touch Target Standards**:
- Minimum size: 44×44px (WCAG AAA standard)
- Spacing between targets: ≥8px
- Primary actions in thumb-reach zone (bottom 60% of screen)

**Performance Budgets**:
- First interactive: <1.5 seconds on mid-tier devices
- Image preview decode: <300ms
- Frame rate during slider interaction: 60fps (or 120fps on capable devices)

**Gestures**:
- Pinch-to-zoom on restored images (focus on faces)
- Swipe-to-compare (before/after)
- Pull-to-refresh for history view (paid users)
- Haptic feedback on restore completion

**Offline Safety**:
- PWA shell for offline landing
- Queued upload when connection restored
- Clear offline state indicators

### XI. Growth & Share System

**Share Artifact Requirements**:
1. **OG Card**: Before→after split view, optimized for Twitter/Facebook/LinkedIn preview
2. **Animated GIF**: 2-3 second wipe reveal, <5MB file size, looping
3. **Deep Link**: Recreates interactive slider on web (e.g., `retrophoto.app/view/[hash]`)
4. **Copy Template**: "Restored with RetroPhoto — try your photo: [link]"

**Post-Share Flow**:
- Immediate nudge: "Get full-res & batch mode" → upgrade CTA
- Subtle, non-intrusive (dismissible)

**Referral Mechanics**:
- Give: 1 extra free restore when referred friend completes their first restore
- Credit: Attribute referrals via deep link tracking
- UI: Display referral CTA after first successful restore

**Rationale**: Viral growth requires zero-friction sharing with embedded attribution.

### XII. Monetization Rules

**Free Tier**:
- Quota: 1 restore per user (no account required)
- Output: Medium-res (optimized for social sharing, e.g., 2048px longest edge)
- Branding: Subtle corner badge (NOT across faces or key subjects)
- No time restrictions, no expiration

**Paid Tier**:
- High-res output (up to maximum model capability)
- Batch processing (multi-image upload)
- History access (30-day retention with user opt-in)
- Watermark removal
- Priority queue (faster processing)

**Plans**:
- Monthly subscription: Unmetered fair-use policy
- Credit packs: Pay-as-you-go for occasional users
- Stripe Customer Portal for self-service management

**Upgrade Trigger Moments** (in priority order):
1. After free result preview (primary conversion moment)
2. During share flow (upsell high-res for downloads)
3. When attempting second restore (quota exhausted)
4. When zooming for high-res detail inspection

**Rationale**: Value-first pricing converts better than access-gated models.

### XIII. Model & Image Policy

**Model Strategy**:
- Primary: NanoBana (commodity model for cost efficiency)
- Prompts: Minimal, deterministic ("Restore to realistic HD; denoise, repair, natural colorization")
- Fallback: Configurable secondary model for quality escalation

**Quality Consistency Rules**:
- Face fidelity MUST be preserved (no facial structure alterations)
- Over-smoothing MUST be avoided (preserve natural skin texture)
- Hallucinations MUST be capped (flag outputs with high divergence)
- Determinism: Stable params, seed control; surface retry if drift detected

**Safety Guardrails**:
- Content moderation: Block disallowed content categories (violence, explicit material)
- Identity protection: Guard against face swaps or identity fabrications
- Watermarking: Embedded metadata for AI-generated disclosure

**Rationale**: Model quality consistency is the floor; speed and cost optimization are secondary.

### XIV. Architecture Standards (Next.js → Mobile Roadmap)

**Web Application** (Phase 1):
- Framework: Next.js 15+ (App Router, Server Actions)
- UI: Tailwind CSS + shadcn/ui components
- Backend: Server Actions for restore API; streaming results
- Data: Supabase (Auth, Postgres, Storage with RLS)
- Payments: Stripe Checkout + Webhooks → subscription flags in Supabase
- Observability: Sentry (errors), structured logs (performance metrics)

**Backend Services**:
- Model invocations: Server-only (NEVER expose API keys client-side)
- Signed URLs for storage access (time-limited, single-use)
- CDN caching for restored assets (immutable URLs)

**Database**:
- User quotas tracked in Postgres
- History retention: 24h (free), 30d (paid with opt-in)
- Row-level security (RLS) enforced for multi-tenancy

**Storage**:
- Originals: Ephemeral (auto-delete per TTL policy)
- Results: CDN-cached, purge on user delete

**Mobile Application** (Phase 2):
- Framework: Expo/React Native
- Backend: Same Supabase, same REST APIs
- Shared logic: TypeScript SDK in `/packages/sdk`

**Rationale**: Web-first proves metrics; mobile follows once traction validated.

### XV. Performance & Cost Guardrails

**Per-Image Cost Budget**:
- P95 compute cost: ≤$0.03 per restoration (tune output resolution if exceeded)

**Queue & Retry Policy**:
- Idempotent job keys (prevent duplicate processing)
- Automatic retry once on transient failures
- Circuit breaker on API surge (throttle, queue)

**Image Processing Limits**:
- Input: ≤20MB file size
- Pre-processing: Server-side downscale if needed
- Post-processing: Upscale to target resolution

**CDN Strategy**:
- Cache restored assets with immutable URLs
- Purge on user-initiated delete
- Edge caching for share artifacts (OG cards, GIFs)

**Rationale**: Sustainable unit economics require cost discipline from day one.

### XVI. Privacy, Security, Compliance

**Server-Side Enforcement**:
- API keys MUST NEVER be exposed to client
- All model invocations server-only

**Data Retention Policy**:
- Free tier: Auto-delete uploads after 24 hours
- Paid tier: 30-day history retention (user opt-in required)
- User-initiated delete: Immediate purge (including CDN)

**User Control**:
- Delete-all: Single-action data purge
- Export: Download history (JSON + image URLs)
- Clear history: Selective deletion

**Compliance**:
- AI disclosure: Clear labeling on outputs (subtle badge on free tier)
- Terms & Privacy: Upfront but unobtrusive (link in footer, not blocking modal)
- GDPR-ready: Exportability, deletion, consent logging

**Rationale**: Privacy violations are existential risks; compliance is non-negotiable.

### XVII. Design System (Beauty = Strategy)

**Foundation**:
- CSS Framework: Tailwind CSS 4.0
- Component Library: shadcn/ui (customized)
- Motion: Framer Motion (respects `prefers-reduced-motion`)
- Themes: Dark-first design, elegant light mode option

**Typography Hierarchy**:
- Heading 1: 36px (hero moments)
- Heading 2: 24px (section titles)
- Body: 18px (readable on mobile)
- Caption: 14px (metadata, disclaimers)
- Line-height: Generous (1.6 for body, 1.2 for headings)

**Color Palette**:
- Calm, muted tones (avoid harsh contrasts)
- Soft gradients (not harsh stops)
- Matte finishes (avoid glossy effects)

**Micro-Interactions**:
- Restore progress: Shimmer effect (not spinning loader)
- Success moment: Confetti pulse (subtle, dismissible)
- Mobile haptics: Tactile feedback on key actions

**Brand Primitives**:
- Minimal chrome (content-first layouts)
- Before/after slider is the hero element (full-screen, immersive)
- Soft shadows, subtle depth (not flat design)

**Rationale**: Design excellence is a strategic moat in commoditized AI markets.

### XVIII. Experimentation & Decision-Making

**3-2-1 Triangle Framework**:
- 3 views: UX friction, cost impact, performance metrics
- 2 challenges: Trust deficit, friction points
- 1 truth: Fewer steps always wins (until proven otherwise)

**A/B Testing Priorities**:
- Paywall timing (after preview vs. after share vs. on second restore)
- Badge placement and design (corner vs. edge, opacity, size)
- Share artifact styles (slider vs. side-by-side vs. GIF-only)

**Kill-Switches** (runtime config, no deploy required):
- Disable watermark badge
- Throttle free tier (reduce quota dynamically)
- Switch model parameters (quality vs. speed trade-offs)

**Decision Bias**:
- Default to simplicity: If debate exceeds 24 hours, ship the simpler path and measure
- Data over opinions: A/B test when uncertain, decide on metrics

**Rationale**: Speed of iteration beats perfection; measure, learn, adapt.

## Out-of-Scope (Explicitly Excluded for V1)

The following are NOT constitutional violations but are deliberately deferred:
- Manual brush retouching, layer editing, complex post-processing tools
- Social feed, public galleries, or community features
- Native desktop application (native only after web proves metrics)
- Video restoration or animation features
- Print fulfillment or physical product integration

**Rationale**: Scope discipline prevents feature creep; focus delivers excellence.

## Governance

**Amendment Process**:
- Constitution changes MUST include: data justification, user impact analysis, version bump rationale
- MAJOR version: Principle removal or redefinition
- MINOR version: New principle or expanded guidance
- PATCH version: Clarifications, wording fixes

**Compliance Enforcement**:
- All PRs MUST verify constitutional alignment (automated checks in CI)
- Feature proposals MUST map to constitutional principles
- Architecture decisions MUST reference relevant principles

**Conflict Resolution**:
- Constitutional principles supersede all other documentation
- When principles conflict, escalate to governance review
- Default bias: If debate exceeds 24 hours, ship the simpler path and measure

**Living Document**:
- Versioned in repository (`.specify/memory/constitution.md`)
- Amendments require pull request with justification
- Quarterly review for alignment with product evolution

**Version**: 1.0.0 | **Ratified**: 2025-10-02 | **Last Amended**: 2025-10-02
