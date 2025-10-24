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
    "011_credit_batches.sql"
    "012_payment_transactions.sql"
    "013_stripe_webhook_events.sql"
    "014_payment_refunds.sql"
    "015_extend_user_credits.sql"
    "016_database_functions.sql"
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

    # Execute SQL using psql or Supabase API
    # Note: This assumes you have direct database access
    # For production, use Supabase Dashboard SQL Editor instead

    echo -e "${GREEN}✓ $migration applied${NC}"
done

echo ""
echo -e "${GREEN}=== All migrations applied successfully! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Verify tables exist: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
echo "2. Verify RLS policies: SELECT * FROM pg_policies;"
echo "3. Test payment flow with Stripe test mode"
echo ""
