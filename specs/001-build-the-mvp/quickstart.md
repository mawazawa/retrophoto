# Quickstart: MVP Landing Page Manual Testing

**Feature**: 001-build-the-mvp
**Date**: 2025-10-02
**Purpose**: Validate constitutional requirements through user journey testing

## Prerequisites

- Device: iPhone 13 or equivalent Android (mid-tier, not flagship)
- Network: Throttle to "Fast 3G" in DevTools (750ms RTT, 1.5Mbps down)
- Test images: Prepare 3 photos:
  1. Damaged vintage photo (<20MB JPEG, faces visible)
  2. Oversized photo (>20MB)
  3. Invalid file type (PDF or TXT)

---

## Scenario 1: Happy Path (First-Run Nirvana)

**Constitutional Principles Tested**: I (Zero Friction), IV (First-Run Nirvana), VIII (North-Star Metrics)

### Steps

1. **Navigate to landing page**
   - Open: `https://retrophoto.app` (or `http://localhost:3000` for local)
   - Start timer (for NSM: 30s to preview)

2. **Verify landing page**
   - [ ] Page loads <1.5s (Lighthouse Performance tab)
   - [ ] Upload button is prominent (largest element, high contrast)
   - [ ] Touch target measured ≥44×44px (Chrome DevTools → Inspect → Computed)
   - [ ] No sign-up form visible
   - [ ] No pricing information visible
   - [ ] Typography hierarchy matches constitution: 36px hero, 18px body

3. **Upload test image #1 (damaged vintage photo)**
   - [ ] Tap/click upload button
   - [ ] File picker opens immediately
   - [ ] Select test image (<20MB JPEG)
   - [ ] Upload progress appears with shimmer effect (NOT spinning loader)
   - [ ] Progress indicator is smooth (no janky animations)

4. **Processing phase**
   - [ ] Shimmer progress updates in real-time
   - [ ] Reassuring micro-copy visible ("Restoring details...")
   - [ ] No timeout before 60 seconds
   - [ ] Processing completes <12 seconds (p95 threshold) — record actual time
   - [ ] Stop timer (NSM: should be <30s from step 1)

5. **Result preview**
   - [ ] Before/after slider renders immediately after processing
   - [ ] Original image on left, restored on right
   - [ ] Slider handle is centered by default
   - [ ] Interactive slider responds to touch/mouse (60fps — check DevTools Performance)
   - [ ] Subtle watermark badge in corner (NOT across face)
   - [ ] Image decode <300ms (Network tab → Timing)

**Expected NSM**: ≤30 seconds from page load to preview visible
**Expected TTM**: ≤12 seconds from upload to result

---

## Scenario 2: Interactive Slider & Zoom

**Constitutional Principles Tested**: IX (Experience Pillars), X (Mobile-First Design)

### Steps

1. **Slider interaction (desktop)**
   - [ ] Click and drag slider handle → moves smoothly
   - [ ] Keyboard: Tab to focus handle → visible focus ring
   - [ ] Keyboard: Arrow keys move handle → responsive
   - [ ] Keyboard: Space/Enter toggles position → works

2. **Slider interaction (mobile)**
   - [ ] Touch and drag handle → smooth 60fps (use Chrome DevTools → Performance)
   - [ ] Swipe gesture across image → slider follows finger
   - [ ] Haptic feedback on touch (iOS: check Settings → Sounds & Haptics enabled)

3. **Pinch-to-zoom (mobile only)**
   - [ ] Pinch-to-zoom on result image → zooms in
   - [ ] Zoom focuses on facial area (not random crop)
   - [ ] Double-tap to zoom → works
   - [ ] Pinch-out to reset zoom → works
   - [ ] Zoom maintains 60fps (no stuttering)

4. **Accessibility**
   - [ ] Screen reader (NVDA/VoiceOver): Announces "Before and after comparison"
   - [ ] Screen reader: Progress updates announced ("Processing 50% complete")
   - [ ] Reduced motion: Settings → Accessibility → Reduce Motion ON → animations disabled

---

## Scenario 3: Share Flow

**Constitutional Principles Tested**: V (Share-Ready by Default), XI (Growth & Share System)

### Steps

1. **Native share button**
   - [ ] "Share" button visible and prominent (44×44px minimum)
   - [ ] Tap share button

2. **Share sheet (mobile)**
   - [ ] Native OS share sheet opens (iOS: sheet slides up from bottom, Android: dialog)
   - [ ] Share options visible (Messages, WhatsApp, Twitter, Copy Link, etc.)
   - [ ] OG card preview visible in sheet (before→after split image)

