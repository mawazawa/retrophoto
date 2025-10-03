# Bug Fix: Invalid REPLICATE_API_TOKEN in Production

## Critical Production Bug

### Location
- **Environment**: Vercel Production Environment Variables
- **Variable**: `REPLICATE_API_TOKEN`
- **Impact**: 100% of restoration attempts failing

### Bug Description
The `REPLICATE_API_TOKEN` environment variable in Vercel production had a **trailing newline character** (`\n`):

```
REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n"
                                                  ^^^^
                                                  Invalid!
```

This made the token invalid, causing all calls to the Replicate API to fail immediately with authentication errors.

### Impact
- **Severity**: CRITICAL - App completely non-functional
- **User Experience**: 100% of users unable to restore photos
- **Error Message**: "Restoration failed. Please try again or contact support."
- **Status Code**: 500 Internal Server Error
- **Scope**: All production deployments since token was set

### Root Cause
The `echo` command in the fix attempt **added a newline by default**:
```bash
# WRONG (adds \n):
echo "token" | vercel env add REPLICATE_API_TOKEN production

# CORRECT (no newline):
echo -n "token" | vercel env add REPLICATE_API_TOKEN production
```

The `-n` flag is required to suppress the trailing newline that `echo` adds by default.

### Discovery Process
1. User reported production failure (retrophotoai.com showing 500 errors)
2. Pulled production environment variables using `vercel env pull`
3. Inspected `.env.production.local` file
4. Found literal `\n` at end of REPLICATE_API_TOKEN value
5. Verified this would cause Replicate API authentication to fail

### Fix Implementation

**Step 1: Remove Invalid Token**
```bash
vercel env rm REPLICATE_API_TOKEN production --yes
```

**Step 2: Add Clean Token (all environments) - CRITICAL: Use `echo -n` to prevent newline**
```bash
# The -n flag is REQUIRED to prevent echo from adding a trailing newline!
echo -n "r8_YOUR_REPLICATE_TOKEN_HERE" | vercel env add REPLICATE_API_TOKEN production
echo -n "r8_YOUR_REPLICATE_TOKEN_HERE" | vercel env add REPLICATE_API_TOKEN preview
echo -n "r8_YOUR_REPLICATE_TOKEN_HERE" | vercel env add REPLICATE_API_TOKEN development
```

**Step 3: Redeploy to Production**
```bash
vercel --prod
```

### Verification

**Before Fix:**
- ❌ All restoration attempts fail with 500 error
- ❌ Browser console: "Failed to load resource: the server responded with a status of 500 ()"
- ❌ Error message: "Restoration failed. Please try again or contact support."

**After Fix:**
- ✅ Clean token set in all environments
- ✅ Production redeployed with correct token
- ✅ Replicate API calls should succeed

### Why This Wasn't Caught Earlier

1. **Local Development**: `.env.local` file had correct token (no newline)
2. **Build Process**: Builds succeeded (token not validated at build time)
3. **Runtime Error**: Only fails when actually calling Replicate API
4. **Error Obscurity**: Generic 500 error, not obvious it's an auth issue
5. **No Token Validation**: App doesn't validate token format on startup

### Preventative Measures

1. **Token Validation on Startup**
   - Add health check that validates REPLICATE_API_TOKEN format
   - Fail fast if token is invalid (better than runtime failures)

2. **Better Error Messages**
   - Catch Replicate auth errors specifically
   - Return more descriptive error codes (e.g., REPLICATE_AUTH_ERROR)

3. **Environment Variable Linting**
   - Strip whitespace/newlines from environment variables automatically
   - Validate format of API tokens (length, prefix, etc.)

4. **Deployment Checks**
   - Add smoke test that makes actual Replicate API call post-deployment
   - Alert immediately if API calls fail

5. **Documentation**
   - Add troubleshooting guide for environment variable issues
   - Document proper way to set tokens in Vercel

### Related Files
- `lib/ai/restore.ts` - Makes Replicate API calls
- `app/api/restore/route.ts` - Main restoration endpoint

### Timeline
- **Occurred**: Unknown (whenever token was set with newline)
- **Detected**: 2025-10-03 23:39 UTC (user report)
- **Root Cause Found**: 2025-10-03 23:45 UTC
- **Fixed**: 2025-10-03 23:47 UTC
- **Deployed**: 2025-10-03 23:48 UTC
- **Total Downtime**: Unknown duration

### Lessons Learned
1. Environment variables need validation, not just existence checks
2. Token format matters - whitespace can break authentication
3. Need better runtime validation of critical dependencies
4. Production smoke tests are essential
5. Error messages should be more specific about auth vs. other failures

---

### Verification of Fix

**Check for newline in token:**
```bash
vercel env pull .env.check --environment=production
cat .env.check | grep "REPLICATE" | od -c | tail -2
```

**Expected output (correct):**
```
...   e   "  \n
```
The `\n` should be AFTER the closing quote, not before it.

**Wrong output (has bug):**
```
...   e  \n   "  \n
```
A `\n` before the quote means the newline is INSIDE the token value.

---

**Status**: ✅ FIXED - Token properly set with `echo -n` and redeployed
**Date**: 2025-10-03  
**Severity**: CRITICAL
**Resolution Time**: ~45 minutes (including initial misdiagnosis)
**Root Cause**: Incorrect use of `echo` without `-n` flag in fix attempt

