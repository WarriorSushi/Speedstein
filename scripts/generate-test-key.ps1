# Generate Test API Key - PowerShell Helper
# Reads credentials from .dev.vars and generates test API key

Write-Host "🔑 Generating Test API Key" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if .dev.vars exists
if (-not (Test-Path "apps/worker/.dev.vars")) {
    Write-Host "❌ Error: apps/worker/.dev.vars not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .dev.vars with:" -ForegroundColor Yellow
    Write-Host "  SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co"
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
}

# Read environment variables from .dev.vars
Write-Host "📝 Reading credentials from apps/worker/.dev.vars..." -ForegroundColor Yellow
$devVars = Get-Content "apps/worker/.dev.vars"

foreach ($line in $devVars) {
    if ($line -match '^SUPABASE_URL=(.+)$') {
        $env:SUPABASE_URL = $matches[1]
    }
    if ($line -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)$') {
        $env:SUPABASE_SERVICE_ROLE_KEY = $matches[1]
    }
}

# Verify variables are set
if (-not $env:SUPABASE_URL) {
    Write-Host "❌ Error: SUPABASE_URL not found in .dev.vars" -ForegroundColor Red
    exit 1
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .dev.vars" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found SUPABASE_URL: $env:SUPABASE_URL" -ForegroundColor Green
Write-Host "✅ Found SUPABASE_SERVICE_ROLE_KEY: $($env:SUPABASE_SERVICE_ROLE_KEY.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Run the script
Write-Host "🚀 Generating test API key..." -ForegroundColor Cyan
Write-Host ""

node scripts/generate-test-api-key.mjs

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! Copy the API key above and use it for testing." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to generate API key. Check the error above." -ForegroundColor Red
}
