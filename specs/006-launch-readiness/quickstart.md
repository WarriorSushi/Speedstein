# Quickstart Guide: Launch Readiness Implementation

**Feature**: 006-launch-readiness | **Date**: 2025-10-27
**Purpose**: Get developers set up to implement authentication, payment integration, monitoring, testing, documentation, and design system features.

## Prerequisites

Before starting implementation, ensure you have:

### Required Software
- **Node.js 18.17+** (check: `node --version`)
- **pnpm 8.0+** (check: `pnpm --version`)
- **Git** (check: `git --version`)
- **Docker** (for Supabase local development)
- **PostgreSQL client** (psql) for database migrations

### Accounts & Access
- [x] **Supabase project** configured (URL + service role key in .env.local)
- [x] **Cloudflare account** with Workers access (wrangler authenticated)
- [ ] **DodoPayments account** (to be created - test mode credentials)
- [ ] **Sentry account** (to be created - get DSN for frontend + backend)
- [ ] **Playwright browsers** installed (`npx playwright install`)

### Environment Variables
Create/update `apps/web/.env.local`:
```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sentry (NEW - to be added)
NEXT_PUBLIC_SENTRY_DSN=https://abc123@sentry.io/123456
SENTRY_AUTH_TOKEN=your_auth_token_here

# DodoPayments (NEW - to be added)
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY=pk_test_...
DODO_SECRET_KEY=sk_test_...
DODO_WEBHOOK_SECRET=whsec_...

# Session Secret (NEW - generate with: openssl rand -base64 32)
SESSION_SECRET=your_random_32_byte_secret_here
```

Create/update `apps/worker/.dev.vars`:
```bash
# Supabase (already configured)
SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sentry (NEW - to be added)
SENTRY_DSN=https://abc123@sentry.io/123457  # Different project for backend

# DodoPayments (NEW - same as frontend)
DODO_WEBHOOK_SECRET=whsec_...

# R2 Storage (already configured)
R2_BUCKET_NAME=speedstein-pdfs
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
```

---

## Setup Steps

### 1. Install Dependencies

```bash
# From repository root
pnpm install

# Install Playwright browsers (for E2E tests)
npx playwright install chromium
```

### 2. Database Setup

Run new migrations for Launch Readiness feature:

```bash
# Start Supabase local (if using local development)
supabase start

# Run migrations
supabase db push

# Verify tables created
psql $DATABASE_URL -c "\dt public.*"
# Expected tables: users, api_keys, subscriptions, usage_records, payment_events, error_logs, test_results
```

**Manual Migration (Production)**:
```bash
# Connect to Supabase project
supabase link --project-ref czvvgfprjlkahobgncxo

# Push migrations
supabase db push
```

### 3. Sentry Configuration

**Frontend (Next.js)**:
```bash
cd apps/web

# Install Sentry SDK
pnpm add @sentry/nextjs

# Initialize Sentry (creates sentry.client.config.ts, sentry.server.config.ts)
npx @sentry/wizard@latest -i nextjs

# Update next.config.js with Sentry webpack plugin
# (automatically done by wizard)
```

**Backend (Cloudflare Workers)**:
```bash
cd apps/worker

# Install Sentry SDK
pnpm add @sentry/browser  # NOT @sentry/node (Workers use V8, not Node.js)

# Create monitoring service (see data-model.md for implementation)
# File: apps/worker/src/lib/monitoring.ts
```

### 4. DodoPayments Configuration

