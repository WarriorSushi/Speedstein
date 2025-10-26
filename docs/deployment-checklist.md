# Production Deployment Checklist

## Pre-Deployment (Complete Before Deploying)

### Code Quality
- [X] TypeScript compilation passes with 0 errors
- [X] All unit tests pass
- [X] E2E test suite created
- [X] Environment variables documented
- [X] Security review completed (API key hashing, RLS policies)

### Infrastructure Setup
- [ ] Cloudflare Account created with Workers subscription
- [ ] Wrangler CLI authenticated (`npx wrangler whoami`)
- [ ] Production Supabase project created
- [ ] Database migrations applied to production
- [ ] R2 production bucket created (`speedstein-pdfs`)
- [ ] R2 lifecycle policies configured (4 tier-based rules)
- [ ] KV namespace created for rate limiting
- [ ] Browser Rendering API enabled

### Secrets Configuration
- [ ] `SUPABASE_URL` set via `npx wrangler secret put`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set via wrangler
- [ ] `DODO_API_KEY` set (for billing integration)
- [ ] `DODO_WEBHOOK_SECRET` set
- [ ] Verify secrets: `npx wrangler secret list`

### DNS & Domains
- [ ] Custom domain DNS configured (`api.speedstein.com`)
- [ ] CDN domain configured (`cdn.speedstein.com` → R2)
- [ ] SSL certificates provisioned (automatic with Cloudflare)
- [ ] DNS propagation verified

---

## Worker Deployment (T101)

### Step 1: Final Verification

```bash
# Navigate to worker directory
cd apps/worker

# Run all checks
pnpm run typecheck  # Should pass with 0 errors
pnpm test           # All tests should pass
pnpm run lint       # No linting errors

# Verify wrangler.toml is correct
cat wrangler.toml
```

### Step 2: Deploy to Production

```bash
# Deploy worker
pnpm run deploy

# Or explicitly specify production environment
npx wrangler deploy --env production
```

**Expected Output:**
```
Total Upload: 234 KiB / gzip: 45 KiB
Uploaded speedstein-worker-production (2.3 sec)
Published speedstein-worker-production (0.5 sec)
  https://speedstein-worker-production.your-account.workers.dev
Current Deployment ID: 01234567-89ab-cdef-0123-456789abcdef
```

### Step 3: Verify Deployment

```bash
# 1. Test health endpoint
curl https://api.speedstein.com/health

# Expected: {"status":"healthy","timestamp":"..."}

# 2. Generate test API key
SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_key \
node scripts/generate-test-api-key.mjs

# 3. Run E2E tests
export TEST_API_KEY="sk_test_xxx"
node scripts/test-api-e2e.mjs --url "https://api.speedstein.com"

# Expected: All tests pass
```

### Step 4: Monitor Initial Traffic

```bash
# Watch real-time logs
npx wrangler tail

# Check for errors
npx wrangler tail --status=error

# View analytics in dashboard
# https://dash.cloudflare.com → Workers & Pages → speedstein-worker-production
```

### Rollback Plan (If Issues Occur)

```bash
# 1. List recent deployments
npx wrangler deployments list

# 2. Rollback to previous version
npx wrangler rollback [DEPLOYMENT_ID]

# 3. Verify rollback
curl https://api.speedstein.com/health
```

---

## Frontend Deployment (T102)

### Prerequisites
- [ ] Next.js app builds successfully
- [ ] Environment variables configured for production
- [ ] Supabase connection tested

### Option 1: Cloudflare Pages (Recommended)

#### Method A: Connect GitHub Repository

1. **Push code to GitHub**
   ```bash
   git push origin 003-production-readiness
   ```

2. **Create Cloudflare Pages Project**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect to GitHub
   - Select `speedstein` repository
   - Choose branch: `main` or `003-production-readiness`

3. **Configure Build Settings**
   ```
   Framework preset: Next.js
   Build command: cd apps/web && pnpm run build
   Build output directory: apps/web/.next
   Root directory: /
   Node version: 20
   ```

4. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=https://api.speedstein.com
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build to complete (3-5 minutes)
   - Cloudflare will provide URL: `https://speedstein.pages.dev`

6. **Configure Custom Domain**
   - Go to Pages project → Custom domains
   - Add domain: `speedstein.com`
   - Add subdomain: `www.speedstein.com`
   - DNS records created automatically

#### Method B: CLI Deployment

```bash
cd apps/web

# Build the app
pnpm run build

# Deploy with Wrangler
npx wrangler pages deploy .next --project-name=speedstein

# Or use direct upload
npx wrangler pages publish .next --project-name=speedstein
```

### Option 2: Vercel (Alternative)

