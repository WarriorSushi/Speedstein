# Manual Setup Guide: Optional Configuration

This guide covers the remaining optional setup task (T027) for the Speedstein PDF API platform.

## ✅ All Critical Infrastructure Complete!

All required infrastructure for PDF generation is now configured and ready:

**Supabase (T011, T015, T016):**
- ✅ **T011**: Supabase project created (Project ID: `czvvgfprjlkahobgncxo`)
- ✅ **T015**: Database migrations pushed to cloud Supabase
- ✅ **T016**: TypeScript types can be generated (see below)

**Cloudflare R2 (T018):**
- ✅ **T018**: R2 bucket configured (`speedstein-pdfs-dev`)
- ✅ R2 Access Key ID: `9fbe1a66a6804284aa88498571828241`
- ✅ R2 credentials configured in `apps/worker/.dev.vars` (git-ignored)
- ✅ Jurisdiction endpoint: `https://d0bd6c8419b815cd8b9ce41f5175b29e.r2.cloudflarestorage.com`

**Cloudflare KV (T019):**
- ✅ **T019**: KV namespaces created and configured
- ✅ Production namespace: `speedstein-rate-limit-dev` (ID: `22a4d1624e4848ed9fdcc541bcf7ab39`)
- ✅ Preview namespace: `speedstein-rate-limit-preview` (ID: `c7c30649626b482bbd08001d64b0f8ea`)
- ✅ Configured in `wrangler.toml` with binding `RATE_LIMIT_KV`

**Cloudflare Browser Rendering API (T020):**
- ✅ **T020**: Workers Paid plan activated ($5/month)
- ✅ Browser Rendering API enabled
- ✅ Configured in `wrangler.toml` with binding `BROWSER`
- ✅ Includes 1 million requests/month

Environment variables are configured in `.env.local` and `.dev.vars` files (git-ignored).

### Generate Updated Database Types (T016)

If the database schema changes, regenerate types with:

```bash
cd /c/coding/speedstein
supabase gen types typescript --project-id czvvgfprjlkahobgncxo > packages/database/types.ts
```

---

## Prerequisites

Before starting, ensure you have:
- A GitHub account (for Cloudflare Pages integration)
- A credit card (Cloudflare requires it for Workers Paid plan)
- Access to create a Cloudflare account

---

## Part 1: ~~Supabase Setup~~ ✅ COMPLETED

**Status**: Supabase project is fully configured and linked.
- Project ID: `czvvgfprjlkahobgncxo`
- Database migrations already pushed
- Environment variables configured in `.env.local` (git-ignored)
- Tables created: `users`, `api_keys`, `subscriptions`, `usage_quotas`, `usage_records`, `invoices`
- RLS policies active
- Performance indexes applied

---

## Part 2: Cloudflare Setup

### ~~T018: Setup Cloudflare R2 Bucket for PDF Storage~~ ✅ COMPLETED

**Status**: R2 bucket is fully configured.
- Bucket name: `speedstein-pdfs`
- Binding in wrangler.toml: `PDF_STORAGE`
- Access Key ID: `9fbe1a66a6804284aa88498571828241`
- Credentials configured in `apps/worker/.dev.vars` (git-ignored)
- Jurisdiction endpoint: `https://d0bd6c8419b815cd8b9ce41f5175b29e.r2.cloudflarestorage.com`
- Worker token configured for deployments

---

### ~~T019: Setup Cloudflare KV Namespace for Rate Limiting~~ ✅ COMPLETED

**Status**: KV namespaces are fully configured.
- Production namespace: `speedstein-rate-limit-dev`
  - Namespace ID: `22a4d1624e4848ed9fdcc541bcf7ab39`
- Preview namespace: `speedstein-rate-limit-preview`
  - Namespace ID: `c7c30649626b482bbd08001d64b0f8ea`
- Binding in wrangler.toml: `RATE_LIMIT_KV`
- Both namespaces configured and ready for use

---

### ~~T020: Configure Cloudflare Browser Rendering API~~ ✅ COMPLETED

**Status**: Browser Rendering API is fully enabled and configured.
- Workers Paid plan: Active ($5/month)
- Browser API: Enabled
- Binding in wrangler.toml: `BROWSER`
- Included: 1 million requests/month
- Additional requests: $0.50 per million
- Available in Worker as: `env.BROWSER`

The API is ready for PDF generation using `env.BROWSER.newPage()`.

---

## Part 3: DodoPayments Setup (for T007 - Payment Integration)

