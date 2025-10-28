# Quickstart Guide: Constitution Compliance Feature

**Feature**: Constitution Compliance - Production Readiness
**Branch**: `005-constitution-compliance`
**Date**: 2025-10-27

## Prerequisites

Ensure you have the following installed and configured:

- **Node.js**: 20.x or later (`node --version`)
- **pnpm**: 8.x or later (`pnpm --version`)
- **Supabase CLI**: Latest version (`supabase --version`)
- **Wrangler CLI**: Latest version (`npx wrangler --version`)
- **Docker**: Required for Supabase local development
- **DodoPayments Account**: Test mode API keys from [dodopayments.com](https://dodopayments.com)
- **Sentry Account**: DSN from [sentry.io](https://sentry.io)

## Step 1: Environment Setup

### 1.1 Clone and Install Dependencies

```bash
# Navigate to project root
cd /path/to/speedstein

# Install all dependencies
pnpm install
```

### 1.2 Configure Environment Variables

Create `.env.local` in the project root with the following:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>

# DodoPayments Configuration (Test Mode)
DODO_PAYMENTS_SECRET_KEY=sk_test_<your-test-secret-key>
NEXT_PUBLIC_DODO_PAYMENTS_PUBLISHABLE_KEY=pk_test_<your-test-publishable-key>

# Sentry Configuration
SENTRY_DSN=https://<your-project>@<your-organization>.ingest.sentry.io/<project-id>
NEXT_PUBLIC_SENTRY_DSN=https://<your-project>@<your-organization>.ingest.sentry.io/<project-id>

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
R2_BUCKET_NAME=speedstein-pdfs
```

### 1.3 Configure Wrangler

Update `apps/worker/wrangler.toml` with your Cloudflare account details:

```toml
[env.development]
vars = { ENABLE_DURABLE_OBJECTS = "true", ROLLOUT_PERCENTAGE = "100" }

[[env.development.r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "speedstein-pdfs-dev"

[env.development.vars]
DODO_PAYMENTS_SECRET_KEY = "<test-secret-key>"
SENTRY_DSN = "<your-sentry-dsn>"
```

## Step 2: Database Setup

### 2.1 Start Supabase Local Instance

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase instance
supabase start
```

**Output**: Note the API URL and anon key for `.env.local`

### 2.2 Run Database Migrations

```bash
# Apply all migrations (including new subscription/payment tables)
supabase db reset

# Verify migrations
supabase db pull
```

### 2.3 Seed Test Data (Optional)

```bash
# Run seed script to create test users and subscriptions
pnpm run db:seed
```

## Step 3: Frontend Development Server

### 3.1 Start Next.js 15 App

```bash
# Navigate to web app
cd apps/web

# Start development server
pnpm dev
```

**Access**: Open [http://localhost:3000](http://localhost:3000) in your browser

### 3.2 Verify Landing Page

- Landing page should load in <2 seconds (check Lighthouse)
- Monaco editor demo should be visible
- Dark mode toggle should work
- All colors should be OKLCH (inspect DevTools → Computed styles)

## Step 4: Backend Development Server

### 4.1 Start Cloudflare Worker

```bash
# Navigate to worker
cd apps/worker

# Start local Wrangler dev server
npx wrangler dev
```

**Access**: Worker runs at [http://localhost:8787](http://localhost:8787)

### 4.2 Test API Endpoints

```bash
# Test PDF generation (should return R2 URL)
curl -X POST http://localhost:8787/api/generate \
  -H "Authorization: Bearer <test-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>", "options": {}}'

# Expected response:
{
  "success": true,
  "data": {
    "url": "https://r2.speedstein.com/pdfs/test.pdf",
    "size": 1234,
    "expiresAt": "2025-10-28T00:00:00Z"
  }
}
```

## Step 5: Run Tests

### 5.1 Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage
```

**Target**: 80%+ code coverage for business logic

### 5.2 Integration Tests

```bash
# Run API endpoint integration tests
pnpm test:integration

# Test specific endpoint
pnpm test:integration webhooks.test.ts
```

### 5.3 E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Test specific flow
pnpm test:e2e signup.spec.ts
```

## Step 6: Build for Production

### 6.1 Build Frontend

```bash
# Navigate to web app
cd apps/web

# Build production bundle
pnpm build

# Verify build output
ls .next
```

**Check**: Lighthouse score should be 95+ for production build

### 6.2 Build Backend

```bash
# Navigate to worker
cd apps/worker

# Build and deploy to Cloudflare (preview)
npx wrangler deploy --dry-run

# Deploy to production (after verification)
npx wrangler deploy
```

## Step 7: Performance Validation

### 7.1 Run Load Tests

```bash
# Install K6 (if not already installed)
# macOS: brew install k6
# Linux: See https://k6.io/docs/getting-started/installation/

# Run load test script
k6 run scripts/load-test.mjs
```

**Expected Output**:
- P95 latency <2s
- 0% error rate
- 100+ requests/minute sustained

### 7.2 Measure Code Coverage

```bash
# Generate coverage report
pnpm run coverage

# Open HTML report
open coverage/index.html
```

**Target**: 80%+ coverage for services, models, and business logic

### 7.3 Lighthouse CI

```bash
# Run Lighthouse CI for all pages
pnpm run lighthouse

# Expected: All pages score 95+ (performance, accessibility, best practices, SEO)
```

## Step 8: Deploy

### 8.1 Deploy Backend (Cloudflare Workers)

```bash
cd apps/worker

# Deploy to production
npx wrangler deploy

# Verify deployment
curl https://api.speedstein.com/health
```

### 8.2 Deploy Frontend (Vercel/Cloudflare Pages)

```bash
cd apps/web

# Build production bundle
pnpm build

# Deploy to Vercel
vercel deploy --prod

# Or deploy to Cloudflare Pages
npx wrangler pages deploy .next
```

### 8.3 Verify Production

1. Visit [https://speedstein.com](https://speedstein.com)
2. Test landing page load time (<2s LCP)
3. Try Monaco editor demo without authentication
4. Sign up for a new account
5. Generate a PDF via API
6. Upgrade subscription tier
7. Check Sentry for errors

## Troubleshooting

### Issue: Monaco Editor Not Loading

**Solution**: Ensure dynamic import is configured correctly
```typescript
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
```

### Issue: OKLCH Colors Not Working

**Solution**: Verify browser support (Chrome 111+, Firefox 113+, Safari 16.4+)
```css
@supports (color: oklch(50% 0.2 180)) {
  /* OKLCH supported */
}
```

### Issue: Webhook Signature Verification Failing

**Solution**: Check that `DODO_PAYMENTS_SECRET_KEY` matches your DodoPayments account
```bash
# Verify environment variable
echo $DODO_PAYMENTS_SECRET_KEY
```

### Issue: Supabase Connection Errors

**Solution**: Restart Supabase local instance
```bash
supabase stop
supabase start
```

## Next Steps

1. Complete `/speckit.tasks` to generate implementation task list
2. Begin implementation with P1 user stories (landing page, auth, payments)
3. Set up CI/CD pipeline with GitHub Actions
4. Configure production monitoring (Sentry, Lighthouse CI, uptime monitoring)
5. Update `SPEEDSTEIN_API_REFERENCE.md` with multi-language examples

## Resources

- [Speedstein Technical Spec](../../../SPEEDSTEIN_TECHNICAL_SPEC.md)
- [Constitution](../../.specify/memory/constitution.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [Research Decisions](./research.md)
