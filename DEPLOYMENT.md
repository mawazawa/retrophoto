# RetroPhoto MVP Deployment Checklist

## 📋 Pre-Deployment

### 1. Database Setup (Supabase)

- [ ] Create Supabase project
- [ ] Run all migrations in order:
  ```bash
  cd supabase/migrations
  # Follow README.md instructions
  ```
- [ ] Verify tables created: `user_quota`, `upload_sessions`, `restoration_results`, `analytics_events`
- [ ] Verify functions: `check_quota()`, `cleanup_expired_sessions()`
- [ ] Verify RLS policies enabled
- [ ] Configure cron job: `SELECT cron.schedule('cleanup-expired', '0 * * * *', 'SELECT cleanup_expired_sessions()');`
- [ ] Create storage buckets:
  - `uploads` (private, 20MB limit, 24h lifecycle)
  - `restorations` (public, 50MB limit, cascade delete)
- [ ] Get Supabase URL and anon key

### 2. API Keys

- [ ] **Replicate**: Sign up at replicate.com, get API token
- [ ] **Sentry**: Create project, get DSN and auth token
- [ ] **FingerprintJS**: Get public API key (optional, works without)

### 3. Icons & Assets

- [ ] Generate PWA icons (192x192, 512x512) - see `public/icons/README.md`
- [ ] Add app screenshots (750x1334) for manifest - see `public/screenshots/`
- [ ] Replace placeholder icon references in `manifest.json`

### 4. Environment Variables

Create `.env.local` (dev) and configure Vercel environment variables (prod):

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
REPLICATE_API_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_BASE_URL=

# Optional (but recommended)
VERCEL_URL=
```

### 5. Code Quality

- [ ] Run type checking: `npm run typecheck` (should pass with no errors)
- [ ] Run linter: `npm run lint` (should pass)
- [ ] Run unit tests: `npm test` (40/40 passing)
- [ ] Run E2E tests: `npm run test:e2e` (may need environment setup)
- [ ] Run Lighthouse CI: `npm run lighthouse` (Performance ≥80, Accessibility ≥90)
- [ ] Analyze bundle size: `npm run analyze` (First Load JS <650KB target)

## 🚀 Deployment (Vercel)

### 1. Connect Repository

1. Visit [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import Git repository
4. Select RetroPhoto repo

### 2. Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x

### 3. Environment Variables

Add all environment variables from `.env.local.example`:

1. Go to Project Settings → Environment Variables
2. Add each variable for:
   - Production
   - Preview
   - Development

### 4. Deploy

- [ ] Click "Deploy"
- [ ] Wait for build to complete (~5-10 minutes)
- [ ] Verify deployment URL works

### 5. Domain Setup (Optional)

- [ ] Add custom domain in Project Settings → Domains
- [ ] Update `NEXT_PUBLIC_BASE_URL` to custom domain
- [ ] Redeploy

## ✅ Post-Deployment Validation

### 1. Functionality Tests

Visit deployment URL and verify:

- [ ] Landing page loads (<1.5s)
- [ ] Upload zone accepts drag-drop
- [ ] File validation works (try >20MB, PDF, valid JPEG)
- [ ] Quota check works (upload twice, second should block)
- [ ] AI restoration completes (<12s for simple photo)
- [ ] Result page displays comparison slider
- [ ] Slider interaction is smooth (60fps)
- [ ] Zoom viewer opens and works
- [ ] Share button opens native sheet (mobile) or copies link (desktop)
- [ ] Deep link works (open `/result/[session-id]` in new tab)
- [ ] Upgrade prompt appears after first restore

### 2. Performance Validation

Run Lighthouse audit on deployment URL:

- [ ] Performance score ≥80
- [ ] Accessibility score ≥90
- [ ] Best Practices score ≥95
- [ ] SEO score ≥90
- [ ] LCP <2.5s
- [ ] CLS <0.1
- [ ] TBT <300ms

### 3. Accessibility Validation

- [ ] Keyboard navigation works (Tab through all elements)
- [ ] Focus indicators visible
- [ ] Screen reader announces elements correctly (test with NVDA/VoiceOver)
- [ ] Touch targets ≥44px (measure in DevTools)
- [ ] Color contrast meets WCAG AA (use browser extension)

### 4. PWA Validation

- [ ] Manifest file loads (`/manifest.json`)
- [ ] Service worker registers (check DevTools → Application)
- [ ] "Add to Home Screen" prompt appears (mobile)
- [ ] App installs successfully
- [ ] Offline shell works (enable airplane mode, open app)
- [ ] Background sync queues uploads (upload offline, go online, verify completion)

### 5. Analytics Validation

- [ ] Sentry dashboard shows events
- [ ] Vercel Analytics shows page views
- [ ] TTM metrics tracked in Sentry (upload a photo, check Sentry)
- [ ] Analytics events logged in Supabase `analytics_events` table

### 6. Database Validation

Check Supabase dashboard:

- [ ] `upload_sessions` table has new rows after upload
- [ ] `restoration_results` table has result after completion
- [ ] `user_quota` table tracks restore count
- [ ] `analytics_events` table logs TTM
- [ ] Cron job runs hourly (check logs after 1 hour)
- [ ] Old sessions deleted after 24h (test manually or wait)

## 🔍 Monitoring Setup

### 1. Sentry Alerts

Configure alerts for:

- [ ] TTM p95 >12s threshold exceeded
- [ ] Error rate >1%
- [ ] AI model failures
- [ ] Quota check errors

### 2. Vercel Alerts

Configure alerts for:

- [ ] Deployment failures
- [ ] Performance degradation (LCP >2.5s)
- [ ] Error rate spikes

### 3. Supabase Alerts

Configure alerts for:

- [ ] Database CPU >80%
- [ ] Storage >90%
- [ ] Connection pool exhaustion

## 📊 Success Metrics (Constitutional)

Track these in Sentry + Vercel Analytics:

- **NSM (North-Star Metric)**: % of visitors reaching preview within 30s
  - Target: ≥70%
- **TTM p50**: Time-to-Magic median
  - Target: ≤6 seconds
- **TTM p95**: Time-to-Magic 95th percentile
  - Target: ≤12 seconds
- **Conversion Rate**: % of visitors completing first restore
  - Target: ≥50%
- **Share Rate**: % of users clicking share button
  - Target: ≥30%

## 🐛 Common Issues

### Build Errors

**TypeScript errors**:
```bash
npm run typecheck
# Fix all errors before deploying
```

**Supabase types missing**:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

### Runtime Errors

**Environment variables not set**:
- Check Vercel dashboard → Project Settings → Environment Variables
- Verify all required vars are set
- Redeploy after adding vars

**Database connection fails**:
- Verify Supabase URL and anon key
- Check RLS policies allow public access where needed
- Verify migrations ran successfully

**AI restoration fails**:
- Check Replicate API token is valid
- Verify account has credits
- Check Replicate dashboard for rate limits

## 📞 Support

If deployment fails:

1. Check Vercel build logs
2. Check Sentry error dashboard
3. Review Supabase logs
4. Open GitHub issue with:
   - Deployment URL
   - Error message
   - Steps to reproduce

## 🎉 Post-Launch

- [ ] Announce launch (social media, Product Hunt, etc.)
- [ ] Monitor Sentry for first hour
- [ ] Check performance metrics
- [ ] Collect user feedback
- [ ] Plan Phase 2 features (referral system, high-res upgrades)

---

**Deployment Complete!** 🚀

Your RetroPhoto MVP is now live and ready to restore old photos for users worldwide.
