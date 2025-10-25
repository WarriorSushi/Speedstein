# Implementation Plan: Speedstein PDF API Platform

**Branch**: `001-pdf-api-platform` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pdf-api-platform/spec.md`

## Summary

Speedstein is a high-performance PDF generation API platform leveraging Cap'n Web promise pipelining, Cloudflare Workers edge compute, and real Chrome rendering to deliver PDFs in under 2 seconds (P95). The platform includes a Next.js 15 landing page with live Monaco editor demo, user authentication with API key management, usage tracking dashboard, DodoPayments subscription billing, and advanced WebSocket API for high-volume batch operations. Core value proposition: "POST HTML → Get Beautiful PDF in <2 Seconds" at half the cost of competitors.

**Technical Approach**: Use Cloudflare Browser Rendering API with warm Chrome instance pools, Cap'n Web RPC for session reuse and promise pipelining, Supabase for auth/database with RLS policies, OKLCH-based design system with shadcn/ui components, and DodoPayments for subscription management across 4 pricing tiers (Free: 100 PDFs/mo, Starter: 5K @ $29/mo, Pro: 50K @ $99/mo, Enterprise: Custom).

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), React 18, Cloudflare Workers, Cap'n Web, Supabase Client, Tailwind CSS, shadcn/ui, Zod, DodoPayments SDK
**Storage**: Supabase PostgreSQL (users, api_keys, subscriptions, usage_records, invoices), Cloudflare R2 (PDF files), Cloudflare KV (rate limiting cache)
**Testing**: Vitest (unit), Playwright (E2E), Supabase local dev (integration)
**Target Platform**: Cloudflare Workers (backend), Vercel Edge (frontend), browsers (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: Web application (monorepo: frontend + backend)
**Performance Goals**: P95 latency <2s for PDF generation, LCP <2s for landing page, 100+ PDFs/min throughput via WebSocket, 99.9% uptime
**Constraints**: OKLCH-only colors, SHA-256 hashed API keys, RLS on all tables, TypeScript strict mode, no console.log in production
**Scale/Scope**: Target 10K users, 1M+ API calls/month, 50+ UI screens/components, multi-language code examples (JS/Python/PHP/Ruby)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [x] Feature design supports P95 latency <2s for PDF generation (achieved via Cap'n Web session reuse + warm Chrome instances + edge compute)
- [x] Browser session reuse strategy documented (Cloudflare Browser Rendering API with persistent worker instances)
- [x] Chrome instance warming approach defined (maintain pool of warm browser contexts, lazy close on timeout)
- [x] Promise pipelining identified for batch operations (Cap'n Web RpcTarget.generateBatch method with Promise.all)
- [x] No blocking operations in critical path (all I/O is async, PDF generation uses await, no sync file ops)

### Security & Authentication (Principle II)
- [x] API keys will be SHA-256 hashed before storage (hash on creation, store hash + prefix, never store plaintext)
- [x] No plaintext secrets in code or configuration (all secrets in environment variables, Wrangler secrets for Workers)
- [x] RLS policies defined for all Supabase tables (users can only access own api_keys, subscriptions, usage_records)
- [x] Rate limiting strategy documented for endpoints (Cloudflare KV with sliding window, enforce quota per plan tier)
- [x] CORS configuration specified (allow specific origins, credentials: true, preflight caching)
- [x] Environment variables identified for all secrets (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, DODO_API_KEY, R2_BUCKET, etc.)

### Design System Standards (Principle III)
- [x] All colors use OKLCH color space (no RGB/HSL/hex) (Tailwind config with oklch() functions, CSS custom properties)
- [x] WCAG AAA contrast compliance verified (7:1 normal, 4.5:1 large) (oklch lightness values chosen for AAA compliance, audit via axe-core)
- [x] Elevation system uses OKLCH lightness manipulation (base surface L=0.98, raised L=0.99, overlay L=1.00)
- [x] Only shadcn/ui components used (no other UI libraries) (Button, Card, Input, Label, Select, Dialog, Toast from shadcn/ui CLI)

### Technology Stack (Principle IV)
- [x] Frontend uses Next.js 15 with App Router (create-next-app@latest with --app flag)
- [x] Backend uses Cloudflare Workers (Wrangler CLI, workers runtime)
- [x] RPC uses Cap'n Web for PDF generation (PdfGeneratorApi extends RpcTarget, newWorkersRpcResponse handler)
- [x] Database uses Supabase with RLS (PostgreSQL with row-level security policies, Supabase client)
- [x] Payments use DodoPayments (DodoPayments SDK, webhook handler for subscription events)
- [x] Styling uses Tailwind CSS with OKLCH tokens (tailwind.config.ts with custom oklch colors)

### Code Quality (Principle V)
- [x] TypeScript strict mode enabled (tsconfig.json: strict: true, noUncheckedIndexedAccess: true)
- [x] Error handling strategy documented (try-catch for async ops, Zod parse with error messages, custom ApiError class)
- [x] No console.log in production code paths (use structured logging library, Winston or Pino with JSON output)
- [x] Zod schemas defined for API validation (GeneratePdfSchema, CreateApiKeySchema, webhook payload schemas)
- [x] Browser instance disposal strategy documented (page.close() in finally blocks, worker cleanup on idle timeout)

### Cap'n Web Best Practices (Principle VI)
- [x] Server classes extend RpcTarget (PdfGeneratorApi extends RpcTarget with generatePdf, generateBatch, ping methods)
- [x] Promise pipelining strategy documented (generateBatch accepts array of jobs, returns Promise.all for concurrent processing)
- [x] Resource disposal using 'using' keyword or Symbol.dispose() (page disposal in finally, browser context cleanup)
- [x] WebSocket heartbeat mechanism planned (30s interval ping/pong, disconnect on timeout)
- [x] No event loop blocking operations (all PDF generation is async, no CPU-intensive work in main thread)

### User Experience (Principle VII)
- [x] Landing page load time target <2s (LCP) (optimize Monaco bundle with dynamic import, image optimization, server components)
- [x] Live demo works without authentication (public /api/generate-demo endpoint with stricter rate limits)
- [x] Dark mode support included (next-themes provider, OKLCH dark theme with inverted lightness)
- [x] Mobile-responsive design (breakpoints: 640/768/1024/1280px) (Tailwind responsive classes, mobile-first approach)
- [x] Lighthouse score target 95+ documented (CI integration with Lighthouse CI, blocking on score <95)

### Testing & Quality (Principle VIII)
- [x] Unit tests planned for business logic (Vitest for API key hashing, quota validation, rate limiting logic)
- [x] Integration tests planned for API endpoints (Supabase local dev, test database with RLS policies)
- [x] E2E tests planned for user flows (Playwright for signup → create API key → generate PDF → view usage)
- [x] 80%+ code coverage target for services/models (Vitest coverage reports, enforce threshold in CI)
- [x] Link validation strategy documented (check-links CLI tool in CI, no 404s allowed)

### Documentation (Principle IX)
- [x] API endpoints will be documented in SPEEDSTEIN_API_REFERENCE.md (maintain markdown reference, update on endpoint changes)
- [x] Code examples planned for JS, Python, PHP, Ruby (quickstart guide with copy-paste examples per language)
- [x] README updates identified (add setup instructions, prerequisites, development guide)
- [x] Complex logic will have inline comments (Cap'n Web integration, RLS policies, rate limiting algorithm)
- [x] Public functions will have JSDoc/TSDoc (all exported functions, API routes, RPC methods)

### Deployment & Operations (Principle X)
- [x] Zero-downtime deployment strategy documented (Wrangler gradual rollouts, Vercel automatic deployments with preview URLs)
- [x] Sentry error tracking configured (Sentry SDK in Workers and Next.js, source maps for stack traces)
- [x] 99.9% uptime monitoring planned (UptimeRobot or BetterStack, alert on >1min downtime)
- [x] Structured logging for critical operations (JSON logs for PDF generation, auth failures, quota exceeded, webhook events)
- [x] Environment variables for configuration (Wrangler secrets, Vercel env vars, no hardcoded config)

## Project Structure

### Documentation (this feature)

```text
specs/001-pdf-api-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (Cap'n Web study, Supabase setup)
├── data-model.md        # Phase 1 output (database schema, RLS policies)
├── quickstart.md        # Phase 1 output (developer onboarding guide)
├── contracts/           # Phase 1 output (API endpoint contracts)
│   ├── generate-pdf.md
│   ├── api-keys.md
│   ├── usage.md
│   └── subscriptions.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
speedstein/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (marketing)/     # Landing page group
│   │   │   │   │   ├── page.tsx     # Home page with live demo
│   │   │   │   │   ├── pricing/     # Pricing page
│   │   │   │   │   └── docs/        # Documentation
│   │   │   │   ├── (dashboard)/     # Protected dashboard group
│   │   │   │   │   ├── dashboard/   # Main dashboard
│   │   │   │   │   ├── api-keys/    # API key management
│   │   │   │   │   └── settings/    # User settings
│   │   │   │   ├── (auth)/          # Auth pages group
│   │   │   │   │   ├── login/
│   │   │   │   │   └── signup/
│   │   │   │   └── api/             # Next.js API routes (proxies to Workers)
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui components
│   │   │   │   ├── landing/         # Landing page components
│   │   │   │   ├── dashboard/       # Dashboard components
│   │   │   │   └── shared/          # Shared components
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts      # Supabase client
│   │   │   │   ├── api-client.ts    # API client for Workers
│   │   │   │   └── utils.ts         # Utilities
│   │   │   └── styles/
│   │   │       └── globals.css      # Global styles with OKLCH tokens
│   │   ├── public/
│   │   ├── tailwind.config.ts       # Tailwind with OKLCH colors
│   │   ├── tsconfig.json            # TypeScript config (strict mode)
│   │   └── package.json
│   │
│   └── worker/                       # Cloudflare Worker backend
│       ├── src/
│       │   ├── index.ts              # Main worker entry point
│       │   ├── rpc/
│       │   │   └── pdf-generator.ts  # PdfGeneratorApi (RpcTarget)
│       │   ├── middleware/
│       │   │   ├── auth.ts           # API key authentication
│       │   │   ├── rate-limit.ts     # Rate limiting with KV
│       │   │   └── cors.ts           # CORS configuration
│       │   ├── services/
│       │   │   ├── pdf.service.ts    # PDF generation logic
│       │   │   ├── auth.service.ts   # Auth validation
│       │   │   ├── usage.service.ts  # Usage tracking
│       │   │   └── billing.service.ts # Subscription management
│       │   ├── lib/
│       │   │   ├── supabase.ts       # Supabase service client
│       │   │   ├── r2.ts             # R2 storage client
│       │   │   └── validation.ts     # Zod schemas
│       │   └── types/
│       │       └── index.ts          # Shared types
│       ├── wrangler.toml             # Worker configuration
│       ├── tsconfig.json             # TypeScript config
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── api.ts            # API request/response types
│   │   │   │   ├── database.ts       # Database entity types
│   │   │   │   └── pdf.ts            # PDF option types
│   │   │   └── utils/
│   │   │       └── crypto.ts         # Shared crypto utils
│   │   └── package.json
│   │
│   └── database/                     # Supabase migrations and types
│       ├── migrations/
│       │   ├── 001_initial_schema.sql
│       │   ├── 002_rls_policies.sql
│       │   └── 003_indexes.sql
│       ├── seed.sql                  # Seed data for development
│       └── types.ts                  # Generated database types
│
├── tests/
│   ├── unit/                         # Vitest unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                  # Integration tests
│   │   ├── api/
│   │   └── database/
│   └── e2e/                          # Playwright E2E tests
│       ├── signup.spec.ts
│       ├── api-keys.spec.ts
│       └── pdf-generation.spec.ts
│
├── docs/                             # Additional documentation
│   ├── api-reference.md              # Maintained SPEEDSTEIN_API_REFERENCE.md
│   ├── architecture.md               # Architecture decisions
│   └── deployment.md                 # Deployment guide
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, type-check
│       ├── deploy-web.yml            # Deploy to Vercel
│       └── deploy-worker.yml         # Deploy to Cloudflare
│
├── package.json                      # Root package.json (workspace)
├── turbo.json                        # Turborepo config (optional)
├── pnpm-workspace.yaml               # pnpm workspace config
└── README.md                         # Project README
```

**Structure Decision**: Selected web application structure (Option 2) because Speedstein has distinct frontend (Next.js landing + dashboard) and backend (Cloudflare Workers API) concerns. Using a monorepo with `apps/web` and `apps/worker` plus shared `packages/` enables code reuse (types, utilities) while maintaining separation of concerns. This structure supports independent deployment (Vercel for frontend, Wrangler for backend) and aligns with the tech stack constraints (Next.js 15 + Cloudflare Workers).

## Complexity Tracking

**No constitutional violations requiring justification.**

All complexity is warranted by technical requirements:
- Cap'n Web RPC adds complexity but is MANDATORY per Principle VI for performance (promise pipelining, session reuse)
- OKLCH color system requires custom Tailwind config but is NON-NEGOTIABLE per Principle III for accessibility
- Monorepo structure adds build complexity but is standard for web apps with frontend/backend separation
- RLS policies add database complexity but are MANDATORY per Principle II for security

## Research Phase (Phase 0)

### Objectives
- Study Cap'n Web architecture and example implementations
- Set up Supabase project with database schema and RLS policies
- Configure Cloudflare account with Workers, R2, KV, Browser Rendering API
- Validate OKLCH color space browser support and establish color palette
- Set up development environment with all required tools and access

### Key Questions to Answer
1. **Cap'n Web**: How does promise pipelining work with dependent calls? How to properly dispose RpcTarget resources? What's the difference between HTTP Batch and WebSocket modes?
2. **Cloudflare Browser Rendering**: What's the API for Puppeteer in Workers? How to maintain warm browser instances? What are the memory/CPU limits?
3. **Supabase RLS**: How to write policies that allow users to only access their own data? How to handle service role for admin operations?
4. **OKLCH**: What's the browser support percentage? How to define fallbacks for older browsers? How to convert existing hex colors to OKLCH?
5. **DodoPayments**: What webhook events are available? How to handle subscription lifecycle (upgrade, downgrade, cancel)?

### Deliverable
[research.md](./research.md) containing:
- Cap'n Web code examples and architecture notes
- Cloudflare Browser Rendering API usage guide
- Supabase schema design and RLS policy examples
- OKLCH color palette with contrast ratios
- DodoPayments webhook event reference

## Design Phase (Phase 1)

### Objectives
- Design complete database schema with all entities and relationships
- Define RLS policies for multi-tenant data isolation
- Specify all API endpoints with request/response contracts
- Create quickstart guide for developers integrating Speedstein
- Establish OKLCH color system with theme definitions

### Key Deliverables

#### 1. Data Model ([data-model.md](./data-model.md))
Entities:
- **users**: id, email, password_hash, name, created_at, updated_at
- **api_keys**: id, user_id, key_hash, prefix, name, revoked, created_at, last_used_at
- **subscriptions**: id, user_id, plan_tier, status, dodo_customer_id, dodo_subscription_id, current_period_start, current_period_end
- **usage_records**: id, user_id, api_key_id, pdf_url, generation_time_ms, created_at
- **usage_quotas**: id, user_id, plan_quota, current_usage, period_start, period_end
- **invoices**: id, user_id, amount, billing_period, payment_status, dodo_transaction_id, invoice_pdf_url

RLS Policies:
- users: SELECT own row only
- api_keys: SELECT/INSERT/UPDATE/DELETE only own keys
- subscriptions: SELECT own subscription only
- usage_records: SELECT own records only, INSERT via service role
- usage_quotas: SELECT own quota only, UPDATE via service role
- invoices: SELECT own invoices only

#### 2. API Contracts ([contracts/](./contracts/))

**[contracts/generate-pdf.md](./contracts/generate-pdf.md)**
```
POST /api/generate
Authorization: Bearer <api_key>
Body: { html: string, options?: PdfOptions }
Response: { success: true, url: string, generationTime: number }
Errors: 400 (invalid HTML), 401 (invalid key), 413 (payload too large), 429 (quota exceeded)
```

**[contracts/api-keys.md](./contracts/api-keys.md)**
```
POST /api/keys
Authorization: Bearer <supabase_jwt>
Body: { name: string }
Response: { id: string, key: string, name: string, prefix: string }

GET /api/keys
Authorization: Bearer <supabase_jwt>
Response: { keys: Array<{ id, name, prefix, last4, created_at, revoked }> }

DELETE /api/keys/:id
Authorization: Bearer <supabase_jwt>
Response: { success: true }
```

**[contracts/usage.md](./contracts/usage.md)**
```
GET /api/usage
Authorization: Bearer <supabase_jwt>
Response: {
  quota: number,
  used: number,
  percentage: number,
  byKey: Array<{ keyId, name, count }>,
  history: Array<{ date, count }>
}
```

**[contracts/subscriptions.md](./contracts/subscriptions.md)**
```
POST /api/subscriptions/checkout
Authorization: Bearer <supabase_jwt>
Body: { planTier: 'starter' | 'pro' | 'enterprise' }
Response: { checkoutUrl: string }

POST /api/subscriptions/webhook
Body: DodoPayments webhook payload
Response: { received: true }

GET /api/subscriptions
Authorization: Bearer <supabase_jwt>
Response: { tier, status, currentPeriodEnd, quota }
```

#### 3. Quickstart Guide ([quickstart.md](./quickstart.md))
- Prerequisites (API key, cURL or HTTP client)
- Generate first PDF (REST API example)
- View PDF URL
- Explore options (page size, margins, orientation)
- Handle errors
- Check usage quota
- Multi-language examples (JavaScript, Python, PHP, Ruby)
- WebSocket API example (advanced users)

## Next Steps

After `/speckit.plan` completes, run `/speckit.tasks` to generate the task list for implementing this plan. The task list will break down each user story into specific implementation tasks organized by phase and priority.

**Estimated Timeline**: 4-6 weeks for full implementation (P1-P3 stories), 6-8 weeks including P4 (multi-team API keys).
