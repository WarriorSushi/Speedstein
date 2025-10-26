# Quickstart Guide: Production Readiness

**Feature**: Production Readiness | **Date**: October 26, 2025
**Purpose**: Developer guide for local development setup and testing

## Prerequisites

- **Node.js**: 18.17 or higher
- **pnpm**: 9.x or higher (package manager)
- **Docker**: For local Supabase instance
- **Cloudflare Account**: For R2 and Workers deployment
- **Supabase Account**: For production database

---

## Part 1: Database Setup (Supabase)

### Step 1: Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verify installation
supabase --version
```

### Step 2: Initialize Local Supabase

```bash
# From repository root
cd C:/coding/speedstein

# Initialize Supabase (creates supabase/ directory if not exists)
supabase init

# Start local Supabase instance (Docker required)
supabase start

# Expected output:
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
# JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Apply Production Readiness Migration

```bash
# Copy migration script from data-model.md
cp specs/003-production-readiness/data-model.md supabase/migrations/20251026_production_readiness.sql
# (Extract SQL from data-model.md "Migration Script" section)

# Apply migration to local database
supabase db reset  # Resets to clean state, applies all migrations

# Verify tables created
supabase db diff  # Should show no diff (migrations applied)
```

### Step 4: Verify RLS Policies

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# List tables
\dt

# Expected output:
#  Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | api_keys        | table | postgres
#  public | subscriptions   | table | postgres
#  public | usage_records   | table | postgres
#  public | users           | table | postgres

# Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# Expected: rowsecurity = true for all 4 tables

# Test RLS policy (should fail - no auth context)
SET ROLE authenticated;
SELECT * FROM users;  # Returns 0 rows (RLS blocks access)

# Exit psql
\q
```

### Step 5: Insert Test Data

```sql
-- Insert test user
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@speedstein.com', 'Test User');

-- Insert free subscription
INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'free',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
);

-- Insert test API key (hashed "test-key-12345")
-- Hash generated via: echo -n "test-key-12345" | openssl dgst -sha256 -hex
INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'a2c8e8e7b8e1f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
  'sk_test_abc',
  'Test Key'
);

-- Verify data inserted
SELECT email, name FROM users;
SELECT plan_id, status FROM subscriptions;
SELECT key_prefix, name FROM api_keys;
```

### Step 6: Deploy to Production Supabase

```bash
# Link to production project
supabase link --project-ref your-project-ref

# You'll be prompted to log in via browser
supabase login

# Deploy migration to production
supabase db push

# WARNING: This will modify production database!
# Confirm: yes

# Verify production deployment
supabase db diff  # Should show no diff
```

---

## Part 2: R2 Storage Integration

### Step 1: Configure R2 Bucket Lifecycle Policies

**Via Cloudflare Dashboard**:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2**
2. Click **speedstein-pdfs** bucket
3. Navigate to **Settings** → **Lifecycle Policies**
4. Add 4 rules:

   **Rule 1: Free Tier**
   - Filter: Tag `tier` equals `free`
   - Action: Delete after **1 day**

   **Rule 2: Starter Tier**
   - Filter: Tag `tier` equals `starter`
   - Action: Delete after **7 days**

   **Rule 3: Pro Tier**
   - Filter: Tag `tier` equals `pro`
   - Action: Delete after **30 days**

   **Rule 4: Enterprise Tier**
   - Filter: Tag `tier` equals `enterprise`
   - Action: Delete after **90 days**

5. Click **Save**

### Step 2: Test R2 Upload

```bash
# From repository root
cd apps/worker

# Create test PDF
echo "Test PDF content" > test.pdf

# Upload with tier tag (via Wrangler)
npx wrangler r2 object put speedstein-pdfs/test-free.pdf \
  --file=test.pdf \
  --custom-metadata='{"tier":"free","userId":"test-user","uploadedAt":"2025-10-26T00:00:00Z"}'

# Verify upload
npx wrangler r2 object get speedstein-pdfs/test-free.pdf --file=-

# Expected: "Test PDF content"

# Check metadata
npx wrangler r2 object get speedstein-pdfs/test-free.pdf | head

# Clean up
npx wrangler r2 object delete speedstein-pdfs/test-free.pdf
```

### Step 3: Verify CDN Access (if configured)

```bash
# If cdn.speedstein.com is configured:
curl https://cdn.speedstein.com/pdfs/test-free.pdf

# Expected: PDF content or 200 OK

