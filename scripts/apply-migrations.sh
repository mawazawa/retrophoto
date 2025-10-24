#!/bin/bash
# Apply Supabase Migrations
# This script helps apply SQL migrations to Supabase database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}=== RetroPhoto Migration Application ===${NC}"
echo ""

# Check environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    exit 1
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

echo "Project URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Migrations to apply: ${#MIGRATIONS[@]}"
echo ""

# Apply each migration
for migration in "${MIGRATIONS[@]}"; do
    migration_file="$MIGRATION_DIR/$migration"

    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Applying: $migration${NC}"

    # Try to apply via Supabase CLI
    if command -v supabase &> /dev/null; then
        # Check if we can connect to the database
        DB_URL="${NEXT_PUBLIC_SUPABASE_URL/https:\/\//}"
        DB_URL="${DB_URL/.supabase.co/}"

        # Use Supabase CLI to execute the SQL
        if supabase db execute --db-url "$DATABASE_URL" --file "$migration_file" 2>/dev/null; then
            echo -e "${GREEN}✓ $migration applied successfully${NC}"
        else
            # Fallback: Display SQL for manual execution
            echo -e "${YELLOW}⚠ Could not auto-apply. Use Supabase Dashboard SQL Editor:${NC}"
            echo ""
            echo "-- Copy this SQL:"
            echo "-- File: $migration"
            cat "$migration_file"
            echo ""
            read -p "Press Enter after applying this migration manually..."
        fi
    else
        # No Supabase CLI - show manual instructions
        echo -e "${YELLOW}⚠ Supabase CLI not found. Apply manually:${NC}"
        echo ""
        echo "1. Open Supabase Dashboard → SQL Editor"
        echo "2. Copy and paste this SQL:"
        echo ""
        cat "$migration_file"
        echo ""
        read -p "Press Enter after applying this migration manually..."
    fi
done

echo ""
echo -e "${GREEN}=== All migrations applied successfully! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Verify tables exist: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo "2. Verify RLS policies: SELECT * FROM pg_policies;"
echo "3. Test payment flow with Stripe test mode"
echo ""
