# 🚀 DEPLOY NOW - Worker is LIVE!

## ✅ What's Already Done

Your Worker is **DEPLOYED and RUNNING**:
- **URL**: https://speedstein-worker.treasurepacks-com.workers.dev
- **Status**: ✅ Health endpoint responding
- **Resources**: R2, KV, Browser Rendering all configured
- **Build**: ✅ TypeScript compiles with 0 errors

## ⚡ What You Need to Do (5 minutes)

### Step 1: Set Production Secrets

Your `.dev.vars` file already has the correct values. Just copy them to production:

```powershell
cd apps/worker

# Set SUPABASE_URL (copy from .dev.vars)
npx wrangler secret put SUPABASE_URL
# Paste: https://czvvgfprjlkahobgncxo.supabase.co

# Set SUPABASE_SERVICE_ROLE_KEY (from your earlier message)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste the service role key you provided earlier

# Optional: Set DodoPayments (if you have credentials)
npx wrangler secret put DODO_API_KEY
npx wrangler secret put DODO_WEBHOOK_SECRET
```

**Or use the automated script:**
```powershell
pwsh scripts/set-production-secrets.ps1
```

### Step 2: Verify Secrets

```powershell
cd apps/worker
npx wrangler secret list
```

Should show:
```
SECRET_NAME               | SECRET_VALUE
──────────────────────────┼──────────────
SUPABASE_URL              | <set>
SUPABASE_SERVICE_ROLE_KEY | <set>
```

### Step 3: Test the API

Generate a test API key:

```powershell
# Set environment variables (PowerShell)
$env:SUPABASE_URL="https://czvvgfprjlkahobgncxo.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Generate test key
node scripts/generate-test-api-key.mjs
```

This will output something like:
```
✅ Test API key generated successfully!

API Key (save this - it won't be shown again):

  sk_test_abcd1234xyz...
```

### Step 4: Run E2E Tests

```powershell
# Set the test API key
$env:TEST_API_KEY="sk_test_abcd1234xyz..."

# Run E2E tests against production
node scripts/test-api-e2e.mjs --url "https://speedstein-worker.treasurepacks-com.workers.dev"
```

Expected output:
```
╔══════════════════════════════════════════════════════════╗
║         Speedstein E2E API Test Suite                   ║
╚══════════════════════════════════════════════════════════╝

✓ Health check passed
✓ PDF generated successfully in 1523ms
✓ PDF URL: https://cdn.speedstein.com/pdfs/abc123.pdf
✓ Performance: 1456ms < 2s target ✓

╔══════════════════════════════════════════════════════════╗
║                  ALL TESTS PASSED ✓                      ║
╚══════════════════════════════════════════════════════════╝
```

## 🎯 Current Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Worker Deployed | ✅ LIVE | None |
| Health Endpoint | ✅ Working | None |
| TypeScript Build | ✅ 0 errors | None |
| R2 Bucket | ✅ Exists | Configure lifecycle policies* |
| KV Namespace | ✅ Exists | None |
| Browser Rendering | ✅ Enabled | None |
| Secrets | ⚠️ Pending | **Set via wrangler** |
| E2E Tests | ⏳ Ready | **Run after secrets set** |

\* R2 lifecycle policies need to be configured in Cloudflare dashboard (see [docs/r2-lifecycle-setup.md](docs/r2-lifecycle-setup.md))

## 📋 Post-Deployment Checklist

After setting secrets and running tests:

- [ ] Secrets set and verified
- [ ] E2E tests pass
- [ ] Health endpoint returns 200 OK
- [ ] PDF generation works (< 2s)
- [ ] R2 lifecycle policies configured (manual, 15 min)
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled in Cloudflare dashboard
- [ ] Error alerts configured

## 🆘 Troubleshooting

### Secrets Not Working
```powershell
# Re-set secrets
cd apps/worker
npx wrangler secret delete SUPABASE_URL
npx wrangler secret put SUPABASE_URL
```

### E2E Tests Failing
```powershell
# Check Worker logs
cd apps/worker
npx wrangler tail
```

### Need to Rollback
```powershell
# List deployments
cd apps/worker
npx wrangler deployments list

# Rollback to previous
npx wrangler rollback [DEPLOYMENT_ID]
```

## 🎊 You're Almost Done!

Just 3 commands away from a fully functional production API:

1. **Set secrets** (5 min)
2. **Generate test key** (1 min)
3. **Run E2E tests** (1 min)

Total time: **7 minutes**

Then your PDF API is **LIVE IN PRODUCTION** 🚀