# If 404: Check R2 public bucket settings in Cloudflare dashboard
```

---

## Part 3: Worker Development & Testing

### Step 1: Install Dependencies

```bash
cd apps/worker

# Install packages
pnpm install

# Verify TypeScript compiles
pnpm run check  # or: npx tsc --noEmit

# Expected: 0 errors (after crypto fix and R2 integration)
```

### Step 2: Set Environment Variables

```bash
# Copy example env file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with local Supabase credentials
# (from `supabase start` output)
```

**.dev.vars**:
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENABLE_DURABLE_OBJECTS=true
```

### Step 3: Run Worker Locally

```bash
# Start Wrangler dev server (with Miniflare)
pnpm run dev

# Expected output:
# ⎔ Listening on http://localhost:8787
# ⎔ Durable Objects: BrowserPoolDO

# In another terminal, test health endpoint
curl http://localhost:8787/health

# Expected: {"status":"ok","timestamp":"2025-10-26T..."}
```

### Step 4: Test PDF Generation (Local)

```bash
# Test /api/generate endpoint
curl -X POST http://localhost:8787/api/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key-12345" \
  -d '{
    "html": "<html><body><h1>Test PDF</h1><p>Generated locally</p></body></html>",
    "options": {"format": "A4"}
  }'

# Expected response (after R2 integration):
# {
#   "success": true,
#   "pdf_url": "https://cdn.speedstein.com/pdfs/123e4567-....pdf",
#   "size": 12345,
#   "generationTime": 1234,
#   "requestId": "123e4567-e89b-12d3-a456-426614174000",
#   "expiresAt": "2025-10-27T00:00:00Z"
# }

# Note: Before R2 integration, returns pdfBuffer array (old format)
```

### Step 5: Test Quota Check

```bash
# Test /api/quota endpoint
curl http://localhost:8787/api/quota \
  -H "X-API-Key: test-key-12345"

# Expected response:
# {
#   "plan": "free",
#   "quota": 100,
#   "used": 1,  # Incremented by previous PDF generation
#   "remaining": 99,
#   "percentage": 1.0,
#   "resetDate": "2025-11-25T00:00:00Z"
# }
```

---

## Part 4: Frontend Development (Next.js 15)

### Step 1: Initialize Next.js Project

```bash
cd apps/web

# If directory doesn't exist, create it
mkdir -p apps/web
cd apps/web

# Initialize Next.js 15 with App Router
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# Install Cloudflare Pages adapter
pnpm add -D @cloudflare/next-on-pages

# Install Supabase client
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install shadcn/ui
pnpm dlx shadcn@latest init

# Follow prompts:
# - Style: Default
# - Base color: Neutral
# - CSS variables: Yes
```

### Step 2: Configure OKLCH Colors in Tailwind

**tailwind.config.ts**:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(0.55 0.22 250)',
          50: 'oklch(0.95 0.05 250)',
          100: 'oklch(0.90 0.08 250)',
          200: 'oklch(0.80 0.12 250)',
          300: 'oklch(0.70 0.16 250)',
          400: 'oklch(0.60 0.20 250)',
          500: 'oklch(0.55 0.22 250)',
          600: 'oklch(0.48 0.20 250)',
          700: 'oklch(0.40 0.18 250)',
          800: 'oklch(0.32 0.14 250)',
          900: 'oklch(0.25 0.10 250)',
        },
        neutral: {
          50: 'oklch(0.95 0.01 270)',
          100: 'oklch(0.90 0.01 270)',
          200: 'oklch(0.80 0.01 270)',
          300: 'oklch(0.70 0.02 270)',
          400: 'oklch(0.60 0.02 270)',
          500: 'oklch(0.50 0.02 270)',
          600: 'oklch(0.40 0.02 270)',
          700: 'oklch(0.32 0.02 270)',
          800: 'oklch(0.25 0.02 270)',
          900: 'oklch(0.18 0.02 270)',
        },
        // ... add secondary, accent, error from data-model.md
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 3: Set Up Supabase Client

**lib/supabase.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**.env.local**:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Create Theme Toggle Component

```bash
# Install shadcn/ui button component
pnpm dlx shadcn@latest add button
```

**components/ui/theme-toggle.tsx**:
```typescript
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored || system;
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button onClick={toggleTheme} variant="outline" size="icon">
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

### Step 5: Run Development Server

```bash
pnpm run dev

