# Set Production Secrets for Speedstein Worker
# This script helps set all required secrets for production deployment
# Run from repository root: pwsh scripts/set-production-secrets.ps1

Write-Host "🔐 Setting Production Secrets for Speedstein Worker" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will set the following secrets:"
Write-Host "  1. SUPABASE_URL"
Write-Host "  2. SUPABASE_SERVICE_ROLE_KEY"
Write-Host "  3. DODO_API_KEY (optional - for billing)"
Write-Host "  4. DODO_WEBHOOK_SECRET (optional - for billing)"
Write-Host ""

# Check if .dev.vars exists to pre-fill values
if (Test-Path "apps/worker/.dev.vars") {
  Write-Host "📝 Found .dev.vars file. Current values:" -ForegroundColor Yellow
  Write-Host ""
  Get-Content "apps/worker/.dev.vars" | Select-String "^SUPABASE_URL=" | Write-Host
  Write-Host "SUPABASE_SERVICE_ROLE_KEY=<hidden>"
  Get-Content "apps/worker/.dev.vars" | Select-String "^DODO_API_KEY=" | Write-Host
  Write-Host "DODO_WEBHOOK_SECRET=<hidden>"
  Write-Host ""
  Write-Host "You can copy these values from .dev.vars if they're the same for production." -ForegroundColor Yellow
  Write-Host ""
}

Set-Location "apps/worker"

Write-Host "Setting SUPABASE_URL..." -ForegroundColor Green
Write-Host "Paste your production Supabase URL:"
npx wrangler secret put SUPABASE_URL

Write-Host ""
Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Green
Write-Host "Paste your Supabase service role key:"
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
$setupDodo = Read-Host "Do you want to set DodoPayments credentials now? (y/N)"
if ($setupDodo -match "^[Yy]$") {
  Write-Host ""
  Write-Host "Setting DODO_API_KEY..." -ForegroundColor Green
  npx wrangler secret put DODO_API_KEY

  Write-Host ""
  Write-Host "Setting DODO_WEBHOOK_SECRET..." -ForegroundColor Green
  npx wrangler secret put DODO_WEBHOOK_SECRET
} else {
  Write-Host "Skipping DodoPayments secrets (can be set later)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Secrets configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Verify secrets were set:"
npx wrangler secret list

Write-Host ""
Write-Host "🚀 Your Worker is ready! Test it:"
Write-Host "  curl https://speedstein-worker.treasurepacks-com.workers.dev/health"
Write-Host ""
