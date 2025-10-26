# Deployment Guide

## Worker Deployment (Cloudflare Workers)

### Prerequisites

1. **Cloudflare Account** with Workers subscription
2. **Wrangler CLI** authenticated
3. **Production Supabase** project set up
4. **R2 Buckets** created with lifecycle policies
5. **Environment secrets** ready

### Pre-Deployment Checklist

Before deploying, ensure:

- ✅ TypeScript compilation passes (`pnpm run typecheck`)
- ✅ All tests pass (`pnpm test`)
- ✅ Environment variables documented
- ✅ Database migrations applied to production
- ✅ R2 buckets created with lifecycle rules
- ✅ KV namespaces created

### Step 1: Verify Authentication

```bash
# Check if already logged in
npx wrangler whoami

# If not authenticated, log in
npx wrangler login
```

**Expected output:**
```
You are logged in with an OAuth Token, associated with the email 'your-email@example.com'!
```

### Step 2: Set Production Secrets

Set all required environment variables as Cloudflare secrets:

```bash
cd apps/worker

# Supabase credentials
npx wrangler secret put SUPABASE_URL
# Enter: https://czvvgfprjlkahobgncxo.supabase.co

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase service role key

# DodoPayments credentials (for billing)
npx wrangler secret put DODO_API_KEY
# Enter your DodoPayments API key

npx wrangler secret put DODO_WEBHOOK_SECRET
# Enter your DodoPayments webhook secret
```

**Security Note**: Secrets are encrypted and only accessible by your Worker. Never commit `.dev.vars` to version control.

### Step 3: Verify wrangler.toml Configuration

Check that `apps/worker/wrangler.toml` has correct production settings:

```toml
name = "speedstein-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "speedstein-worker-production"
route = "api.speedstein.com/*"  # Your custom domain

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your_production_kv_id"  # Update with production KV ID

[[r2_buckets]]
binding = "PDF_STORAGE"
bucket_name = "speedstein-pdfs"  # Production bucket

[browser]
binding = "BROWSER"

[[durable_objects.bindings]]
name = "BROWSER_POOL_DO"
class_name = "BrowserPoolDO"

[[migrations]]
tag = "v1"
new_classes = ["BrowserPoolDO"]
```

### Step 4: Create Production Resources

#### 4.1: Create KV Namespace

```bash
# Create production KV namespace
npx wrangler kv:namespace create "RATE_LIMIT_KV" --env production

# Output will show ID - update wrangler.toml
# Example: id = "22a4d1624e4848ed9fdcc541bcf7ab39"
```

#### 4.2: Create R2 Bucket

```bash
# Create production R2 bucket
npx wrangler r2 bucket create speedstein-pdfs

# Verify bucket exists
npx wrangler r2 bucket list
```

#### 4.3: Configure R2 Lifecycle Policies

Follow the guide in [docs/r2-lifecycle-setup.md](../docs/r2-lifecycle-setup.md):

1. Navigate to Cloudflare Dashboard → R2 → `speedstein-pdfs`
2. Go to "Settings" → "Lifecycle rules"
3. Create 4 rules:

| Rule Name | Tag Key | Tag Value | Days to Expire |
|-----------|---------|-----------|----------------|
| free-tier-1day-ttl | tier | free | 1 |
| starter-tier-7day-ttl | tier | starter | 7 |
| pro-tier-30day-ttl | tier | pro | 30 |
| enterprise-tier-90day-ttl | tier | enterprise | 90 |

#### 4.4: Configure R2 Custom Domain

1. Go to R2 bucket settings → "Public access"
2. Add custom domain: `cdn.speedstein.com`
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 24 hours)

### Step 5: Deploy to Production

```bash
cd apps/worker

# Deploy to production
pnpm run deploy

# Or with explicit environment
npx wrangler deploy --env production
```

**Expected output:**
```
Total Upload: 234 KiB / gzip: 45 KiB
Uploaded speedstein-worker-production (2.3 sec)
Published speedstein-worker-production (0.5 sec)
  https://speedstein-worker-production.your-account.workers.dev
Current Deployment ID: 01234567-89ab-cdef-0123-456789abcdef
```

### Step 6: Configure Custom Domain

#### 6.1: Add Route in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select `speedstein-worker-production`
3. Go to "Triggers" tab
4. Add custom domain: `api.speedstein.com`
5. Cloudflare will automatically create DNS records