# Expected output:
# ▲ Next.js 15.0.0
# - Local:   http://localhost:3000
# - Network: http://192.168.1.100:3000

# Open browser to http://localhost:3000
```

### Step 6: Verify OKLCH Colors

```bash
# Open browser DevTools → Elements
# Inspect any element with primary color
# Computed styles should show: color: oklch(0.55 0.22 250)

# Toggle dark mode with theme toggle button
# Verify colors adapt
```

---

## Part 5: Testing End-to-End Flow

### Manual Test Checklist

- [ ] **Database**: Tables created with RLS enabled
- [ ] **R2 Lifecycle**: Policies configured (4 tier-based rules)
- [ ] **Worker**: Compiles without TypeScript errors
- [ ] **PDF Generation**: `/api/generate` returns `pdf_url` (not `pdfBuffer`)
- [ ] **Quota Check**: `/api/quota` reads from Supabase
- [ ] **Frontend**: Next.js dev server runs
- [ ] **OKLCH Colors**: Computed styles show `oklch(...)` format
- [ ] **Dark Mode**: Theme toggle works without page reload

### Integration Test Script

**tests/integration/production-readiness.test.ts**:
```typescript
import { describe, it, expect } from 'vitest';

describe('Production Readiness Integration', () => {
  it('database tables exist', async () => {
    // Query Supabase for users table
    const { data, error } = await supabase.from('users').select('*').limit(1);
    expect(error).toBeNull();
  });

  it('PDF generation returns URL (not buffer)', async () => {
    const response = await fetch('http://localhost:8787/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key-12345',
      },
      body: JSON.stringify({
        html: '<html><body>Test</body></html>',
      }),
    });

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.pdf_url).toMatch(/^https:\/\/cdn\.speedstein\.com\//);
    expect(result.pdfBuffer).toBeUndefined(); // Old format removed
  });

  it('quota check reads from database', async () => {
    const response = await fetch('http://localhost:8787/api/quota', {
      headers: { 'X-API-Key': 'test-key-12345' },
    });

    const result = await response.json();
    expect(result.plan).toBe('free');
    expect(result.quota).toBe(100);
    expect(typeof result.used).toBe('number');
  });
});
```

---

## Part 6: Deployment

### Deploy Worker to Production

```bash
cd apps/worker

# Deploy to Cloudflare Workers
pnpm run deploy

# Or manually:
npx wrangler deploy

# Expected output:
# Published speedstein-worker (0.5 sec)
#   https://speedstein-worker.your-subdomain.workers.dev
```

### Deploy Frontend to Cloudflare Pages

```bash
cd apps/web

# Build for production
pnpm run build

# Deploy via Wrangler
npx wrangler pages deploy .vercel/output/static --project-name=speedstein-web

# Or connect GitHub repo via Cloudflare Dashboard:
# 1. Dashboard → Pages → Create application
# 2. Connect GitHub repository
# 3. Build command: pnpm run build
# 4. Output directory: .vercel/output/static
# 5. Add environment variables (NEXT_PUBLIC_SUPABASE_URL, etc.)
```

---

## Troubleshooting

### Issue: TypeScript errors in worker

**Solution**: Run `pnpm run check` to see errors. Common fixes:
- Crypto bug: Change `digestSync` to `digest` (async)
- Missing types: Add `@cloudflare/workers-types` to devDependencies

### Issue: Database tables not found

**Solution**:
```bash
# Verify migration applied
supabase db diff

# Re-apply migration
supabase db reset

# Check tables exist
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt"
```

### Issue: R2 upload fails

**Solution**:
- Verify `wrangler.toml` has R2 binding: `[[r2_buckets]] binding = "PDF_STORAGE", bucket_name = "speedstein-pdfs"`
- Check bucket exists: `npx wrangler r2 bucket list`

### Issue: Frontend OKLCH colors not working

**Solution**:
- Check browser support: Chrome 111+, Safari 15.4+
- Verify Tailwind config uses OKLCH format (not RGB/hex)
- Inspect computed styles in DevTools (should show `oklch(...)`)

---

## Next Steps

1. **Run `/speckit.tasks`** to generate implementation task list
2. **Fix P1 blockers**: Crypto bug, R2 integration, Enterprise quota
3. **Build frontend**: Landing page, dashboard components
4. **Load test**: Validate 100 PDFs/min, <2s P95 latency

**Quickstart complete** ✅ - Ready for implementation!
