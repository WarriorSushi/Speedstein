# Speedstein - Lightning-Fast PDF Generation API

> **"POST HTML → Get Beautiful PDF in <2 Seconds"**

High-performance PDF generation API built with Next.js 15, Cloudflare Workers, and Cap'n Web RPC.

## 🚀 Project Status

**Current Phase:** Production Readiness (003) - Backend MVP Complete ✅

### Completed:
- ✅ Phase 1: Monorepo infrastructure setup
- ✅ Phase 2: Foundational infrastructure (Database, UI, Testing)
- ✅ Phase 3: Production Readiness (Database, R2, Crypto, Pricing)
  - Database schema with 4 tables + RLS policies
  - R2 storage integration with tier-based lifecycle
  - SHA-256 API key hashing (fixed crypto bug)
  - Corrected pricing tiers (Enterprise: 500K quota)
  - TypeScript compilation: ✅ 0 errors

### Ready for Testing:
- 🧪 End-to-end API testing
- 🚀 Worker deployment to production
- 🎨 Frontend development (Phases 6-7)

### 📖 **New Developer? Start Here:**
👉 **[Production Readiness Quickstart Guide](specs/003-production-readiness/quickstart.md)**

Complete guide covering:
- Database setup (Supabase local + cloud)
- R2 storage configuration
- Environment variables
- Local development workflow
- Deployment to production

---

## 📁 Project Structure

```
speedstein/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   └── worker/           # Cloudflare Worker backend
├── packages/
│   ├── shared/           # Shared types and utilities
│   └── database/         # Supabase migrations and types
├── supabase/             # Supabase local config and migrations
└── specs/                # Feature specs and documentation
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18**
- **Tailwind CSS** with OKLCH color system
- **shadcn/ui** components
- **next-themes** for dark mode

### Backend
- **Cloudflare Workers**
- **Cap'n Web** (RPC)
- **Hono** (routing)
- **Cloudflare Browser Rendering** (Puppeteer)
- **Cloudflare R2** (PDF storage)
- **Cloudflare KV** (rate limiting)

### Database
- **Supabase** (PostgreSQL + Auth)
- **Row Level Security** (RLS)
- Auto-generated TypeScript types

### Testing
- **Vitest** (unit tests)
- **Playwright** (E2E tests)
- **80%+ coverage target**

### Payments
- **DodoPayments**

---

## 🏃 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker Desktop (for Supabase local)
- Supabase CLI

### 1. Clone and Install

```bash
git clone <repository-url>
cd speedstein
pnpm install
```

### 2. Start Supabase Locally

```bash
# Start local Supabase (PostgreSQL + Studio)
supabase start

# Open Supabase Studio
# http://127.0.0.1:54323
```

### 3. Set Up Environment Variables

Copy the example files and fill in your values:

```bash
# Root
cp .env.example .env.local

# Web app (Next.js)
cp apps/web/.env.example apps/web/.env.local

# Worker (Cloudflare)
cp apps/worker/.env.example apps/worker/.env.local
```

### 4. Start Development Servers

```bash
# Start all apps in parallel
pnpm dev

# Or start individually
pnpm --filter web dev      # Next.js on :3000
pnpm --filter worker dev   # Cloudflare Worker on :8787
```

---

## 🔧 Development Workflow

### Database Migrations

```bash
# Create new migration
supabase migration new your_migration_name

# Apply migrations locally
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > packages/database/src/database.types.ts

# Push to cloud (when ready)
export SUPABASE_ACCESS_TOKEN="your-token"
supabase db push
```

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests (Next.js)
pnpm --filter web test:e2e

# Watch mode
pnpm test --watch
```

### Code Quality

```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format
```

---

## 🎨 Design System

### OKLCH Color System

All colors use OKLCH for perceptual uniformity and WCAG AAA compliance:

```css
/* Base colors */
--background: 100% 0 0;           /* Pure white */
--foreground: 20% 0 0;            /* Near black */

/* Primary (Blue) */
--primary: 55% 0.25 260;          /* L=55%, C=0.25, H=260° */
--primary-foreground: 100% 0 0;

/* Dark mode - just adjust lightness */
.dark {
  --background: 20% 0 0;          /* Dark gray */
  --foreground: 95% 0 0;          /* Off-white */
  --primary: 65% 0.22 260;        /* Lighter blue */
}
```