#### 6.2: Verify DNS Records

```bash
# Check DNS propagation
nslookup api.speedstein.com

# Or use dig
dig api.speedstein.com
```

**Expected**: Should resolve to Cloudflare Workers edge

### Step 7: Verify Deployment

#### 7.1: Test Health Endpoint

```bash
# Test health check
curl https://api.speedstein.com/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-26T12:00:00.000Z",
#   "version": "1.0.0"
# }
```

#### 7.2: Run E2E Tests

```bash
# Generate production test API key
SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_production_key \
node scripts/generate-test-api-key.mjs

# Run E2E tests against production
export TEST_API_KEY="sk_test_xxx"
node scripts/test-api-e2e.mjs --url "https://api.speedstein.com"
```

#### 7.3: Monitor Logs

```bash
# View real-time logs
npx wrangler tail

# Or filter by status code
npx wrangler tail --status=error

# View logs in dashboard
# https://dash.cloudflare.com → Workers & Pages → speedstein-worker-production → Logs
```

### Step 8: Enable Monitoring

#### 8.1: Cloudflare Analytics

1. Go to Workers & Pages → speedstein-worker-production
2. Check "Analytics" tab for:
   - Request volume
   - Error rate
   - P50/P75/P99 latency
   - CPU time usage

#### 8.2: Set Up Alerts

1. Go to Cloudflare Dashboard → Notifications
2. Create alert for:
   - Error rate > 5%
   - Latency P99 > 5 seconds
   - Worker CPU time > 50ms

#### 8.3: Third-Party Monitoring (Optional)

```bash
# Add Sentry for error tracking
pnpm add @sentry/cloudflare

# Configure in worker
# See: https://docs.sentry.io/platforms/javascript/guides/cloudflare/
```

### Rollback Procedure

If deployment has issues:

```bash
# 1. List recent deployments
npx wrangler deployments list

# 2. Rollback to previous version
npx wrangler rollback [DEPLOYMENT_ID]

# 3. Verify rollback
curl https://api.speedstein.com/health
```

### Post-Deployment Verification

- ✅ Health endpoint returns 200 OK
- ✅ E2E tests pass against production
- ✅ PDF generation completes in < 2 seconds (P95)
- ✅ R2 PDFs accessible via CDN URL
- ✅ Error rate < 1%
- ✅ Monitoring dashboards show data

### Common Issues

#### Issue: "Worker exceeded CPU time limit"

**Cause**: PDF generation or database queries taking too long

**Solution**:
- Enable Durable Objects for browser pooling
- Optimize database queries (add indexes)
- Use connection pooling for Supabase

#### Issue: "R2 bucket not found"

**Cause**: R2 bucket binding not configured

**Solution**:
```bash
# Verify bucket exists
npx wrangler r2 bucket list

# Check wrangler.toml has correct binding
# [[r2_buckets]]
# binding = "PDF_STORAGE"
# bucket_name = "speedstein-pdfs"
```

#### Issue: "Authentication failed - Invalid API key"

**Cause**: Supabase secrets not set correctly

**Solution**:
```bash
# Verify secrets are set
npx wrangler secret list

# Re-set secrets if needed
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Production Best Practices

1. **Use Staging Environment**
   ```bash
   # Deploy to staging first
   npx wrangler deploy --env staging

   # Test thoroughly
   node scripts/test-api-e2e.mjs --url "https://staging-api.speedstein.com"

   # Then deploy to production
   npx wrangler deploy --env production
   ```

2. **Enable Durable Objects**
   - Improves performance with browser pooling
   - Reduces cold starts
   - Better throughput for high-volume clients

3. **Set Up CI/CD**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy Worker
   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - run: pnpm install
         - run: pnpm run typecheck
         - run: pnpm test
         - run: npx wrangler deploy --env production
           env:
             CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
   ```

4. **Monitor Performance**
   - Set up Cloudflare Analytics
   - Configure error alerts
   - Track P95/P99 latency
   - Monitor R2 storage costs

5. **Regular Maintenance**
   - Review error logs weekly
   - Update dependencies monthly
   - Rotate API keys quarterly
   - Clean up expired R2 objects

---

## Frontend Deployment (Cloudflare Pages)

See [T102 deployment steps](#frontend-deployment-cloudflare-pages) below.
