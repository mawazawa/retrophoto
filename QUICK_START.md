# 🚀 Quick Start - Deploy in 3 Steps

## You're Almost There!

Everything is ready except the database tables. Here's how to deploy in **under 10 minutes**:

---

## ⚡ Three-Step Deployment

### Step 1: Create Database Tables (5 minutes)

**Copy this file**: [DEPLOY_DATABASE.sql](./DEPLOY_DATABASE.sql)

**Paste here**: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new

**Click**: `RUN`

That's it! All 9 migrations run in one go.

---

### Step 2: Create Storage Buckets (2 minutes)

Go to: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/storage/buckets

**Create bucket 1**:
- Name: `uploads`
- Public: ❌ No (Private)
- Size limit: 20MB

**Create bucket 2**:
- Name: `restorations`
- Public: ✅ Yes (Public)
- Size limit: 50MB

---

### Step 3: Deploy (3 minutes)

```bash
./deploy.sh
```

Or manually:

```bash
npm run build
vercel --prod
```

---

## ✅ Verification

After deployment, test with:

```bash
# Test quota API
curl https://your-app.vercel.app/api/quota?fingerprint=test-fingerprint-12345678901234567890
```

Expected response:
```json
{
  "remaining": 1,
  "limit": 1,
  "requires_upgrade": false,
  "last_restore_at": null
}
```

---

## 🎯 Current Status

| Component | Status |
|-----------|--------|
| Code | ✅ Ready (bug fixed!) |
| Environment Variables | ✅ Configured |
| Replicate API | ✅ Connected |
| Supabase Connection | ✅ Connected |
| **Database Tables** | ❌ **Need to create** |
| **Storage Buckets** | ❌ **Need to create** |
| Build | ✅ Passes |
| Tests | ✅ 48 passing |

---

## 🆘 Having Issues?

**Database connection fails**:
```bash
# Verify tables exist (requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars)
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
(async () => {
  const { error } = await supabase.from('upload_sessions').select('*').limit(1);
  console.log(error ? '❌ Tables not found - run DEPLOY_DATABASE.sql' : '✅ Database ready');
})();
"
```

**Build fails**:
```bash
npm run typecheck  # See TypeScript errors
```

**Need more details?**:
- [DEPLOY_NOW_GUIDE.md](./DEPLOY_NOW_GUIDE.md) - Full detailed guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete checklist

---

## 📞 Support

If stuck:
1. Check [DEPLOY_NOW_GUIDE.md](./DEPLOY_NOW_GUIDE.md)
2. Review error in terminal
3. Verify database tables exist in Supabase dashboard

---

**Estimated Total Time**: 10 minutes 🚀
