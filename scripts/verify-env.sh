#!/bin/bash
# Verify .env.local configuration
# Run this after Atlas agent completes setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RetroPhoto Environment Verification ===${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Please create .env.local from the Atlas agent output"
    exit 1
fi

echo -e "${BLUE}Loading .env.local...${NC}"
export $(cat .env.local | grep -v '^#' | xargs)

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "STRIPE_CREDITS_PRICE_ID"
    "REPLICATE_API_TOKEN"
    "ANTHROPIC_API_KEY"
)

OPTIONAL_VARS=(
    "OPENAI_API_KEY"
    "GOOGLE_AI_API_KEY"
    "XAI_API_KEY"
    "GROQ_API_KEY"
    "CRON_SECRET"
)

# Check required variables
echo ""
echo -e "${YELLOW}Checking required variables...${NC}"
MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ $var is not set${NC}"
        MISSING=$((MISSING + 1))
    else
        # Show first 10 characters only
        VALUE="${!var}"
        PREVIEW="${VALUE:0:10}..."
        echo -e "${GREEN}✓${NC} $var = $PREVIEW"
    fi
done

# Check optional variables
echo ""
echo -e "${YELLOW}Checking optional variables...${NC}"
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${BLUE}ℹ${NC} $var is not set (optional)"
    else
        VALUE="${!var}"
        PREVIEW="${VALUE:0:10}..."
        echo -e "${GREEN}✓${NC} $var = $PREVIEW"
    fi
done

echo ""
if [ $MISSING -gt 0 ]; then
    echo -e "${RED}❌ $MISSING required variables are missing${NC}"
    exit 1
fi

# Validate formats
echo ""
echo -e "${YELLOW}Validating formats...${NC}"

# Supabase URL
if [[ ! $NEXT_PUBLIC_SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL format incorrect${NC}"
    echo "   Expected: https://[project-ref].supabase.co"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase URL format valid"

# Supabase keys (JWT format)
if [[ ! $NEXT_PUBLIC_SUPABASE_ANON_KEY =~ ^eyJ.* ]]; then
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY format incorrect${NC}"
    echo "   Expected: JWT token starting with 'eyJ'"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase anon key format valid"

if [[ ! $SUPABASE_SERVICE_ROLE_KEY =~ ^eyJ.* ]]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY format incorrect${NC}"
    echo "   Expected: JWT token starting with 'eyJ'"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase service key format valid"

# Database URL
if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
    echo -e "${RED}❌ DATABASE_URL format incorrect${NC}"
    echo "   Expected: postgresql://..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Database URL format valid"

# Stripe keys
if [[ ! $STRIPE_SECRET_KEY =~ ^sk_test_.* ]] && [[ ! $STRIPE_SECRET_KEY =~ ^sk_live_.* ]]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY format incorrect${NC}"
    echo "   Expected: sk_test_... or sk_live_..."
    exit 1
fi
if [[ $STRIPE_SECRET_KEY =~ ^sk_test_.* ]]; then
    echo -e "${YELLOW}⚠${NC}  Stripe is in TEST MODE (sk_test_...)"
else
    echo -e "${GREEN}✓${NC} Stripe is in LIVE MODE (sk_live_...)"
fi

if [[ ! $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =~ ^pk_test_.* ]] && [[ ! $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =~ ^pk_live_.* ]]; then
    echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format incorrect${NC}"
    echo "   Expected: pk_test_... or pk_live_..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Stripe publishable key format valid"

if [[ ! $STRIPE_WEBHOOK_SECRET =~ ^whsec_.* ]]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET format incorrect${NC}"
    echo "   Expected: whsec_..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Stripe webhook secret format valid"

if [[ ! $STRIPE_CREDITS_PRICE_ID =~ ^price_.* ]]; then
    echo -e "${RED}❌ STRIPE_CREDITS_PRICE_ID format incorrect${NC}"
    echo "   Expected: price_..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Stripe price ID format valid"

# Replicate
if [[ ! $REPLICATE_API_TOKEN =~ ^r8_.* ]]; then
    echo -e "${RED}❌ REPLICATE_API_TOKEN format incorrect${NC}"
    echo "   Expected: r8_..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Replicate token format valid"

# Anthropic
if [[ ! $ANTHROPIC_API_KEY =~ ^sk-ant-.* ]]; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY format incorrect${NC}"
    echo "   Expected: sk-ant-..."
    exit 1
fi
echo -e "${GREEN}✓${NC} Anthropic key format valid"

# Test database connection
echo ""
echo -e "${YELLOW}Testing database connection...${NC}"
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Database connection successful"
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo "   Check your DATABASE_URL and network connection"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC}  psql not installed, skipping database connection test"
fi

echo ""
echo -e "${GREEN}=== All verifications passed! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: ./scripts/apply-migrations-psql.sh"
echo "3. Run: npm run dev"
echo "4. Test: http://localhost:3000"
echo ""