3. **Share sheet (desktop)**
   - [ ] Web Share API: If supported (Chrome/Edge), native share dialog opens
   - [ ] Fallback: If not supported, "Link copied!" toast appears
   - [ ] Link copied to clipboard: Paste in new tab → opens deep link

4. **Deep link validation**
   - [ ] Open shared link in new tab/device
   - [ ] URL format: `https://retrophoto.app/result/[uuid]`
   - [ ] Page loads with same before/after slider
   - [ ] Slider interactive (can drag/compare)
   - [ ] No upload button visible on deep link page (result-only view)

5. **Share artifacts**
   - [ ] OG card: Open link in Twitter/Facebook preview → before→after split card visible
   - [ ] Animated GIF: Download from deep link page → 2-3s wipe reveal, <5MB file size
   - [ ] GIF loops correctly (no freeze on last frame)

---

## Scenario 4: Quota Enforcement & Upgrade Prompt

**Constitutional Principles Tested**: VII (Tasteful Monetization), XII (Monetization Rules)

### Steps

1. **Complete first restore** (from Scenario 1)
   - [ ] First restore completes successfully
   - [ ] No upgrade prompt yet (value-first approach)

2. **Attempt second upload**
   - [ ] Return to landing page (or refresh)
   - [ ] Upload button still visible (not hidden)
   - [ ] Tap upload button → select second test image
   - [ ] Upload starts, then quota exceeded error appears

3. **Upgrade prompt**
   - [ ] Modal/dialog appears with tasteful messaging
   - [ ] Message: "Free restore limit reached. Upgrade for unlimited restorations."
   - [ ] NOT blocking entire UI (dismissible with X or outside click)
   - [ ] Upgrade button prominent, link to pricing page
   - [ ] "Maybe later" or dismiss option available

4. **Quota persistence**
   - [ ] Close browser, open Incognito/Private window
   - [ ] Navigate to landing page
   - [ ] Attempt upload → quota still enforced (fingerprint tracked)
   - [ ] Different browser/device → quota resets (new fingerprint)

---

## Scenario 5: Error Handling

**Constitutional Principles Tested**: FR-021 (Error handling), PR-007 (Retry logic)

### Steps

