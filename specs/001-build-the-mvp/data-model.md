# Data Model: MVP Landing Page

**Feature**: 001-build-the-mvp
**Date**: 2025-10-02
**Database**: PostgreSQL (Supabase)

## Naming Conventions

**Cross-Artifact Consistency**:
- **Specification documents** (spec.md, plan.md): Use PascalCase for entity names (e.g., "UploadSession", "RestorationResult")
- **Database schema** (this file): Use snake_case for table names (e.g., "upload_sessions", "restoration_results")
- **Code** (TypeScript): Use PascalCase for types/interfaces, snake_case for database queries

**Mapping**:
| Spec/Plan Name      | Database Table Name     | TypeScript Type        |
|---------------------|-------------------------|------------------------|
| UploadSession       | upload_sessions         | UploadSession          |
| RestorationResult   | restoration_results     | RestorationResult      |
| UserQuota           | user_quota              | UserQuota              |
| ShareArtifactSet    | (embedded in restoration_results) | ShareArtifactSet |
| AnalyticsEvent      | analytics_events        | AnalyticsEvent         |

## Entity Relationship Diagram

```
┌─────────────────────┐
│   user_quota        │
│─────────────────────│
│ fingerprint (PK)    │◄──┐
│ restore_count       │   │
│ last_restore_at     │   │
│ created_at          │   │
└─────────────────────┘   │
                          │
┌─────────────────────┐   │
│  upload_sessions    │   │
│─────────────────────│   │
│ id (PK, UUID)       │   │
│ user_fingerprint───────┘
│ original_url        │
│ status (enum)       │
│ created_at          │
│ ttl_expires_at      │
│ retry_count         │
└─────────────────────┘
          │
          │ 1:1
          ▼
┌─────────────────────┐
│ restoration_results │
│─────────────────────│
│ id (PK, UUID)       │
│ session_id (FK)     │◄──┐
│ restored_url        │   │
│ og_card_url         │   │
│ gif_url             │   │
│ deep_link           │   │
│ watermark_applied   │   │
│ created_at          │   │
│ cdn_cached          │   │
└─────────────────────┘   │
                          │
┌─────────────────────┐   │
│  analytics_events   │   │
│─────────────────────│   │
│ id (PK, UUID)       │   │
│ event_type (enum)   │   │
│ session_id (FK)────────┘
│ ttm_seconds         │
│ created_at          │
└─────────────────────┘
```

## Table Schemas

### `user_quota`

Tracks free tier usage (1 restore per fingerprint).

| Column           | Type      | Constraints                    | Description                          |
|------------------|-----------|--------------------------------|--------------------------------------|
| fingerprint      | TEXT      | PRIMARY KEY                    | Browser fingerprint (FingerprintJS)  |
| restore_count    | INTEGER   | NOT NULL DEFAULT 0, CHECK ≥ 0 | Number of restores used              |
| last_restore_at  | TIMESTAMP | NULL                           | Timestamp of most recent restore     |
| created_at       | TIMESTAMP | NOT NULL DEFAULT NOW()         | First seen timestamp                 |

**Indexes**:
- Primary key on `fingerprint` (B-tree)
- Index on `restore_count WHERE restore_count >= 1` (partial, for quota checks)

**RLS Policies**:
- SELECT: Public read (for quota checks)
- INSERT: Public (for new fingerprints)
- UPDATE: Only via `check_quota()` function (server-side enforcement)

---

### `upload_sessions`

Represents a single photo restoration session.

| Column           | Type      | Constraints                          | Description                             |
|------------------|-----------|--------------------------------------|-----------------------------------------|
| id               | UUID      | PRIMARY KEY DEFAULT uuid_generate_v4() | Session identifier                      |
| user_fingerprint | TEXT      | NOT NULL REFERENCES user_quota(fingerprint) | User who uploaded (quota enforcement)   |
| original_url     | TEXT      | NOT NULL                             | Supabase Storage URL for original image |
| status           | ENUM      | NOT NULL DEFAULT 'pending'           | pending/processing/complete/failed      |
| created_at       | TIMESTAMP | NOT NULL DEFAULT NOW()               | Upload timestamp                        |
| ttl_expires_at   | TIMESTAMP | NOT NULL DEFAULT NOW() + INTERVAL '24 hours' | Auto-delete timestamp (constitutional 24h TTL) |
| retry_count      | INTEGER   | NOT NULL DEFAULT 0, CHECK ≤ 1       | Retry attempts (max 1 per constitutional SLO) |