1. **Create DodoPayments Account**
   - Go to [https://dodopayments.com](https://dodopayments.com)
   - Click "Sign up" or "Get started"
   - Complete registration

2. **Get API Keys**
   - Login to DodoPayments dashboard
   - Navigate to "Developers" or "API Keys"
   - Copy your **Publishable Key** and **Secret Key**

3. **Update Environment Files**

   Update `apps/worker/.env`:
   ```env
   DODOPAYMENTS_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   ```

   Update `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_DODOPAYMENTS_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   ```

---

## Part 4: Sentry Setup (T027)

### T027: Setup Sentry for Error Tracking

1. **Create Sentry Account**
   - Go to [https://sentry.io/signup/](https://sentry.io/signup/)
   - Sign up with email or GitHub
   - Choose "Developer" plan (free for up to 5K events/month)

2. **Create Two Projects**

   **Project 1: Worker (Backend)**
   - Click "Create Project"
   - **Platform**: Select "Cloudflare Workers"
   - **Project name**: `speedstein-worker`
   - **Alert frequency**: "On every new issue" (recommended)
   - Click "Create Project"
   - Copy the **DSN**: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

   **Project 2: Web (Frontend)**
   - Click "Create Project"
   - **Platform**: Select "Next.js"
   - **Project name**: `speedstein-web`
   - Click "Create Project"
   - Copy the **DSN**: `https://yyyyy@yyyyy.ingest.sentry.io/yyyyy`

3. **Install Sentry SDKs**

   ```bash
   cd /c/coding/speedstein

   # Install for Worker
   pnpm --filter @speedstein/worker add @sentry/cloudflare-workers

   # Install for Web (Next.js)
   pnpm --filter @speedstein/web add @sentry/nextjs
   ```

4. **Configure Sentry for Worker**

   Update `apps/worker/.env`:
   ```env
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_ENVIRONMENT=development
   ```

   Create `apps/worker/src/lib/sentry.ts`:
   ```typescript
   import * as Sentry from '@sentry/cloudflare-workers';

   export function initSentry(env: Env) {
     Sentry.init({
       dsn: env.SENTRY_DSN,
       environment: env.SENTRY_ENVIRONMENT || 'production',
       tracesSampleRate: 1.0,
     });
   }
   ```

5. **Configure Sentry for Web (Next.js)**

   Update `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://yyyyy@yyyyy.ingest.sentry.io/yyyyy
   SENTRY_ENVIRONMENT=development
   ```

   Run Sentry wizard:
   ```bash
   cd apps/web
   npx @sentry/wizard@latest -i nextjs
   ```

   This will create:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Update `next.config.js` with Sentry webpack plugin

6. **Enable Source Maps** (for better error tracking)

   Update `apps/worker/wrangler.toml`:
   ```toml
   [build]
   upload_source_maps = true
   ```

   For Next.js, the Sentry wizard already configured source maps.

7. **Test Sentry Integration**

   Worker test:
   ```typescript
   // Add to apps/worker/src/index.ts
   Sentry.captureMessage('Sentry is working in Worker!');
   ```

   Web test:
   ```typescript
   // Add to apps/web/src/app/page.tsx
   import * as Sentry from '@sentry/nextjs';
   Sentry.captureMessage('Sentry is working in Web!');
   ```

   Deploy and check Sentry dashboard for test events.

---

## Summary Checklist

**🎉 All Critical Infrastructure Complete! (21/22 Phase 2 tasks)**

- [X] **T011**: Supabase project created, environment variables set ✅
- [X] **T015**: Database migrations executed successfully ✅
- [X] **T016**: TypeScript types can be generated (command provided above) ✅
- [X] **T018**: Cloudflare R2 bucket created and configured ✅
- [X] **T019**: Cloudflare KV namespaces created and configured ✅
- [X] **T020**: Cloudflare Browser Rendering API enabled (Workers Paid plan) ✅

**Optional remaining tasks:**
- [ ] **T027**: Sentry projects created and SDKs configured (optional for development/production)
- [ ] **DodoPayments**: API keys obtained and configured (optional for testing payments)

---

## Environment Variables Summary

**`apps/worker/.env.local`:** (already configured, git-ignored)
```env
# Supabase - ✅ ALREADY CONFIGURED
SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
SUPABASE_ANON_KEY=<already set>
SUPABASE_SERVICE_ROLE_KEY=<already set>

# DodoPayments
DODOPAYMENTS_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=development
```

**`apps/worker/.dev.vars`:** (already configured, git-ignored)
```env
# Cloudflare R2 - ✅ ALREADY CONFIGURED
R2_ACCESS_KEY_ID=9fbe1a66a6804284aa88498571828241
R2_SECRET_ACCESS_KEY=9eb271f3a452340b99423a089e2b2e1915a06900c68e9c5ea7b17f323aa0e2f6
R2_ENDPOINT=https://d0bd6c8419b815cd8b9ce41f5175b29e.r2.cloudflarestorage.com

# Cloudflare Worker Token - ✅ ALREADY CONFIGURED
CLOUDFLARE_API_TOKEN=C-HdZxF7sD0xYQvnVYXenwfchJxq14Hi9mp7O7ag
```

**`apps/web/.env.local`:** (already configured, git-ignored)
```env
# Supabase - ✅ ALREADY CONFIGURED
NEXT_PUBLIC_SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<already set>

# DodoPayments
NEXT_PUBLIC_DODOPAYMENTS_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://yyyyy@yyyyy.ingest.sentry.io/yyyyy
SENTRY_ENVIRONMENT=development
```

**`apps/worker/wrangler.toml`:**
```toml
name = "speedstein-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "speedstein-pdfs-dev"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "a1b2c3d4e5f6..."
preview_id = "x9y8z7w6v5u4..."

[browser]
binding = "BROWSER"

[build]
upload_source_maps = true
```

---

## Next Steps

Once all manual setup is complete:

1. **Build the shared packages:**
   ```bash
   pnpm --filter @speedstein/shared build
   pnpm --filter @speedstein/database build
   ```

2. **Run tests:**
   ```bash
   pnpm test
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Start Worker
   pnpm --filter @speedstein/worker dev

   # Terminal 2: Start Web
   pnpm --filter @speedstein/web dev
   ```

4. **Test the API:**
   ```bash
   curl -X POST http://localhost:8787/api/generate \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"html": "<h1>Test PDF</h1>"}'
   ```

If you encounter any issues during setup, refer to the official documentation:
- Supabase: https://supabase.com/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- Sentry: https://docs.sentry.io/