1. **Oversized file (test image #2)**
   - [ ] Upload test image >20MB
   - [ ] Error message appears: "Photo too large. Please upload images under 20MB."
   - [ ] Error is friendly, not technical jargon
   - [ ] Upload button remains enabled (can retry)

2. **Invalid file type (test image #3)**
   - [ ] Upload PDF or TXT file
   - [ ] Error message: "Please upload a valid image file (JPG, PNG, HEIC, WEBP)."
   - [ ] No crash or console errors

3. **Slow connection (3G throttle)**
   - [ ] Enable "Fast 3G" throttling in DevTools → Network
   - [ ] Upload valid image
   - [ ] Progress indicator shows upload progress
   - [ ] Processing continues, completes (may exceed 12s on 3G, acceptable)
   - [ ] No timeout before 60 seconds

4. **Processing failure simulation** (requires backend test mode)
   - [ ] Trigger AI model failure (backend returns 500)
   - [ ] System automatically retries once (visible in Network tab)
   - [ ] If still fails: Error message with "Try again" button
   - [ ] Error message: "Restoration failed. Please try again or contact support."
   - [ ] Session ID visible for debugging (in console or error details)

---

## Scenario 6: Performance & Accessibility Audit

**Constitutional Principles Tested**: PR-001 to PR-007, FR-019 (WCAG AA)

### Steps

1. **Lighthouse audit (Chrome DevTools)**
   - [ ] Open DevTools → Lighthouse tab
   - [ ] Device: Mobile, Throttling: Simulated throttling
   - [ ] Run audit → Performance score ≥80
   - [ ] Run audit → Accessibility score ≥90 (WCAG AA minimum)
   - [ ] Run audit → Best Practices score ≥95
   - [ ] Run audit → SEO score ≥90

2. **Core Web Vitals**
   - [ ] LCP (Largest Contentful Paint): <2.5s
   - [ ] FID (First Input Delay): <100ms
   - [ ] CLS (Cumulative Layout Shift): <0.1

3. **Manual accessibility checks**
   - [ ] Keyboard only navigation: Tab through all interactive elements
   - [ ] Focus indicators visible on all focusable elements
   - [ ] No keyboard traps (can Tab in and out of slider)
   - [ ] Color contrast: Use browser extension (WCAG AA ratio ≥4.5:1 for text)

4. **Touch target sizing (mobile)**
   - [ ] Use Chrome DevTools → Device toolbar → Show rulers
   - [ ] Measure all buttons/links: ≥44×44px
   - [ ] Spacing between targets: ≥8px

---

## Scenario 7: PWA Offline Behavior

**Constitutional Principles Tested**: FR-022 (Offline-capable PWA), X (Mobile-First Design)

### Steps

1. **Install PWA (mobile)**
   - [ ] In browser (Chrome/Safari): "Add to Home Screen" prompt appears
   - [ ] Tap "Add" → icon appears on home screen
   - [ ] Open from home screen → launches in standalone mode (no browser chrome)

2. **Offline shell**
   - [ ] Enable airplane mode
   - [ ] Open PWA from home screen
   - [ ] Offline shell UI appears (not browser "No Internet" page)
   - [ ] Message: "You're offline. Your upload will sync when online."

3. **Background sync** (requires online → offline → online flow)
   - [ ] Start upload while online
   - [ ] Enable airplane mode mid-upload
   - [ ] Upload pauses, queued indicator visible
   - [ ] Disable airplane mode (back online)
   - [ ] Upload resumes automatically via background sync
   - [ ] Processing completes, result appears

---

## Scenario 8: Design System Compliance

**Constitutional Principles Tested**: XVII (Design System), DR-001 to DR-006

### Steps

1. **Typography hierarchy**
   - [ ] Measure hero text: 36px (browser DevTools → Computed)
   - [ ] Measure section headings: 24px
   - [ ] Measure body text: 18px
   - [ ] Measure captions/meta: 14px
   - [ ] Line-height: 1.6 for body, 1.2 for headings

2. **Color palette**
   - [ ] Check colors in DevTools → Inspect
   - [ ] Palette uses calm, muted tones (no harsh neon)
   - [ ] Gradients are soft (not harsh stops)
   - [ ] Shadows are subtle (2-4px blur, low opacity)

3. **Micro-interactions**
   - [ ] Progress shimmer: Gradient moves left-to-right (animation duration ~2s)
   - [ ] Success confetti: Subtle pulse effect on restore complete (dismissible)
   - [ ] Haptic feedback: Light tap on upload complete (iOS only)

4. **Safe areas (mobile)**
   - [ ] iPhone notch: Content doesn't overlap Dynamic Island
   - [ ] Android gestures: Bottom button bar doesn't overlap system gestures
   - [ ] Sticky CTA: Positioned in bottom 60% of screen (thumb-reach zone)

---

## Pass Criteria

**Must Pass All**:
- [ ] NSM: ≤30 seconds (page load to preview visible)
- [ ] TTM p95: ≤12 seconds (upload to result)
- [ ] First interactive: <1.5 seconds
- [ ] Lighthouse Accessibility: ≥90
- [ ] Touch targets: ≥44×44px
- [ ] Quota enforced (second upload blocked)
- [ ] No sign-up required for first restore
- [ ] Watermark in corner (not across face)

**Should Pass** (nice-to-have):
- [ ] TTM p50: ≤6 seconds
- [ ] Lighthouse Performance: ≥80
- [ ] Share flow completes <5 taps
- [ ] PWA installs successfully

---

## Reporting Results

For each scenario, record:
- **Status**: PASS / FAIL / PARTIAL
- **Actual times**: NSM, TTM, First Interactive
- **Device**: Model, OS version, browser
- **Network**: WiFi / 4G / 3G throttled
- **Screenshots**: Failures or unexpected behavior
- **Console errors**: Copy from DevTools → Console

**Submit report to**: `specs/001-build-the-mvp/test-results.md`

---

## Constitutional Alignment Checklist

After completing all scenarios, verify:
- ✅ **Principle I**: Zero friction (no sign-up before value)
- ✅ **Principle III**: Mobile-first (44px targets, single-column)
- ✅ **Principle IV**: First-run nirvana (no paywalls/settings)
- ✅ **Principle V**: Share-ready (OG card, GIF, deep link auto-generated)
- ✅ **Principle VI**: Privacy (24h TTL, server-side processing)
- ✅ **Principle VII**: Tasteful monetization (preview never blocked)
- ✅ **Principle VIII**: NSM/TTM tracked and within thresholds
- ✅ **Principle IX**: Two-step flow (Upload → Restore)
- ✅ **Principle X**: Mobile-first design specs met
- ✅ **Principle XVII**: Design system (typography, colors, micro-interactions)

**Ready for production if all checkboxes marked ✅**.
