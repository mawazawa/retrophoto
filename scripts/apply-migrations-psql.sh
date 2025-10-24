#!/bin/bash
# Apply Supabase Migrations using psql
# This script directly applies SQL migrations to your Supabase database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RetroPhoto Migration Application (psql) ===${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check for database connection string
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set. Checking Supabase credentials...${NC}"

    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo -e "${RED}Error: Missing database credentials${NC}"
        echo ""
        echo "You need either:"
        echo "  1. DATABASE_URL environment variable, OR"
        echo "  2. NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD"
        echo ""
        echo "Get your connection string from:"
        echo "  Supabase Dashboard → Project Settings → Database → Connection String"
        echo ""
        echo "Example:"
        echo "  export DATABASE_URL='postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'"
        exit 1
    fi

    # Construct DATABASE_URL from Supabase credentials
    PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
    DATABASE_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
    echo -e "${GREEN}✓ Constructed DATABASE_URL from Supabase credentials${NC}"
fi

# Migration files in order
MIGRATIONS=(
    "010_create_user_credits.sql"
    "011_credit_batches.sql"
    "012_payment_transactions.sql"
    "013_stripe_webhook_events.sql"
    "014_payment_refunds.sql"
    "015_extend_user_credits.sql"
    "016_database_functions.sql"
    "017_extend_upload_sessions.sql"
)

MIGRATION_DIR="lib/supabase/migrations"

echo ""
echo -e "${BLUE}Database:${NC} $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo -e "${BLUE}Migrations to apply:${NC} ${#MIGRATIONS[@]}"
echo ""

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL or Supabase credentials"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Create migration tracking table if it doesn't exist
echo -e "${YELLOW}Setting up migration tracking...${NC}"
psql "$DATABASE_URL" <<EOF > /dev/null 2>&1
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
EOF
echo -e "${GREEN}✓ Migration tracking ready${NC}"
echo ""

# Apply each migration
APPLIED_COUNT=0
SKIPPED_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    migration_file="$MIGRATION_DIR/$migration"
    migration_version="${migration%.sql}"

    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi

    # Check if migration already applied
    ALREADY_APPLIED=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM schema_migrations WHERE version = '$migration_version'")

    if [ "$ALREADY_APPLIED" -gt 0 ]; then
        echo -e "${BLUE}⊘ $migration (already applied)${NC}"
        ((SKIPPED_COUNT++))
        continue
    fi

    echo -e "${YELLOW}→ Applying: $migration${NC}"

    # Apply migration in a transaction
    if psql "$DATABASE_URL" <<EOF
BEGIN;

-- Apply migration
\i $migration_file

-- Record migration
INSERT INTO schema_migrations (version) VALUES ('$migration_version');

COMMIT;
EOF
    then
        echo -e "${GREEN}✓ $migration applied successfully${NC}"
        ((APPLIED_COUNT++))
    else
        echo -e "${RED}✗ Failed to apply $migration${NC}"
        echo ""
        echo "The migration has been rolled back."
        echo "Please check the error message above and fix any issues."
        exit 1
    fi

    echo ""
done

echo ""
echo -e "${GREEN}=== Migration Summary ===${NC}"
echo -e "  Applied: ${GREEN}$APPLIED_COUNT${NC}"
echo -e "  Skipped: ${BLUE}$SKIPPED_COUNT${NC}"
echo -e "  Total: ${#MIGRATIONS[@]}"
echo ""

if [ $APPLIED_COUNT -gt 0 ]; then
    echo -e "${GREEN}🎉 All new migrations applied successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify tables: psql \"\$DATABASE_URL\" -c \"\\dt\""
    echo "2. Verify functions: psql \"\$DATABASE_URL\" -c \"\\df\""
    echo "3. Test payment flow with Stripe test mode"
else
    echo -e "${BLUE}ℹ No new migrations to apply${NC}"
fi
echo ""