**Sign up for DodoPayments**:
1. Visit [dodopayments.com](https://dodopayments.com) (placeholder - replace with actual URL)
2. Create account and get test mode keys
3. Configure webhook endpoint: `https://your-worker.workers.dev/api/webhooks/dodo`
4. Copy webhook secret to `.env.local` and `.dev.vars`

**Test Mode Products**:
Create 4 products in DodoPayments dashboard:
- **Free**: $0/month (100 PDFs)
- **Starter**: $29/month (5,000 PDFs)
- **Pro**: $149/month (50,000 PDFs)
- **Enterprise**: $999/month (500,000 PDFs)

### 5. Development Server

**Start Next.js frontend**:
```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

**Start Cloudflare Workers backend**:
```bash
cd apps/worker
pnpm dev
# Runs on http://localhost:8787
```

**Access points**:
- Landing page: http://localhost:3000
- Signup: http://localhost:3000/signup (NEW - to be implemented)
- Login: http://localhost:3000/login (NEW - to be implemented)
- Dashboard: http://localhost:3000/dashboard (NEW - to be implemented)
- Docs: http://localhost:3000/docs (NEW - to be implemented)
- Worker API: http://localhost:8787/api/generate

---

## Implementation Workflow

### Priority 1 (P1) - BLOCKING Items

#### 1.1 Authentication System (User Story 1)
**Files to create**:
```
apps/web/src/
├── app/(auth)/
│   ├── signup/page.tsx
│   ├── login/page.tsx
│   ├── verify-email/page.tsx
│   └── reset-password/page.tsx
├── components/auth/
│   ├── signup-form.tsx
│   ├── login-form.tsx
│   └── auth-guard.tsx
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── hooks/
│   └── use-auth.ts
└── middleware.ts  # Route protection
```

**Testing**:
```bash
# E2E test
pnpm test:e2e tests/e2e/auth.spec.ts

# Manual test
1. Visit http://localhost:3000/signup
2. Enter email + password
3. Check Supabase dashboard for user creation
4. Click verification link (from Supabase logs)
5. Login at http://localhost:3000/login
6. Verify redirect to /dashboard
```

#### 1.2 API Key Management (User Story 2)
**Files to create**:
```
apps/web/src/
├── app/(dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api-keys/page.tsx
├── components/dashboard/
│   ├── api-key-list.tsx
│   ├── api-key-create.tsx
│   ├── stats-card.tsx
│   └── dashboard-header.tsx
└── hooks/
    └── use-api-keys.ts
```

**Testing**:
```bash
# E2E test
pnpm test:e2e tests/e2e/api-keys.spec.ts

# Manual test
1. Login to dashboard
2. Navigate to "API Keys" tab
3. Click "Generate New Key"
4. Enter name "Test Key"
5. Copy key (shown once)
6. Test key with curl:
   curl -X POST http://localhost:8787/api/generate \
     -H "Authorization: Bearer sk_test_..." \
     -H "Content-Type: application/json" \
     -d '{"html": "<h1>Test</h1>"}'
7. Verify PDF generated
8. Revoke key
9. Test key again (should fail with 401)
```

#### 1.3 Payment Integration (User Story 3)
**Files to create**:
```
apps/web/src/
├── app/
│   ├── checkout/page.tsx
│   └── (dashboard)/billing/page.tsx
├── components/dashboard/
│   ├── pricing-tiers.tsx
│   └── subscription-card.tsx
├── lib/dodo/
│   ├── client.ts
│   └── webhooks.ts
└── hooks/
    └── use-subscription.ts

apps/worker/src/
├── webhooks/
│   └── dodo.ts
└── services/
    └── payment.service.ts

packages/shared/src/
├── types/subscription.ts
└── lib/subscriptions.ts
```

**Testing**:
```bash
# Integration test (webhook handler)
pnpm test:integration tests/integration/webhooks.test.ts

# Manual test
1. Login to dashboard
2. Navigate to "Billing" tab
3. Click "Upgrade to Starter"
4. Fill payment form (use DodoPayments test card: 4242 4242 4242 4242)
5. Complete checkout
6. Verify redirect to dashboard
7. Check subscription status = "active"
8. Check tier = "starter"
9. Verify webhook logged in payment_events table
```

#### 1.4 Monitoring & Observability (User Story 4)
**Files to create**:
```
apps/web/src/lib/sentry.ts
apps/worker/src/lib/monitoring.ts
apps/worker/src/services/monitoring.service.ts
scripts/setup-sentry.mjs
```

**Testing**:
```bash
# Unit test
pnpm test:unit tests/unit/monitoring.test.ts

# Manual test (trigger error)
1. Trigger intentional error:
   curl -X POST http://localhost:8787/api/generate \
     -H "Authorization: Bearer sk_test_..." \
     -d '{"html": "<invalid>"}' # Intentionally malformed
2. Check Sentry dashboard
3. Verify error appears with:
   - User ID
   - API key ID
   - Request context (URL, method)
   - Stack trace
4. Verify error logged to error_logs table
```

### Priority 2 (P2) - HIGH RISK Items

#### 2.1 End-to-End Testing (User Story 5)
**Files to create**:
```
tests/e2e/
├── auth.spec.ts         # 5 tests
├── api-keys.spec.ts     # 4 tests
├── pdf-generation.spec.ts # 6 tests
├── payment.spec.ts      # 5 tests
└── docs.spec.ts         # 3 tests

tests/integration/
├── webhooks.test.ts
├── auth-api.test.ts
└── payment-api.test.ts

tests/unit/
├── quota.test.ts
├── api-key-validation.test.ts
└── subscriptions.test.ts
```

**Running Tests**:
```bash
# All E2E tests
pnpm test:e2e

# Specific suite
pnpm test:e2e tests/e2e/auth.spec.ts

# With UI (for debugging)
pnpm test:e2e --ui

# Generate coverage report
pnpm test:coverage
```

#### 2.2 Documentation Site (User Story 6)
**Files to create**:
```
apps/web/src/
├── app/docs/
│   ├── page.tsx
│   ├── [...slug]/page.tsx
│   └── design-system/page.tsx
├── components/docs/
│   ├── doc-nav.tsx
│   ├── code-block.tsx
│   ├── code-tabs.tsx
│   └── search-bar.tsx
└── content/docs/        # Markdown content
    ├── getting-started.md
    ├── api-reference.md
    ├── authentication.md
    ├── error-codes.md
    └── troubleshooting.md
```

**Testing**:
```bash
# E2E test
pnpm test:e2e tests/e2e/docs.spec.ts

# Manual test
1. Visit http://localhost:3000/docs
2. Verify navigation loads
3. Click "API Reference"
4. Verify endpoint documentation
5. Copy JavaScript code example
6. Run code example (should work)
7. Search for "authentication"
8. Verify search results
```

### Priority 3 (P3) - POLISH Items

#### 3.1 Design System (User Story 7)
**Files to update**:
```
apps/web/
├── tailwind.config.ts   # Complete OKLCH gray scale
└── src/app/globals.css  # Elevation system

packages/shared/src/utils/
└── oklch.ts             # Color utilities

tests/unit/
└── contrast-validation.test.ts
```

**Validation**:
```bash
# Run contrast validation
pnpm test:unit tests/unit/contrast-validation.test.ts

# Manual validation
1. Open Chrome DevTools
2. Inspect any text element
3. Verify computed color uses oklch() format
4. Run Lighthouse audit
5. Verify accessibility score 100
6. Toggle dark mode
7. Verify colors transform correctly
```

#### 3.2 Performance Optimization (User Story 8)
**Files to create**:
```
tests/performance/
├── load-test.k6.js
└── baseline.json

apps/worker/src/lib/
└── performance-tracking.ts
```

**Running Performance Tests**:
```bash
# Install k6
# macOS: brew install k6
# Windows: choco install k6
# Linux: See https://k6.io/docs/getting-started/installation/

# Run load test
k6 run tests/performance/load-test.k6.js \
  --env API_URL=http://localhost:8787/api/generate \
  --env API_KEY=sk_test_...

# View results
# - P50 latency: Should be <1.5s
# - P95 latency: Should be <2.0s
# - P99 latency: Should be <3.0s
# - Error rate: Should be <5%
```

---

## Debugging Tips

### Common Issues

**Issue**: Supabase Auth not working in Next.js 15
- **Solution**: Ensure using @supabase/ssr (not @supabase/auth-helpers-nextjs)
- **Check**: middleware.ts calls `supabase.auth.getSession()` to refresh tokens

**Issue**: Cloudflare Workers not starting
- **Solution**: Check wrangler.toml configuration
- **Check**: `pnpm wrangler whoami` to verify authentication

**Issue**: DodoPayments webhooks not arriving
- **Solution**: Check webhook URL in DodoPayments dashboard
- **Check**: Use ngrok to expose local server: `ngrok http 8787`

**Issue**: Playwright tests failing
- **Solution**: Ensure Playwright browsers installed: `npx playwright install`
- **Check**: `playwright.config.ts` has correct baseURL

**Issue**: Database migrations failing
- **Solution**: Check Supabase project connection: `supabase status`
- **Check**: Manually apply migrations via Supabase dashboard SQL editor

### Useful Commands

```bash
# View Supabase logs
supabase logs

# View Cloudflare Workers logs
pnpm wrangler tail

# View Next.js build output
pnpm build --debug

# Check TypeScript errors
pnpm tsc --noEmit

# Run linter
pnpm lint

# Format code
pnpm format
```

### Development Workflow

1. **Feature branch**: Create branch from `006-launch-readiness`
2. **Implement**: Write code following plan.md structure
3. **Test locally**: Run unit + integration tests
4. **E2E test**: Run Playwright tests
5. **Commit**: Follow constitution commit message format
6. **Push**: Push to feature branch
7. **CI/CD**: GitHub Actions runs all tests
8. **Review**: Create PR for review

---

## Next Steps

After completing local setup:

1. **Read [research.md](research.md)** for technical decisions and best practices
2. **Read [data-model.md](data-model.md)** for database schema and relationships
3. **Read [contracts/README.md](contracts/README.md)** for API endpoint specifications
4. **Run `/speckit.tasks`** to generate implementation tasks from plan.md
5. **Start with P1 tasks** (authentication, API keys, payments, monitoring)
6. **Run tests frequently** to catch regressions early
7. **Update README.md** with new setup instructions as you go

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [DodoPayments API Docs](https://dodopayments.com/docs) (placeholder)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [k6 Performance Testing](https://k6.io/docs/)
- [OKLCH Color Picker](https://oklch.com/)

---

**Questions?** Review the [spec.md](spec.md) for requirements or check the [constitution](.specify/memory/constitution.md) for project principles.

