# Manual Setup Guide: Supabase and Cloudflare Configuration

This guide covers the manual setup tasks (T011, T015-T020, T027) required to configure external services for the Speedstein PDF API platform.

## Prerequisites

Before starting, ensure you have:
- A GitHub account (for Cloudflare Pages integration)
- A credit card (Cloudflare requires it for Workers Paid plan, Supabase may require it for production)
- Access to create accounts on Supabase and Cloudflare

---

## Part 1: Supabase Setup (T011, T015, T016)

### T011: Create Supabase Project

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign in"
   - Sign in with GitHub (recommended) or email

2. **Create New Organization** (if first time)
   - Click "New organization"
   - Enter organization name (e.g., "Speedstein")
   - Choose "Free" tier for development

3. **Create New Project**
   - Click "New project"
   - **Project name**: `speedstein-dev` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users (e.g., `us-east-1` for US East Coast)
   - **Pricing Plan**: Free (for development)
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

4. **Get Environment Variables**

   Once the project is ready:
   - Click on "Settings" (gear icon in sidebar)
   - Navigate to "API" section
   - Copy the following values:

   ```bash
   # Project URL
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

   # Anon/Public Key (safe for client-side use)
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Service Role Key (NEVER expose client-side, server-only)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Update Environment Files**

   Update `apps/worker/.env` (create if doesn't exist):
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Update `apps/web/.env.local` (create if doesn't exist):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### T015: Run Database Migrations

1. **Install Supabase CLI** (if not already installed)

   ```bash
   # Using npm
   npm install -g supabase

   # Or using Homebrew (macOS/Linux)
   brew install supabase/tap/supabase

   # Or using Scoop (Windows)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   Verify installation:
   ```bash
   supabase --version
   ```

2. **Login to Supabase CLI**

   ```bash
   supabase login
   ```

   This will open a browser for authentication. Grant access when prompted.

3. **Link Local Project to Remote Supabase Project**

   ```bash
   cd /c/coding/speedstein
   supabase link --project-ref xxxxxxxxxxxxx
   ```

   Replace `xxxxxxxxxxxxx` with your project reference ID (found in Supabase dashboard URL: `https://supabase.com/dashboard/project/xxxxxxxxxxxxx`)

4. **Run Migrations**

   ```bash
   # Run all migrations
   supabase db push
   ```

   This will execute:
   - `packages/database/migrations/001_initial_schema.sql` - Create tables
   - `packages/database/migrations/002_rls_policies.sql` - Setup RLS policies
   - `packages/database/migrations/003_indexes.sql` - Add performance indexes

5. **Verify Migrations**

   In Supabase Dashboard:
   - Go to "Table Editor"
   - Verify tables exist: `users`, `api_keys`, `subscriptions`, `usage_quotas`, `usage_records`, `invoices`
   - Click "Policies" to verify RLS policies are active

---

### T016: Generate TypeScript Types from Database Schema

1. **Generate Types**

   ```bash
   cd /c/coding/speedstein

   # Generate types from remote database
   supabase gen types typescript --project-id xxxxxxxxxxxxx > packages/database/types.ts
   ```

   Replace `xxxxxxxxxxxxx` with your project reference ID.

2. **Verify Generated Types**

   Open `packages/database/types.ts` and verify it contains interfaces for:
   - `Database` type with `public` schema
   - `Tables` with all table definitions
   - `Enums` if any exist
   - `Functions` if any exist

3. **Update Shared Package**

   The generated types are automatically available to all apps through the shared package.

---

## Part 2: Cloudflare Setup (T018, T019, T020)

### T018: Setup Cloudflare R2 Bucket for PDF Storage

1. **Create Cloudflare Account**
   - Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   - Sign up with email or GitHub
   - Verify email address

2. **Add Payment Method**
   - Click on your profile (top right)
   - Go to "Billing"
   - Add a credit/debit card
   - Note: R2 has 10 GB/month free storage, but requires payment method on file