**Indexes**:
- Primary key on `id` (B-tree)
- Index on `user_fingerprint` (for quota lookups)
- Index on `status WHERE status = 'processing'` (partial, for monitoring)
- Index on `ttl_expires_at` (for cleanup cron job)

**RLS Policies**:
- SELECT: Public read (for viewing results)
- INSERT: Check `check_quota(user_fingerprint)` (server-side function)
- UPDATE: Server-only (status transitions)
- DELETE: Automatic via cron (TTL expiration)

**Enums**:
```sql
CREATE TYPE session_status AS ENUM ('pending', 'processing', 'complete', 'failed');
```

**State Transitions**:
1. `pending` → `processing` (AI model invoked)
2. `processing` → `complete` (success)
3. `processing` → `failed` (failure + retry_count = 1)
4. `processing` → `pending` (failure + retry_count = 0, retry once)
5. Any state → DELETED (on `ttl_expires_at` reached)

---

### `restoration_results`

Stores AI-restored image and share artifacts.

| Column            | Type      | Constraints                          | Description                                  |
|-------------------|-----------|--------------------------------------|----------------------------------------------|
| id                | UUID      | PRIMARY KEY DEFAULT uuid_generate_v4() | Result identifier                            |
| session_id        | UUID      | NOT NULL UNIQUE REFERENCES upload_sessions(id) ON DELETE CASCADE | Parent session (1:1 relationship)            |
| restored_url      | TEXT      | NOT NULL                             | Supabase Storage URL for restored image      |
| og_card_url       | TEXT      | NOT NULL                             | URL for OG card (before→after split view)    |
| gif_url           | TEXT      | NOT NULL                             | URL for animated GIF (wipe reveal)           |
| deep_link         | TEXT      | NOT NULL                             | Shareable URL (e.g., /result/[session_id])  |
| watermark_applied | BOOLEAN   | NOT NULL DEFAULT true                | Free tier watermark badge applied            |
| created_at        | TIMESTAMP | NOT NULL DEFAULT NOW()               | Result generation timestamp                  |
| cdn_cached        | BOOLEAN   | NOT NULL DEFAULT false               | CDN cache status (for monitoring)            |

**Indexes**:
- Primary key on `id` (B-tree)
- Unique index on `session_id` (enforce 1:1 relationship)
- Index on `cdn_cached WHERE cdn_cached = false` (partial, for cache warming)

**RLS Policies**:
- SELECT: Public read (for sharing)
- INSERT: Server-only (generated during restore process)
- UPDATE: Server-only (cdn_cached status updates)
- DELETE: Cascade from `upload_sessions` (on TTL expiration)

---

### `analytics_events`

Tracks performance metrics (TTM, NSM) and user actions.

| Column       | Type      | Constraints                          | Description                                   |
|--------------|-----------|--------------------------------------|-----------------------------------------------|
| id           | UUID      | PRIMARY KEY DEFAULT uuid_generate_v4() | Event identifier                              |
| event_type   | ENUM      | NOT NULL                             | upload_start/restore_complete/share_click/upgrade_view |
| session_id   | UUID      | NULL REFERENCES upload_sessions(id) ON DELETE SET NULL | Related session (nullable for non-session events) |
| ttm_seconds  | DECIMAL(6,3) | NULL, CHECK ≥ 0                   | Time-to-Magic duration (for restore_complete) |
| created_at   | TIMESTAMP | NOT NULL DEFAULT NOW()               | Event timestamp                               |

**Indexes**:
- Primary key on `id` (B-tree)
- Index on `event_type, created_at DESC` (for time-series queries)
- Index on `ttm_seconds WHERE ttm_seconds > 12` (partial, for SLO alerting)

**RLS Policies**:
- SELECT: Server-only (analytics dashboard)
- INSERT: Public (client-side beaconing for NSM, server-side for TTM)
- UPDATE: Disabled
- DELETE: Disabled (append-only log)

**Enums**:
```sql
CREATE TYPE event_type AS ENUM (
  'upload_start',         -- User begins upload
  'restore_complete',     -- AI processing finishes (TTM recorded)
  'share_click',          -- User opens share sheet
  'upgrade_view'          -- User sees upgrade prompt
);
```

