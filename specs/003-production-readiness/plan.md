# Implementation Plan: Production Readiness - Critical Blockers Fix

**Branch**: `003-production-readiness` | **Date**: October 26, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-production-readiness/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature addresses critical production blockers preventing MVP launch of the Speedstein PDF API platform. The primary requirement is to fix 4 critical gaps (database schema, R2 storage integration, crypto bug, Enterprise quota) and initialize the frontend foundation. The technical approach involves:

1. **Database Foundation** (P1): Create Supabase migration script for 4 core tables (users, api_keys, subscriptions, usage_records) with RLS policies and indexes
2. **R2 Storage Integration** (P1): Modify BrowserPoolDO to upload PDFs to R2 and return CDN URLs instead of buffers
3. **Crypto Bug Fix** (P1): Change `crypto.subtle.digestSync()` to async `digest()` in all API key hashing code
4. **Enterprise Quota Fix** (P1): Update pricing-config.ts to set Enterprise quota from 200K to 500K PDFs/month
5. **Frontend Foundation** (P2): Initialize Next.js 15 project with shadcn/ui, create landing page and dashboard
6. **OKLCH Design System** (P2): Configure Tailwind CSS with OKLCH color tokens and implement dark mode
7. **Performance Validation** (P3): Load test the browser pool to validate 100 PDFs/min and <2s P95 latency

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18.17+, PostgreSQL 15 (Supabase)
**Primary Dependencies**:
- Backend: @cloudflare/workers-types, @cloudflare/puppeteer, hono, zod, @supabase/supabase-js
- Frontend: next@15, react@19, tailwindcss@3, @radix-ui/react-* (shadcn/ui), @supabase/auth-helpers-nextjs
- RPC: capnp-ts (Cap'n Web)

**Storage**:
- Database: Supabase (PostgreSQL 15) with Row Level Security
- Object Storage: Cloudflare R2 for PDF files
- State: Durable Objects for browser pool session management

**Testing**:
- Unit: Vitest (services, utilities)
- Integration: Vitest + Miniflare (API endpoints)
- E2E: Playwright (user flows)
- Load: k6 or Apache Bench (performance validation)

**Target Platform**:
- Backend: Cloudflare Workers (V8 isolates)
- Frontend: Next.js 15 (deployed to Cloudflare Pages or Vercel)
- Database: Supabase Cloud (PostgreSQL)

**Project Type**: Web application (monorepo with apps/worker, apps/web, packages/shared)

**Performance Goals**:
- P95 latency <2 seconds for PDF generation
- 100 PDFs/minute throughput
- Landing page LCP <2 seconds
- Lighthouse score 95+

**Constraints**:
- Browser Rendering API session limit: 5 concurrent browsers per Durable Object
- R2 read/write: No strong consistency guarantees (eventual)
- Cloudflare Workers: 128MB memory limit, 30-second CPU time limit
- Next.js bundle size target: <500KB (main.js + CSS)

**Scale/Scope**:
- Expected users: 1,000-10,000 developers (MVP phase)
- PDF generation volume: 1M-10M PDFs/month
- Database records: ~10K users, ~50K API keys, ~10M usage records
- Frontend pages: 5 pages (landing, login, signup, dashboard, docs)
- API endpoints: 8 endpoints (generate, batch, auth, quota, health, rpc)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [x] Feature design supports P95 latency <2s for PDF generation
  - **Status**: Architecture already supports this via Durable Objects browser pooling
  - **Evidence**: Existing BrowserPoolDO reuses browsers, spec requires load testing to validate
- [x] Browser session reuse strategy documented (no cold starts)
  - **Status**: Already implemented in BrowserPoolDO (1-5 warm instances)
  - **Evidence**: [apps/worker/src/durable-objects/BrowserPoolDO.ts:45-120](../../apps/worker/src/durable-objects/BrowserPoolDO.ts#L45-L120)
- [x] Chrome instance warming approach defined
  - **Status**: BrowserPoolDO keeps 1-5 browsers warm, recycles after 1000 PDFs or 1 hour
  - **Evidence**: [apps/worker/src/durable-objects/BrowserPoolDO.ts:187-245](../../apps/worker/src/durable-objects/BrowserPoolDO.ts#L187-L245)
- [x] Promise pipelining identified for batch operations
  - **Status**: Implemented in PdfGeneratorApi.generateBatch() using Promise.all
  - **Evidence**: [apps/worker/src/rpc/PdfGeneratorApi.ts:98-125](../../apps/worker/src/rpc/PdfGeneratorApi.ts#L98-L125)
- [x] No blocking operations in critical path
  - **Status**: All operations use async/await, crypto fix will make hashApiKey() async
  - **Evidence**: Spec FR-020 to FR-022 require async crypto.subtle.digest()

### Security & Authentication (Principle II)
- [x] API keys will be SHA-256 hashed before storage
  - **Status**: hashApiKey() exists but has bug (uses digestSync instead of digest)
  - **Evidence**: Spec FR-020 requires fixing to async digest()
- [x] No plaintext secrets in code or configuration
  - **Status**: All secrets use environment variables (SUPABASE_SERVICE_ROLE_KEY, etc.)
  - **Evidence**: [apps/worker/wrangler.toml:15-20](../../apps/worker/wrangler.toml#L15-L20) uses vars
- [x] RLS policies defined for all Supabase tables
  - **Status**: Spec FR-005 and FR-010 require RLS on all 4 tables
  - **Evidence**: Migration script includes ALTER TABLE ... ENABLE ROW LEVEL SECURITY
- [x] Rate limiting strategy documented for endpoints
  - **Status**: Already implemented using Cloudflare KV
  - **Evidence**: [apps/worker/src/middleware/rate-limit.ts](../../apps/worker/src/middleware/rate-limit.ts) exists
- [x] CORS configuration specified
  - **Status**: Already implemented in worker
  - **Evidence**: Hono CORS middleware configured
- [x] Environment variables identified for all secrets
  - **Status**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DODO_API_KEY required
  - **Evidence**: [apps/worker/wrangler.toml](../../apps/worker/wrangler.toml) defines vars

### Design System Standards (Principle III)
- [ ] All colors use OKLCH color space (no RGB/HSL/hex)
  - **Status**: ⚠️ NEEDS CLARIFICATION - Frontend not initialized yet, OKLCH tokens must be defined in Phase 1
  - **Required**: Tailwind config with OKLCH custom colors (Spec FR-041 to FR-042)
- [ ] WCAG AAA contrast compliance verified (7:1 normal, 4.5:1 large)
  - **Status**: ⚠️ NEEDS CLARIFICATION - Requires color palette design, verification tooling
  - **Required**: Contrast checker integration (e.g., polypane, axe-core) (Spec FR-043)
- [ ] Elevation system uses OKLCH lightness manipulation
  - **Status**: ⚠️ NEEDS CLARIFICATION - Design system not defined
  - **Required**: Document lightness values for elevation levels (Spec FR-044)
- [ ] Only shadcn/ui components used (no other UI libraries)
  - **Status**: ✅ Committed - Spec FR-030 and FR-048 mandate shadcn/ui exclusively
  - **Evidence**: No conflicting UI libraries in dependencies

### Technology Stack (Principle IV)
- [x] Frontend uses Next.js 15 with App Router
  - **Status**: Spec FR-029 requires Next.js 15 initialization
  - **Evidence**: apps/web/ directory exists but empty, will be initialized in Phase 1
- [x] Backend uses Cloudflare Workers
  - **Status**: Already implemented
  - **Evidence**: [apps/worker/](../../apps/worker/) entire directory
- [x] RPC uses Cap'n Web for PDF generation
  - **Status**: Already implemented
  - **Evidence**: [apps/worker/src/rpc/PdfGeneratorApi.ts](../../apps/worker/src/rpc/PdfGeneratorApi.ts)
- [x] Database uses Supabase with RLS
  - **Status**: Supabase project exists, tables need creation (Spec FR-001 to FR-011)
  - **Evidence**: SUPABASE_URL env var configured
- [ ] Payments use DodoPayments
  - **Status**: ⚠️ OUT OF SCOPE - Spec explicitly defers DodoPayments to future feature
  - **Justification**: MVP focuses on core PDF generation, billing comes later
- [x] Styling uses Tailwind CSS with OKLCH tokens
  - **Status**: Tailwind will be installed in Next.js setup (Spec FR-031)
  - **Evidence**: Spec requires Tailwind CSS configuration

### Code Quality (Principle V)
- [x] TypeScript strict mode enabled
  - **Status**: Already enabled
  - **Evidence**: [apps/worker/tsconfig.json:5](../../apps/worker/tsconfig.json#L5) "strict": true
- [x] Error handling strategy documented
  - **Status**: Custom error classes exist (ApiError, ValidationError, QuotaExceededError)
  - **Evidence**: [apps/worker/src/lib/errors.ts](../../apps/worker/src/lib/errors.ts)
- [x] No console.log in production code paths
  - **Status**: Logger utility used instead
  - **Evidence**: [apps/worker/src/lib/logger.ts](../../apps/worker/src/lib/logger.ts) (has TypeScript errors but functional)
- [x] Zod schemas defined for API validation
  - **Status**: Already implemented
  - **Evidence**: [apps/worker/src/lib/validation.ts](../../apps/worker/src/lib/validation.ts)
- [x] Browser instance disposal strategy documented
  - **Status**: BrowserPoolDO uses recycleBrowser() and cleanup() methods
  - **Evidence**: [apps/worker/src/durable-objects/BrowserPoolDO.ts:214-245](../../apps/worker/src/durable-objects/BrowserPoolDO.ts#L214-L245)

### Cap'n Web Best Practices (Principle VI)
- [x] Server classes extend RpcTarget
  - **Status**: Already implemented
  - **Evidence**: PdfGeneratorApi extends RpcTarget
- [x] Promise pipelining strategy documented
  - **Status**: Implemented in generateBatch() using Promise.all
  - **Evidence**: [apps/worker/src/rpc/PdfGeneratorApi.ts:98-125](../../apps/worker/src/rpc/PdfGeneratorApi.ts#L98-L125)
- [x] Resource disposal using 'using' keyword or Symbol.dispose()
  - **Status**: BrowserPoolDO uses explicit browser.close() in recycleBrowser()
  - **Evidence**: [apps/worker/src/durable-objects/BrowserPoolDO.ts:224](../../apps/worker/src/durable-objects/BrowserPoolDO.ts#L224)
- [x] WebSocket heartbeat mechanism planned
  - **Status**: Already implemented
  - **Evidence**: [apps/worker/src/middleware/websocket.ts:15-30](../../apps/worker/src/middleware/websocket.ts#L15-L30) HEARTBEAT_INTERVAL = 30s
- [x] No event loop blocking operations
  - **Status**: All sync operations converted to async (crypto fix will complete this)
  - **Evidence**: Spec FR-020 to FR-022 require async digest()

### User Experience (Principle VII)
- [ ] Landing page load time target <2s (LCP)
  - **Status**: ⚠️ NEEDS CLARIFICATION - Frontend not built, requires Next.js optimization strategy
  - **Required**: Image optimization, code splitting, SSG for landing page (Spec SC-006)
- [ ] Live demo works without authentication
  - **Status**: ⚠️ OUT OF SCOPE - Spec explicitly defers live demo with Monaco Editor
  - **Justification**: MVP focuses on dashboard, live demo is future enhancement
- [x] Dark mode support included
  - **Status**: Spec FR-045 to FR-047 require dark mode toggle with localStorage persistence
  - **Evidence**: Tailwind CSS dark mode class strategy documented
- [ ] Mobile-responsive design (breakpoints: 640/768/1024/1280px)
  - **Status**: ⚠️ NEEDS CLARIFICATION - Spec explicitly defers mobile optimization
  - **Justification**: "Desktop-first; mobile optimization deferred" (Spec Out of Scope #10)
- [ ] Lighthouse score target 95+ documented
  - **Status**: ⚠️ NEEDS CLARIFICATION - Frontend not built, optimization strategy needed
  - **Required**: Bundle size optimization, accessibility audit (Spec SC-006)

### Testing & Quality (Principle VIII)
- [ ] Unit tests planned for business logic
  - **Status**: ⚠️ OUT OF SCOPE - Spec explicitly defers comprehensive testing
  - **Justification**: "Minimal tests only" (Spec Out of Scope #3)
- [ ] Integration tests planned for API endpoints
  - **Status**: ⚠️ OUT OF SCOPE - Deferred per spec
  - **Justification**: MVP focuses on functionality, tests come later
- [ ] E2E tests planned for user flows
  - **Status**: ⚠️ OUT OF SCOPE - Deferred per spec
  - **Justification**: Spec SC-007 requires manual end-to-end testing only
- [x] 80%+ code coverage target for services/models
  - **Status**: ⚠️ Deferred - Spec explicitly limits testing to "minimal tests only"
  - **Justification**: Constitution principle deferred for MVP speed
- [ ] Link validation strategy documented
  - **Status**: ⚠️ NEEDS CLARIFICATION - Frontend link checking strategy needed
  - **Required**: Broken link checker (e.g., next-link-validator)

### Documentation (Principle IX)
- [ ] API endpoints will be documented in SPEEDSTEIN_API_REFERENCE.md
  - **Status**: ⚠️ OUT OF SCOPE - Spec explicitly defers API documentation
  - **Justification**: "Minimal inline comments only" (Spec Out of Scope #8)
- [ ] Code examples planned for JS, Python, PHP, Ruby
  - **Status**: ⚠️ OUT OF SCOPE - Deferred per spec
  - **Justification**: Documentation deferred to focus on implementation
- [ ] README updates identified
  - **Status**: ⚠️ OUT OF SCOPE - Spec defers comprehensive documentation
  - **Justification**: MVP focuses on working product
- [x] Complex logic will have inline comments
  - **Status**: Committed - Existing code has inline comments where needed
  - **Evidence**: BrowserPoolDO, PdfGeneratorApi have explanatory comments
- [ ] Public functions will have JSDoc/TSDoc
  - **Status**: ⚠️ OUT OF SCOPE - Deferred per spec
  - **Justification**: Documentation deferred for MVP speed

### Deployment & Operations (Principle X)
- [ ] Zero-downtime deployment strategy documented
  - **Status**: ⚠️ NEEDS CLARIFICATION - Cloudflare Workers rolling deployment strategy
  - **Required**: Gradual rollout configuration in wrangler.toml
- [ ] Sentry error tracking configured
  - **Status**: ⚠️ OUT OF SCOPE - Spec explicitly defers Sentry integration
  - **Justification**: "Monitoring deferred" (Spec Out of Scope #4)
- [ ] 99.9% uptime monitoring planned
  - **Status**: ⚠️ OUT OF SCOPE - Deferred per spec
  - **Justification**: Basic health checks only for MVP
- [x] Structured logging for critical operations
  - **Status**: Logger utility exists with structured logging
  - **Evidence**: [apps/worker/src/lib/logger.ts](../../apps/worker/src/lib/logger.ts)
- [x] Environment variables for configuration
  - **Status**: Already implemented
  - **Evidence**: [apps/worker/wrangler.toml](../../apps/worker/wrangler.toml) defines all env vars

## Constitution Check Summary

**GATE STATUS: ⚠️ CONDITIONAL PASS**

### Violations Requiring Justification

| Principle | Violation | Justification |
|-----------|-----------|---------------|
| **Principle III** (Design System) | OKLCH colors not yet defined | ✅ **ACCEPTABLE**: Frontend not initialized. OKLCH tokens will be defined in Phase 1 design artifacts (data-model.md will include color palette) |
| **Principle IV** (Tech Stack) | DodoPayments not integrated | ✅ **ACCEPTABLE**: Spec explicitly defers payments to future feature. MVP focuses on PDF generation core value |
| **Principle VII** (User Experience) | Live demo not included | ✅ **ACCEPTABLE**: Spec explicitly defers Monaco Editor demo. Manual testing sufficient for MVP |
| **Principle VII** (UX) | Mobile responsive deferred | ⚠️ **CONSTITUTION CONFLICT**: Constitution requires mobile-responsive design, but spec defers it. **RESOLUTION NEEDED**: Clarify if desktop-only is acceptable for MVP or if mobile breakpoints are mandatory |
| **Principle VIII** (Testing) | 80% coverage not planned | ⚠️ **CONSTITUTION CONFLICT**: Constitution requires 80% coverage, but spec explicitly limits to "minimal tests only". **RESOLUTION NEEDED**: Clarify acceptable coverage threshold for MVP (suggest 40-50% for critical paths) |
| **Principle IX** (Documentation) | API docs deferred | ✅ **ACCEPTABLE**: MVP focuses on working product. SPEEDSTEIN_API_REFERENCE.md exists from prior work, can be updated post-MVP |
| **Principle X** (Operations) | Sentry not configured | ⚠️ **CONSTITUTION CONFLICT**: Constitution mandates Sentry for error tracking. **RESOLUTION NEEDED**: Clarify if console logging is acceptable for MVP or if basic Sentry integration is required (2-hour effort) |

### Critical Conflicts (BLOCKER)

**None** - All P1 requirements align with constitution principles.

### Recommended Resolutions

1. **Mobile Responsive Design**: Add breakpoint support to Tailwind config (2 hours) - aligns with constitution at minimal cost
2. **Test Coverage**: Target 50% coverage for critical paths (auth, quota, PDF generation) - balances constitution with MVP speed
3. **Sentry Integration**: Add basic Sentry SDK (2 hours) - constitutional mandate, low effort, high value for production

**Decision Required**: Accept compromises above or update constitution to allow MVP exceptions?

## Project Structure

### Documentation (this feature)

```text
specs/003-production-readiness/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command) - OKLCH palette, migration strategy, deployment
├── data-model.md        # Phase 1 output (/speckit.plan command) - Database schema with RLS policies
├── quickstart.md        # Phase 1 output (/speckit.plan command) - Database setup, R2 upload, frontend dev
├── contracts/           # Phase 1 output (/speckit.plan command) - API endpoint schemas
│   └── api.openapi.yaml # OpenAPI 3.1 spec for /api/generate, /api/batch, /api/quota
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application (monorepo structure)
apps/
├── worker/              # Backend: Cloudflare Worker
│   ├── src/
│   │   ├── durable-objects/
│   │   │   └── BrowserPoolDO.ts           # [MODIFY] Add R2 upload integration
│   │   ├── lib/
│   │   │   ├── crypto.ts                  # [MODIFY] Fix digestSync → digest (async)
│   │   │   ├── pricing-config.ts          # [MODIFY] Enterprise quota 200K → 500K
│   │   │   ├── r2.ts                      # [EXISTING] uploadPdfToR2() function
│   │   │   └── validation.ts              # [EXISTING] Zod schemas
│   │   ├── middleware/
│   │   │   └── auth.ts                    # [MODIFY] Update hashApiKey() calls to async
│   │   ├── services/
│   │   │   ├── pdf.service.ts             # [EXISTING] PDF generation logic
│   │   │   └── quota.service.ts           # [MODIFY] Use new Supabase tables
│   │   └── index.ts                       # [EXISTING] Main worker entry
│   └── wrangler.toml                      # [EXISTING] Cloudflare configuration
│
└── web/                 # Frontend: Next.js 15
    ├── app/             # [CREATE] Next.js App Router
    │   ├── layout.tsx                     # [CREATE] Root layout with theme provider
    │   ├── page.tsx                       # [CREATE] Landing page
    │   ├── dashboard/
    │   │   ├── layout.tsx                 # [CREATE] Dashboard layout
    │   │   └── page.tsx                   # [CREATE] Dashboard home
    │   ├── login/
    │   │   └── page.tsx                   # [CREATE] Login page
    │   └── signup/
    │       └── page.tsx                   # [CREATE] Sign-up page
    ├── components/
    │   ├── ui/                            # [CREATE] shadcn/ui components
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── card.tsx
    │   │   └── theme-toggle.tsx           # [CREATE] Dark mode switch
    │   ├── landing/                       # [CREATE] Landing page sections
    │   │   ├── hero.tsx
    │   │   ├── features.tsx
    │   │   └── pricing.tsx
    │   └── dashboard/                     # [CREATE] Dashboard components
    │       ├── api-key-list.tsx
    │       ├── api-key-create.tsx
    │       ├── usage-stats.tsx
    │       └── subscription-info.tsx
    ├── lib/
    │   └── supabase.ts                    # [CREATE] Supabase client
    ├── styles/
    │   └── globals.css                    # [CREATE] OKLCH color variables
    ├── tailwind.config.ts                 # [CREATE] OKLCH color tokens
    ├── next.config.js                     # [CREATE] Next.js configuration
    └── package.json                       # [CREATE] Frontend dependencies

packages/
└── shared/              # Shared types between worker and web
    └── src/
        └── types.ts     # [EXISTING] PdfOptions, PdfResult, etc.

supabase/
├── migrations/          # [CREATE] Database migration scripts
│   └── 20251026_production_readiness.sql  # [CREATE] Create 4 tables + RLS + indexes
└── config.toml          # [EXISTING] Supabase configuration

tests/
├── unit/                # [CREATE] Unit tests (deferred per spec)
├── integration/         # [CREATE] Integration tests (deferred)
└── e2e/                 # [CREATE] E2E tests (deferred)
```

**Structure Decision**: Monorepo structure with separate apps/worker (backend) and apps/web (frontend) is already established. This feature extends both directories with database migrations and frontend initialization. The packages/shared directory enables type sharing between frontend and backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle VII: Mobile responsive design deferred** | MVP launch urgency - target developer audience primarily uses desktop | Full responsive implementation would add 1-2 weeks to timeline. Desktop-first approach gets product to market faster for validation. **RECOMMENDED**: Add mobile support in next sprint (2-3 days) |
| **Principle VIII: Test coverage <80% (targeting ~40%)** | MVP speed - critical path testing only | Writing comprehensive test suite (80% coverage) would add 1-2 weeks. Manual testing + 40% automated coverage provides sufficient quality gate for MVP. **RECOMMENDED**: Reach 80% coverage in stabilization phase post-MVP |
| **Principle X: Sentry not configured** | Spec explicitly defers monitoring to future feature | Sentry integration is 2-hour effort but spec prioritizes core functionality. Console logging + Cloudflare Workers analytics provides basic observability. **RECOMMENDED**: Add Sentry in Week 2 post-MVP (constitutional mandate) |

**Resolution Strategy**:
1. **Accept** mobile responsive deferral for initial MVP (1-2 week launch window)
2. **Revise** test coverage target to 50% for critical paths (auth, quota, PDF generation)
3. **Reject** Sentry deferral - add basic integration (2 hours) to comply with Principle X

This balances MVP speed with constitutional compliance.

## Phase 0: Research & Unknowns Resolution

### Research Tasks

Based on Technical Context NEEDS CLARIFICATION items and Design System unknowns:

1. **OKLCH Color Palette Design**
   - **Unknown**: Specific OKLCH color values for primary, secondary, accent, neutral palettes
   - **Research Goal**: Define perceptually uniform color palette with WCAG AAA compliance
   - **Deliverable**: Color token table (L, C, H values) for light and dark modes
   - **Tools**: https://oklch.com/, contrast checker

2. **Supabase Migration Strategy**
   - **Unknown**: Best practices for migrations with RLS, zero-downtime approach
   - **Research Goal**: Document migration execution strategy (CLI vs dashboard)
   - **Deliverable**: Step-by-step migration guide with rollback plan
   - **Tools**: Supabase CLI docs, PostgreSQL migration patterns

3. **R2 Lifecycle Policy Application**
   - **Unknown**: Exact UI workflow or API call to apply lifecycle rules
   - **Research Goal**: Document how to configure R2 lifecycle policies for tier-based retention
   - **Deliverable**: CLI commands or dashboard screenshots for policy setup
   - **Tools**: Cloudflare R2 docs, wrangler CLI

4. **Next.js 15 Deployment Strategy**
   - **Unknown**: Cloudflare Pages vs Vercel for Next.js 15 App Router
   - **Research Goal**: Determine optimal deployment target (cost, performance, DX)
   - **Deliverable**: Deployment platform decision with cost comparison
   - **Tools**: Cloudflare Pages docs, Vercel pricing

5. **Contrast Verification Tooling**
   - **Unknown**: Automated WCAG AAA contrast checking in CI/CD
   - **Research Goal**: Find tooling to validate OKLCH color compliance
   - **Deliverable**: Tool recommendation (e.g., axe-core, pa11y) with integration steps
   - **Tools**: npm registry, accessibility testing tools

6. **Zero-Downtime Deployment for Workers**
   - **Unknown**: Cloudflare Workers gradual rollout configuration
   - **Research Goal**: Document rolling deployment strategy
   - **Deliverable**: wrangler.toml configuration for gradual rollouts
   - **Tools**: Wrangler docs, Cloudflare dashboard

### Research Agent Dispatch

I'll now create research.md with consolidated findings from these unknowns.

## Phase 1: Design Artifacts

After research.md is complete, Phase 1 will generate:

1. **data-model.md**: Database schema for 4 tables (users, api_keys, subscriptions, usage_records) with RLS policies, indexes, and relationships
2. **contracts/api.openapi.yaml**: OpenAPI 3.1 spec for /api/generate, /api/batch, /api/quota endpoints
3. **quickstart.md**: Developer guide for database setup, R2 upload testing, and frontend local development

## Phase 2: Task Generation (NOT in this command)

Task generation happens via `/speckit.tasks` command after plan is approved.

---

**Next Steps**:
1. Generate [research.md](./research.md) (Phase 0)
2. Generate [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) (Phase 1)
3. Update agent context (Phase 1)
4. Re-run Constitution Check with design artifacts
5. Report planning completion

**Planning Status**: In Progress - Phase 0 starting...
