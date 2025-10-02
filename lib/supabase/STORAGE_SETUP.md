# Supabase Storage Buckets Setup

## Overview

RetroPhoto MVP requires two Storage buckets with specific configurations to enforce constitutional requirements (24h TTL, CDN caching, RLS).

## Bucket 1: `uploads` (Private, Ephemeral)

**Purpose**: Store original uploaded images (auto-delete after 24h)

**Configuration**:
- **Name**: `uploads`
- **Public**: `false` (private bucket, signed URLs only)
- **File Size Limit**: 20 MB (constitutional requirement)
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/heic`, `image/webp`

### RLS Policies

```sql
-- Allow public INSERT (users can upload)
CREATE POLICY "uploads_insert_public" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated SELECT (server-side processing)
CREATE POLICY "uploads_select_authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Allow authenticated DELETE (TTL cleanup)
CREATE POLICY "uploads_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
```

### Lifecycle Policy (TTL)

**Note**: Supabase does not natively support S3-style lifecycle policies. TTL enforcement requires:

1. **Database-level TTL**: `upload_sessions.ttl_expires_at` triggers cleanup via cron job (migration 008)
2. **Storage deletion**: Handled via Supabase Edge Function that deletes storage objects when database records are cleaned

**Implementation** (to be created in library utilities):
- `lib/storage/uploads.ts` includes cleanup function
- Called by cron job or Edge Function webhook

## Bucket 2: `restorations` (Public, CDN-Cached)

**Purpose**: Store restored images and share artifacts (immutable, public access)

**Configuration**:
- **Name**: `restorations`
- **Public**: `true` (CDN-cached, immutable URLs)
- **File Size Limit**: 50 MB (covers restored images + GIFs)
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/gif`
- **Cache-Control**: `public, max-age=31536000, immutable` (1 year, immutable URLs)

### RLS Policies

```sql
-- Allow public SELECT (for sharing)
CREATE POLICY "restorations_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'restorations');

-- Restrict INSERT to authenticated (server-side only)
CREATE POLICY "restorations_insert_authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'restorations' AND auth.role() = 'authenticated');

-- Allow authenticated DELETE (user-initiated purge)
CREATE POLICY "restorations_delete_authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'restorations' AND auth.role() = 'authenticated');
```

### Lifecycle Policy

**Retention**: 24h for free tier (matches `upload_sessions` TTL), 30 days for paid tier (future)

**Cleanup Strategy**:
- Free tier: CASCADE delete from `restoration_results` (triggered by `upload_sessions` deletion)
- Paid tier: User opt-in retention (future phase, not MVP)

## Setup Instructions

### Option 1: Supabase Dashboard (Manual)

1. Navigate to **Storage** in Supabase Dashboard
2. Create `uploads` bucket:
   - Click **New Bucket**
   - Name: `uploads`
   - Public: `false`
   - File Size Limit: `20000000` (20 MB)
   - Allowed MIME: `image/jpeg,image/png,image/heic,image/webp`
3. Create `restorations` bucket:
   - Click **New Bucket**
   - Name: `restorations`
   - Public: `true`
   - File Size Limit: `50000000` (50 MB)
   - Allowed MIME: `image/jpeg,image/png,image/gif`
4. Apply RLS policies (copy SQL from sections above)

### Option 2: Supabase CLI (Automated)

```bash
# Create uploads bucket
supabase storage create uploads --public false --file-size-limit 20000000

# Create restorations bucket
supabase storage create restorations --public true --file-size-limit 50000000

# Apply RLS policies
psql $DATABASE_URL -f lib/supabase/storage_policies.sql
```

### Option 3: Terraform (Infrastructure as Code)

```hcl
resource "supabase_storage_bucket" "uploads" {
  name                = "uploads"
  public              = false
  file_size_limit     = 20000000
  allowed_mime_types  = ["image/jpeg", "image/png", "image/heic", "image/webp"]
}

resource "supabase_storage_bucket" "restorations" {
  name                = "restorations"
  public              = true
  file_size_limit     = 50000000
  allowed_mime_types  = ["image/jpeg", "image/png", "image/gif"]
}
```

## Verification

After setup, verify buckets:

```bash
# Check bucket existence
curl "$SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Test upload to 'uploads' bucket
curl "$SUPABASE_URL/storage/v1/object/uploads/test.jpg" \
  -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -F "file=@test.jpg"

# Test public access to 'restorations' bucket
curl "$SUPABASE_URL/storage/v1/object/public/restorations/test.jpg"
```

## Constitutional Compliance

- ✅ **Principle VI: Trust & Privacy** - 24h TTL for free tier (`uploads` TTL, `upload_sessions` cleanup)
- ✅ **Principle VI: Server-Side Enforcement** - Private `uploads` bucket, authenticated INSERT for `restorations`
- ✅ **Principle XV: Performance** - CDN caching for `restorations` bucket (immutable URLs)
- ✅ **Constraint: Upload Limit** - 20 MB max file size enforced at storage layer

## Next Steps

1. Complete T032-T033 by manually creating buckets in Supabase Dashboard
2. Implement storage helpers in `lib/storage/uploads.ts` (T037-T038)
3. Implement TTL cleanup in storage utilities (T037-T038)