**Metrics Calculation**:
- **TTM p50**: `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ttm_seconds) FROM analytics_events WHERE event_type = 'restore_complete'`
- **TTM p95**: `SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ttm_seconds) FROM analytics_events WHERE event_type = 'restore_complete'`
- **NSM**: Calculated client-side (`performance.mark('preview-visible')` - `performance.mark('upload-start')`), beaconed to this table

---

## Validation Rules

### `user_quota`
- `restore_count` MUST be ≥ 0 (CHECK constraint)
- `restore_count` MUST be ≤ 1 for free tier enforcement (application logic)

### `upload_sessions`
- `original_url` MUST match pattern `https://[a-z0-9]+.supabase.co/storage/v1/object/public/uploads/` (CHECK constraint)
- `retry_count` MUST be ≤ 1 (CHECK constraint, constitutional SLO)
- `ttl_expires_at` MUST be ≥ `created_at` (CHECK constraint)
- `status` transitions enforced by application logic (no direct UPDATE from client)

### `restoration_results`
- `session_id` MUST have `upload_sessions.status = 'complete'` (FK constraint + trigger)
- All URL fields MUST be valid HTTPS URLs (CHECK constraint)
- `deep_link` MUST match pattern `https://retrophoto.app/result/[uuid]` (CHECK constraint)

### `analytics_events`
- `ttm_seconds` MUST be > 0 AND < 120 (CHECK constraint: 0-120 second range)
- `ttm_seconds` flagged if > 30 (NSM threshold alert)
- `ttm_seconds` flagged if > 12 (p95 threshold alert)
- `event_type = 'restore_complete'` MUST have non-NULL `session_id` (CHECK constraint)

---

## Database Functions

### `check_quota(user_fingerprint TEXT) RETURNS BOOLEAN`

Server-side function to enforce free tier quota (1 restore).

```sql
CREATE OR REPLACE FUNCTION check_quota(user_fingerprint TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT restore_count INTO current_count
  FROM user_quota
  WHERE fingerprint = user_fingerprint;

  -- New user: allow
  IF current_count IS NULL THEN
    INSERT INTO user_quota (fingerprint, restore_count) VALUES (user_fingerprint, 0);
    RETURN TRUE;
  END IF;

  -- Quota exhausted: deny
  IF current_count >= 1 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `cleanup_expired_sessions() RETURNS INTEGER`

Cron job function to delete sessions past TTL (24h).

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions (CASCADE to restoration_results)
  DELETE FROM upload_sessions
  WHERE ttl_expires_at < NOW()
  RETURNING COUNT(*) INTO deleted_count;

  -- Also delete files from Supabase Storage
  -- (Handled by application logic via Supabase Storage lifecycle policies)

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Cron schedule**: `SELECT cron.schedule('cleanup-expired', '0 * * * *', 'SELECT cleanup_expired_sessions()');` (runs hourly)

---

## Supabase Storage Buckets

### `uploads` (original images)

- **Public**: No (requires signed URL)
- **File size limit**: 20MB (constitutional constraint FR-002)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/heic`, `image/webp`
- **Lifecycle policy**: Delete files older than 24h (set `x-amz-expiration` header)
- **RLS**: INSERT requires valid `user_fingerprint` with quota

### `restorations` (restored images, OG cards, GIFs)

- **Public**: Yes (CDN-cached for sharing)
- **File size limit**: 50MB (for high-res results)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`
- **Lifecycle policy**: Cascade delete when parent `upload_sessions` deleted
- **CDN**: Cloudflare (automatic via Supabase)

---

## Migration Order

1. Create enums (`session_status`, `event_type`)
2. Create `user_quota` table + indexes
3. Create `upload_sessions` table + indexes + FK
4. Create `restoration_results` table + indexes + FK + CASCADE
5. Create `analytics_events` table + indexes
6. Create functions (`check_quota`, `cleanup_expired_sessions`)
7. Create RLS policies
8. Create Supabase Storage buckets with lifecycle policies
9. Schedule cron job for cleanup

---

## Constitutional Compliance

- **Principle VI (Trust & Privacy)**: 24h TTL enforced via `ttl_expires_at` + cron job
- **Principle VIII (North-Star Metrics)**: TTM p50/p95 tracked in `analytics_events`
- **Principle VII (Tasteful Monetization)**: Free tier quota enforced via `user_quota.restore_count`
- **Principle XV (Performance & Cost Guardrails)**: Retry limit enforced via `upload_sessions.retry_count ≤ 1`

**Ready for contracts generation** (API endpoint schemas).
