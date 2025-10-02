# Supabase Database Setup

## Overview

This directory contains database migrations for the RetroPhoto MVP. All migrations enforce constitutional requirements (quota limits, TTL policies, performance SLOs).

## Migration Files

| File | Description | Constitutional Principle |
|------|-------------|-------------------------|
| `001_create_enums.sql` | Create `session_status` and `event_type` enums | Principle VIII (SLO enforcement) |
| `002_user_quota.sql` | Create `user_quota` table with RLS | Principle VII (Free tier: 1 restore) |
| `003_upload_sessions.sql` | Create `upload_sessions` with 24h TTL | Principle VI (Trust & Privacy) |
| `004_restoration_results.sql` | Create `restoration_results` with share artifacts | Principle V (Share-Ready) |
| `005_analytics_events.sql` | Create `analytics_events` for NSM/TTM tracking | Principle VIII (North-Star Metrics) |
| `006_check_quota_function.sql` | Server-side quota enforcement function | Principle VII (Tasteful Monetization) |
| `007_cleanup_function.sql` | TTL cleanup function | Principle VI (24h auto-delete) |
| `008_cron_schedule.sql` | Hourly cron job for cleanup | Principle VI (Automated enforcement) |

## Running Migrations

### Option 1: Supabase Dashboard (Manual)

1. Navigate to **SQL Editor** in Supabase Dashboard
2. Execute migrations in order (001 → 008)
3. Verify tables in **Database** > **Tables**

### Option 2: Supabase CLI (Automated)

```bash
# Initialize Supabase project (if not already done)
npx supabase init

# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push

# Verify migrations
npx supabase db remote commit
```

### Option 3: Direct psql (Development)

```bash
# Set environment variables
export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
for file in lib/supabase/migrations/*.sql; do
  echo "Running $file..."
  psql $SUPABASE_DB_URL -f "$file"
done
```

## Verification

After running migrations, verify the schema:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check enums exist
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname IN ('check_quota', 'cleanup_expired_sessions');

-- Check cron job scheduled
SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-sessions';

-- Test quota function
SELECT * FROM check_quota('test-fingerprint-123');
```

Expected output:
- **Tables**: `user_quota`, `upload_sessions`, `restoration_results`, `analytics_events`
- **Enums**: `session_status`, `event_type`
- **Functions**: `check_quota`, `cleanup_expired_sessions`
- **Cron Job**: `cleanup-expired-sessions` (schedule: `0 * * * *`)

## Storage Buckets

After database migrations, create storage buckets:

1. See `STORAGE_SETUP.md` for detailed instructions
2. Create `uploads` bucket (private, 20MB limit)
3. Create `restorations` bucket (public, CDN-cached)

## Environment Variables

Update `.env.local` with Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

### Issue: "permission denied for schema public"

**Solution**: Grant permissions to anon role:

```sql
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### Issue: "pg_cron extension not found"

**Solution**: Enable pg_cron in Supabase Dashboard:
- Navigate to **Database** > **Extensions**
- Enable `pg_cron`

### Issue: "check_quota function returns null"

**Solution**: Ensure RLS policies allow SELECT on `user_quota`:

```sql
-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'user_quota';
```

## Development Workflow

1. **Create Migration**: Add new `.sql` file to `migrations/`
2. **Test Locally**: Run migration on local Supabase instance
3. **Verify**: Check tables, functions, RLS policies
4. **Apply to Production**: Use Supabase Dashboard or CLI
5. **Commit**: Add migration to git repository

## Production Considerations

- **Backup Before Migrations**: Use Supabase Dashboard to create backup
- **Zero-Downtime Migrations**: Use `CREATE INDEX CONCURRENTLY` for large tables
- **Monitor Performance**: Check query performance after schema changes
- **RLS Testing**: Verify RLS policies in both anon and authenticated contexts

## Next Steps

After completing database setup:
1. Implement library utilities (T035-T049)
2. Implement API routes (T050-T053)
3. Run contract tests (T011-T016) to verify API endpoints
