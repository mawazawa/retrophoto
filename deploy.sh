#!/bin/bash

# ============================================
# RetroPhoto Production Deployment Script
# ============================================

set -e  # Exit on error

echo "🚀 RetroPhoto Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Pre-deployment checks
echo "📋 Step 1/5: Pre-deployment checks..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

# Check for required env vars
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "REPLICATE_API_TOKEN"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables check passed${NC}"

# Step 2: TypeScript check
echo ""
echo "🔍 Step 2/5: TypeScript validation..."
if npm run typecheck; then
    echo -e "${GREEN}✅ TypeScript validation passed${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    echo "Fix TypeScript errors before deploying"
    exit 1
fi

# Step 3: Build check
echo ""
echo "🏗️  Step 3/5: Production build..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Database verification
echo ""
echo "🗄️  Step 4/5: Database verification..."
echo -e "${YELLOW}⚠️  IMPORTANT: Have you run the database migrations?${NC}"
echo ""
echo "If not, please:"
echo "1. Go to: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new"
echo "2. Copy/paste contents of: DEPLOY_DATABASE.sql"
echo "3. Click RUN"
echo ""
read -p "Have you completed the database setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please complete database setup first${NC}"
    echo "See DEPLOY_NOW_GUIDE.md for instructions"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .limit(1);

  if (error && error.code === 'PGRST205') {
    console.log('❌ Database tables not found');
    console.log('Please run DEPLOY_DATABASE.sql in Supabase SQL Editor');
    process.exit(1);
  } else if (error) {
    console.log('⚠️  Database connected but error:', error.message);
  } else {
    console.log('✅ Database connected successfully');
  }
})();
" || {
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check database setup"
    exit 1
}

# Step 5: Deploy
echo ""
echo "🚀 Step 5/5: Deploying to Vercel..."
echo ""
echo "Choose deployment method:"
echo "1) Deploy with Vercel CLI (vercel --prod)"
echo "2) Push to Git (auto-deploy if connected)"
echo "3) Skip deployment (just build)"
read -p "Enter choice (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        if command -v vercel &> /dev/null; then
            echo "Deploying to Vercel..."
            vercel --prod
        else
            echo -e "${RED}❌ Vercel CLI not installed${NC}"
            echo "Install with: npm i -g vercel"
            exit 1
        fi
        ;;
    2)
        echo "Committing changes..."
        git add .
        git commit -m "feat: production deployment ready" || echo "No changes to commit"
        git push origin main
        echo -e "${GREEN}✅ Pushed to Git${NC}"
        echo "Check Vercel dashboard for deployment status"
        ;;
    3)
        echo "Skipping deployment"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Visit your deployment URL"
echo "2. Test image upload and restoration"
echo "3. Verify quota system works"
echo "4. Test payment integration"
echo ""
echo "Monitoring:"
echo "- Sentry: https://sentry.io (if configured)"
echo "- Vercel: https://vercel.com/dashboard"
echo "- Supabase: https://supabase.com/dashboard"
echo ""