```bash
cd apps/web

# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel deploy --prod

# Configure environment variables in Vercel dashboard
```

### Step 3: Verify Frontend Deployment

```bash
# 1. Check homepage loads
curl https://speedstein.com

# 2. Test in browser
open https://speedstein.com

# 3. Verify API integration
# Sign up → Create API key → Generate PDF → Verify works
```

### Step 4: Configure Production Settings

1. **Update API URL in Frontend**
   ```typescript
   // apps/web/src/lib/config.ts
   export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.speedstein.com';
   ```

2. **Enable Production Optimizations**
   ```typescript
   // next.config.js
   module.exports = {
     reactStrictMode: true,
     swcMinify: true,
     images: {
       domains: ['cdn.speedstein.com'],
     },
   };
   ```

3. **Configure CORS on Worker**
   - Ensure worker allows requests from `speedstein.com`
   - Update CORS middleware if needed

---

## Post-Deployment Verification

### Worker Health Checks
- [ ] Health endpoint returns 200 OK
- [ ] PDF generation works (< 2s P95 latency)
- [ ] R2 PDFs accessible via CDN URL
- [ ] Authentication works (valid/invalid keys)
- [ ] Rate limiting works (exceeding limits returns 429)
- [ ] Error handling works (invalid HTML returns 400)

### Frontend Health Checks
- [ ] Homepage loads (Lighthouse score > 95)
- [ ] Sign up flow works
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] API key creation works
- [ ] Live PDF demo works
- [ ] Dark mode toggle works
- [ ] Mobile responsive

### Integration Tests
- [ ] End-to-end flow: Sign up → API key → Generate PDF → Download
- [ ] Quota limits enforced correctly
- [ ] Subscriptions sync with billing (DodoPayments)
- [ ] Usage tracking updates in real-time
- [ ] Error messages display correctly

### Performance Metrics
- [ ] Worker P95 latency < 2 seconds
- [ ] Frontend LCP < 2 seconds
- [ ] Lighthouse Performance score > 95
- [ ] Lighthouse Accessibility score = 100 (WCAG AAA)
- [ ] No console errors in browser

### Monitoring Setup
- [ ] Cloudflare Workers Analytics enabled
- [ ] Error rate alerts configured (> 5%)
- [ ] Latency alerts configured (P99 > 5s)
- [ ] R2 storage usage monitoring
- [ ] Supabase connection pool monitoring

---

## Production Maintenance

### Daily Checks
- Review error logs in Cloudflare dashboard
- Check API uptime (should be 99.9%+)
- Monitor R2 storage costs
- Check rate limit hits

### Weekly Reviews
- Review performance metrics (P50/P75/P95/P99)
- Analyze user feedback
- Check for failed payments
- Review security logs

### Monthly Tasks
- Update dependencies (`pnpm update`)
- Review and optimize slow database queries
- Clean up expired R2 objects (automatic with lifecycle)
- Rotate API keys if needed
- Review and update documentation

### Quarterly Reviews
- Major dependency updates (Next.js, Cloudflare Workers SDK)
- Security audit (API keys, RLS policies, CORS)
- Performance optimization review
- Cost analysis (R2 storage, Workers CPU time)

---

## Emergency Procedures

### Worker Down
1. Check Cloudflare Status: https://www.cloudflarestatus.com
2. View logs: `npx wrangler tail --status=error`
3. Rollback if recent deployment: `npx wrangler rollback`
4. Check secrets are set: `npx wrangler secret list`
5. Verify Supabase connection

### High Error Rate
1. Identify error type in logs
2. Check database connection (Supabase status)
3. Verify R2 bucket accessible
4. Check Browser Rendering API status
5. Scale resources if needed

### Performance Degradation
1. Check Worker CPU time usage
2. Enable Durable Objects if not already
3. Review database query performance
4. Check for slow external API calls
5. Analyze traffic patterns (DDoS?)

### Security Incident
1. Rotate compromised API keys immediately
2. Review RLS policies for bypass attempts
3. Check for unusual traffic patterns
4. Enable stricter rate limiting
5. Report to Cloudflare if DDoS attack

---

## Deployment Sign-Off

Before marking deployment as complete, verify:

- [X] T097: TypeScript compilation passes
- [X] T098: Environment variables documented
- [X] T099: README updated with quickstart
- [X] T100: E2E test suite created and documented
- [ ] T101: Worker deployed to production
- [ ] T102: Frontend deployed to Cloudflare Pages

**Deployment Date**: _______________
**Deployed By**: _______________
**Deployment ID**: _______________
**Rollback ID (previous)**: _______________

**Sign-off**: All checks passed, deployment successful ✅
