# Deployment Checklist for RetroPhoto

## ✅ Completed Steps

### 1. Database Setup
- [x] Connected to Supabase project: `rgrgfcesahcgxpuobbqq`
- [x] Applied all 9 database migrations
- [x] Verified ENUM types created
- [x] Verified all tables exist with correct schema
- [x] Verified RLS policies are in place
- [x] Verified database functions (`check_quota`, `cleanup_expired_sessions`, `add_credits`, `consume_credit`, `get_credit_balance`)
- [x] Verified cron job scheduled for TTL cleanup

### 2. Environment Configuration
- [x] Updated `.env.local` with correct Supabase credentials
- [x] Verified `NEXT_PUBLIC_SUPABASE_URL` points to correct project
- [x] Verified `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- [x] Replicate API token configured
- [x] Stripe keys configured (live keys)
- [x] Base URL configured

### 3. Application Status
- [x] Development server running on `http://localhost:3000`
- [x] Authentication system configured
- [x] Database migrations synced with codebase
- [x] Git repository up to date

## 🚀 Ready for Testing

You can now test the following features:

### Authentication
1. **Sign Up** - Create a new account
   - Navigate to http://localhost:3000
   - Click "Sign In" button
   - Switch to "Sign Up" mode
   - Enter email and password (min 6 characters)
   - Check email for confirmation link

2. **Sign In** - Login with existing account
   - Use email/password authentication
   - Or use Google OAuth (if configured in Supabase Dashboard)

3. **Sign Out** - Logout functionality

### Photo Restoration
1. **Upload Photo** - Test free tier (1 restore per fingerprint)
2. **Process Photo** - Verify AI restoration works
3. **View Results** - Check restoration results display
4. **Share Features** - Test share functionality

### Payment System
1. **Quota Check** - Verify free tier limit
2. **Upgrade Prompt** - Test when quota exceeded
3. **Stripe Integration** - Test credit purchase flow

## ⚠️ Pre-Production Checklist

Before deploying to production:

### Supabase Configuration
- [ ] Configure email templates in Supabase Dashboard
- [ ] Set up Google OAuth provider (optional)
  - Go to: https://supabase.com/dashboard/project/rgrgfcesahcgxpuobbqq/auth/providers
  - Enable Google provider
  - Add OAuth credentials
- [ ] Configure SMTP settings for production emails
- [ ] Review and adjust RLS policies
- [ ] Enable Realtime if needed
- [ ] Configure Storage buckets
- [ ] Set up database backups

### Environment Variables (Production)
- [ ] Create `.env.production` or configure in Vercel
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Verify all Stripe keys are LIVE keys
- [ ] Configure Sentry DSN for error tracking
- [ ] Set up proper SMTP credentials

### Security
- [ ] Enable rate limiting on API routes
- [ ] Configure CORS properly
- [ ] Review all API endpoints for auth checks
- [ ] Test RLS policies thoroughly
- [ ] Enable Supabase Security Advisor checks
- [ ] Configure WAF rules if using Vercel

### Performance
- [ ] Enable CDN caching
- [ ] Configure image optimization
- [ ] Test TTL cleanup job
- [ ] Monitor database performance
- [ ] Set up database indexes (already done via migrations)

### Monitoring
- [ ] Configure Sentry error tracking
- [ ] Set up uptime monitoring
- [ ] Configure Supabase analytics
- [ ] Set up Stripe webhook monitoring
- [ ] Configure alerting for critical errors

## 📋 Deployment Steps (Vercel)

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_BASE_URL` to production domain

3. **Deploy**
   ```bash
   git push origin main  # Automatic deployment via Vercel
   # Or manually:
   vercel --prod
   ```

4. **Post-Deployment Verification**
   - [ ] Test authentication flow
   - [ ] Test photo upload and restoration
   - [ ] Test payment flow
   - [ ] Verify cron jobs running
   - [ ] Check error logs in Sentry
   - [ ] Monitor Supabase logs

## 🔧 Troubleshooting

### Issue: Authentication not working
- Verify environment variables are set correctly
- Check Supabase Dashboard for any auth errors
- Verify email confirmation settings
- Check browser console for errors

### Issue: Database connection fails
- Verify Supabase URL and anon key
- Check if project is paused (free tier)
- Verify RLS policies aren't blocking access
- Check network connectivity

### Issue: Payment flow fails
- Verify Stripe webhook secret matches
- Check Stripe webhook logs for errors
- Verify Stripe keys are LIVE keys
- Test webhook endpoint is accessible

## 📚 Documentation References

- [SUPABASE_CONFIG_FIX.md](./SUPABASE_CONFIG_FIX.md) - Configuration fix details
- [AUTH_STATUS_REPORT.md](./AUTH_STATUS_REPORT.md) - Authentication overview
- [WEBHOOK_CONFIGURATION.md](./WEBHOOK_CONFIGURATION.md) - Stripe webhook setup
- [lib/supabase/README.md](./lib/supabase/README.md) - Database documentation

## 🎯 Success Criteria

The application is ready for production when:
- ✅ All tests pass
- ✅ No console errors on homepage
- ✅ Authentication flow works end-to-end
- ✅ Photo restoration completes successfully
- ✅ Payment flow processes correctly
- ✅ TTL cleanup job runs hourly
- ✅ Error tracking reports to Sentry
- ✅ Performance metrics are acceptable
- ✅ Security advisor shows no critical issues

---

**Current Status:** ✅ Development Environment Ready  
**Last Updated:** October 3, 2025  
**Next Steps:** Complete testing, then deploy to Vercel production