### shadcn/ui Components

Components are located in `apps/web/src/components/ui/`:
- Button
- Card
- Input
- Label
- (More components will be added as needed)

---

## 📊 Database Schema

### Tables

1. **users** - User accounts
2. **api_keys** - SHA-256 hashed API keys
3. **subscriptions** - User subscription plans
4. **usage_quotas** - Monthly usage limits
5. **usage_records** - PDF generation history
6. **invoices** - Payment records

### Row Level Security (RLS)

All tables have RLS enabled with optimized policies:
- Users can only access their own data
- Service role bypasses RLS for backend operations
- Auth functions are cached using `(SELECT auth.uid())` pattern

---

## 🔐 Security

### Best Practices Implemented

1. **API Keys**: SHA-256 hashed, never stored in plaintext
2. **RLS Policies**: All database tables protected
3. **Rate Limiting**: Cloudflare KV-based
4. **CORS**: Properly configured for production domains
5. **Environment Variables**: All secrets in `.env.local` (git-ignored)
6. **Function Security**: `SECURITY DEFINER SET search_path = public`

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel deploy

# Production deployment
vercel --prod
```

### Worker (Cloudflare)

```bash
# Deploy to Cloudflare
cd apps/worker
wrangler deploy
```

### Database (Supabase Cloud)

Migrations are automatically synced to cloud project:
- Project: `czvvgfprjlkahobgncxo`
- URL: `https://czvvgfprjlkahobgncxo.supabase.co`

---

## 📚 Documentation

### Specification Files

Located in `specs/001-pdf-api-platform/`:
- **spec.md** - Feature specification with user stories
- **plan.md** - Implementation plan and technical context
- **tasks.md** - Detailed task breakdown (172 tasks)
- **data-model.md** - Complete database schema
- **contracts/** - API endpoint specifications
- **research.md** - Technical research notes
- **quickstart.md** - Developer onboarding guide

### Reference Documents

- **SPEEDSTEIN_TECHNICAL_SPEC.md** - Complete technical specification
- **SPEEDSTEIN_API_REFERENCE.md** - API documentation
- **SPEEDSTEIN_IMPLEMENTATION_PLAN.md** - Build roadmap
- **SPEEDSTEIN_TECHSTACK.md** - Technology choices

---

## 🎯 Performance Targets

- **PDF Generation**: P95 < 2 seconds
- **Landing Page**: LCP < 2 seconds
- **API Uptime**: 99.9%+
- **Lighthouse Score**: 95+
- **Test Coverage**: 80%+

---

## 🏗️ Architecture

```
User → Next.js Frontend (Vercel)
  ↓
  API Request (authenticated)
  ↓
Cloudflare Worker (Global Edge)
  ├─ Cap'n Web RPC Server
  ├─ API Key Auth (Supabase)
  ├─ Rate Limiting (KV)
  └─ Browser Rendering (Puppeteer)
      ↓
      Generate PDF
      ↓
      Upload to R2
      ↓
      Track Usage (Supabase)
      ↓
      Return URL
```

---

## 🤝 Contributing

This is a private project. For team members:

1. Create feature branch from `main`
2. Follow the task list in `specs/001-pdf-api-platform/tasks.md`
3. Write tests for all new features
4. Ensure Lighthouse score stays above 95
5. Run linter and type checker before committing
6. Create PR with description

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Useful Links

### Local Development
- Supabase Studio: http://127.0.0.1:54323
- Next.js App: http://localhost:3000
- Cloudflare Worker: http://localhost:8787

### Cloud Services
- Supabase Dashboard: https://supabase.com/dashboard/project/czvvgfprjlkahobgncxo
- Cloudflare Dashboard: (to be configured)
- Vercel Dashboard: (to be configured)

### Documentation
- Cap'n Web: https://github.com/cloudflare/capnweb
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Next.js 15: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- OKLCH: https://oklch.com

---

**Built with Claude Code** 🤖
