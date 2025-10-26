#!/bin/bash
# Set Production Secrets for Speedstein Worker
#
# This script helps set all required secrets for production deployment
# Run from repository root: bash scripts/set-production-secrets.sh

set -e

echo "🔐 Setting Production Secrets for Speedstein Worker"
echo "===================================================="
echo ""
echo "This will set the following secrets:"
echo "  1. SUPABASE_URL"
echo "  2. SUPABASE_SERVICE_ROLE_KEY"
echo "  3. DODO_API_KEY (optional - for billing)"
echo "  4. DODO_WEBHOOK_SECRET (optional - for billing)"
echo ""

# Check if .dev.vars exists to pre-fill values
if [ -f "apps/worker/.dev.vars" ]; then
  echo "📝 Found .dev.vars file. You can use these values for production:"
  echo ""
  grep -E "^SUPABASE_URL=" apps/worker/.dev.vars || true
  echo "SUPABASE_SERVICE_ROLE_KEY=<hidden>"
  grep -E "^DODO_API_KEY=" apps/worker/.dev.vars || true
  echo "DODO_WEBHOOK_SECRET=<hidden>"
  echo ""
fi

cd apps/worker

echo "Setting SUPABASE_URL..."
echo "Paste your production Supabase URL (e.g., https://xxx.supabase.co):"
npx wrangler secret put SUPABASE_URL

echo ""
echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "Paste your Supabase service role key:"
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

echo ""
read -p "Do you want to set DodoPayments credentials now? (y/N): " setup_dodo
if [[ $setup_dodo =~ ^[Yy]$ ]]; then
  echo ""
  echo "Setting DODO_API_KEY..."
  npx wrangler secret put DODO_API_KEY

  echo ""
  echo "Setting DODO_WEBHOOK_SECRET..."
  npx wrangler secret put DODO_WEBHOOK_SECRET
else
  echo "Skipping DodoPayments secrets (can be set later)"
fi

echo ""
echo "✅ Secrets configured successfully!"
echo ""
echo "Verify secrets were set:"
npx wrangler secret list

echo ""
echo "🚀 Your Worker is ready! Test it:"
echo "  curl https://speedstein-worker.treasurepacks-com.workers.dev/health"
echo ""