3. **Create R2 Bucket**
   - In Cloudflare Dashboard, click "R2" in left sidebar
   - If first time, click "Purchase R2" (you won't be charged unless you exceed free tier)
   - Click "Create bucket"
   - **Bucket name**: `speedstein-pdfs-dev` (must be globally unique)
   - **Location**: Automatic (or choose specific region for lower latency)
   - Click "Create bucket"

4. **Create R2 API Token**
   - In R2 overview, click "Manage R2 API Tokens"
   - Click "Create API token"
   - **Token name**: `speedstein-worker-token`
   - **Permissions**:
     - Select "Object Read & Write"
     - Choose "Apply to specific buckets only"
     - Select `speedstein-pdfs-dev`
   - Click "Create API Token"
   - **IMPORTANT**: Copy the following values immediately (they won't be shown again):
     ```
     Access Key ID: xxxxxxxxxxxxxxxxxxxxx
     Secret Access Key: yyyyyyyyyyyyyyyyyyyyyy
     ```

5. **Update wrangler.toml**

   Open `apps/worker/wrangler.toml` and add:
   ```toml
   [[r2_buckets]]
   binding = "PDF_BUCKET"
   bucket_name = "speedstein-pdfs-dev"
   ```

6. **Set R2 Secrets** (for local development)

   Create `apps/worker/.dev.vars` (this file is gitignored):
   ```env
   R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
   R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyy
   ```

---

### T019: Setup Cloudflare KV Namespace for Rate Limiting

1. **Create KV Namespace**

   In Cloudflare Dashboard:
   - Click "Workers & Pages" in left sidebar
   - Click "KV" tab
   - Click "Create namespace"
   - **Namespace name**: `speedstein-rate-limit-dev`
   - Click "Add"

2. **Get Namespace ID**

   After creation, copy the **Namespace ID** (it looks like: `a1b2c3d4e5f6...`)

3. **Update wrangler.toml**

   Open `apps/worker/wrangler.toml` and add:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "a1b2c3d4e5f6..."  # Replace with your actual namespace ID
   ```

4. **Create Preview Namespace** (for testing)

   Repeat steps 1-3 but create `speedstein-rate-limit-preview` and add:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "a1b2c3d4e5f6..."
   preview_id = "x9y8z7w6v5u4..."  # Preview namespace ID
   ```

---

### T020: Configure Cloudflare Browser Rendering API

1. **Enable Browser Rendering API**

   The Browser Rendering API is available on:
   - **Workers Paid plan** ($5/month + usage)
   - Includes 1 million requests/month
   - Additional requests: $0.50 per million

2. **Upgrade to Workers Paid Plan**

   In Cloudflare Dashboard:
   - Go to "Workers & Pages"
   - Click "Plans" tab
   - Click "Upgrade" next to "Workers Paid"
   - Confirm payment method
   - Click "Confirm"

3. **Enable Browser Rendering**

   ```bash
   # Login to Wrangler (Cloudflare CLI)
   npx wrangler login

   # This will open browser for authentication
   ```

4. **Update wrangler.toml**

   Open `apps/worker/wrangler.toml` and add:
   ```toml
   [browser]
   binding = "BROWSER"
   ```

5. **Verify Browser Rendering Access**

   The browser binding will be automatically available in your Worker environment as `env.BROWSER`.

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

After completing all manual tasks, verify:

- [ ] **T011**: Supabase project created, environment variables set
- [ ] **T015**: Database migrations executed successfully
- [ ] **T016**: TypeScript types generated from database schema
- [ ] **T018**: Cloudflare R2 bucket created and configured
- [ ] **T019**: Cloudflare KV namespace created and configured
- [ ] **T020**: Cloudflare Browser Rendering API enabled (Workers Paid plan)
- [ ] **T027**: Sentry projects created and SDKs configured
- [ ] **DodoPayments**: API keys obtained and configured

---

## Environment Variables Summary

After completing all steps, your environment files should contain:

**`apps/worker/.env`:**
```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DodoPayments
DODOPAYMENTS_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=development
```

**`apps/worker/.dev.vars`:** (gitignored)
```env
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyy
```

**`apps/web/.env.local`:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
