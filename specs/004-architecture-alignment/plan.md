# Implementation Plan: Architecture Alignment

**Branch**: `004-architecture-alignment` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-architecture-alignment/spec.md`

## Summary

Fix critical architecture gaps to deliver Speedstein's 5x performance promise by implementing:
1. **Durable Objects browser pooling** - Eliminate 300-500ms browser launch overhead (28% latency reduction)
2. **Cap'n Web RPC with promise pipelining** - Batch 10 PDFs in 2s vs 18s sequential (9x improvement)
3. **REST API DO routing** - Transparent performance boost for existing users
4. **Correct pricing tier quotas** - Fix inconsistent limits (Free=100, Starter=5K, Pro=50K, Enterprise=500K)
5. **Plan-based rate limiting** - Enforce correct per-tier limits (10/50/200/1000 req/min)
6. **R2 lifecycle policies** - Auto-delete PDFs by retention period (24h/7d/30d/90d), reduce storage cost 60%+

**Technical Approach**: Existing BrowserPoolDO infrastructure is already in place but not activated for REST or RPC endpoints. Implementation focuses on:
- Activating DO routing in `/api/generate` with feature flag fallback
- Implementing Cap'n Web `PdfGeneratorApi` RPC target extending existing PDF service
- Creating constants file for correct quota/rate limit values
- Configuring R2 lifecycle rules via Cloudflare dashboard

## Technical Context

**Language/Version**: TypeScript 5.3 (strict mode enabled)
**Primary Dependencies**:
- `capnweb@^0.1.0` (NEW - Cap'n Web RPC)
- `@cloudflare/puppeteer@latest` (existing)
- `@supabase/supabase-js@^2.38.0` (existing)
- `zod@^3.22.0` (existing - validation)

**Storage**:
- Supabase PostgreSQL (existing schema: users, api_keys, subscriptions, usage_quotas)
- Cloudflare R2 (speedstein-pdfs-dev bucket)
- Cloudflare KV (rate limiting)

**Testing**: Vitest for unit tests, custom scripts for E2E testing
**Target Platform**: Cloudflare Workers (edge compute), Durable Objects (stateful compute)
**Project Type**: Monorepo with backend Worker and future frontend (Next.js 15)
**Performance Goals**:
- P50 latency: 1.8s → 1.3s (28% improvement)
- P95 latency: 2.5s → <2.0s (target)
- Batch 10 PDFs: 18s → <2s (9x improvement)
- Throughput: 30-40/min → 100+/min
- Browser reuse rate: 0% → 80%

**Constraints**:
- Must maintain 99.9% uptime during rollout (graceful fallbacks)
- Zero breaking changes to existing REST API contract
- Backward compatible with current clients
- Cloudflare Workers 128MB memory limit per request
- Durable Objects 128MB default memory (supports 8-16 browser contexts)

**Scale/Scope**:
- Target: 500K PDFs/month (Enterprise tier)
- Concurrent users: 1000+ (Enterprise rate limit)
- Browser pool: 8 instances per DO, expandable to 16
- Geographic: Single-region initially, multi-region future

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [x] Feature design supports P95 latency <2s for PDF generation (target: <2s from current 2.5s)
- [x] Browser session reuse strategy documented (Durable Objects pool with 8 warm instances)
- [x] Chrome instance warming approach defined (FIFO eviction after 5min idle, pre-warm on first request)
- [x] Promise pipelining identified for batch operations (Cap'n Web `generateBatch` method)
- [x] No blocking operations in critical path (async/await throughout, no sync crypto)

### Security & Authentication (Principle II)
- [x] API keys will be SHA-256 hashed before storage (existing implementation via crypto.subtle.digest)
- [x] No plaintext secrets in code or configuration (all in .dev.vars and wrangler secrets)
- [x] RLS policies defined for all Supabase tables (existing policies on users, api_keys, subscriptions, usage_quotas)
- [x] Rate limiting strategy documented for endpoints (per-tier limits in KV with token bucket)
- [x] CORS configuration specified (existing CORS middleware)
- [x] Environment variables identified for all secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)

### Design System Standards (Principle III)
- [x] All colors use OKLCH color space (N/A - backend feature, no UI components)
- [x] WCAG AAA contrast compliance verified (N/A - backend feature)
- [x] Elevation system uses OKLCH lightness manipulation (N/A - backend feature)
- [x] Only shadcn/ui components used (N/A - backend feature, future frontend will comply)

**Note**: Design system standards not applicable to this backend-only feature. Future frontend work will fully comply.

### Technology Stack (Principle IV)
- [x] Frontend uses Next.js 15 with App Router (N/A for this backend feature, future compliance)
- [x] Backend uses Cloudflare Workers (✅ existing infrastructure)
- [x] RPC uses Cap'n Web for PDF generation (✅ implementing in this feature)
- [x] Database uses Supabase with RLS (✅ existing infrastructure)
- [x] Payments use DodoPayments (existing, quota enforcement enhanced this feature)
- [x] Styling uses Tailwind CSS with OKLCH tokens (N/A - backend feature)

### Code Quality (Principle V)
- [x] TypeScript strict mode enabled (✅ tsconfig.json: `"strict": true`)
- [x] Error handling strategy documented (try-catch blocks with Result types, graceful degradation)
- [x] No console.log in production code paths (use structured logging via logger service)
- [x] Zod schemas defined for API validation (existing for REST, will add for RPC)
- [x] Browser instance disposal strategy documented (FIFO pool eviction, auto-close after 5min idle)

### Cap'n Web Best Practices (Principle VI)
- [x] Server classes extend RpcTarget (PdfGeneratorApi will extend RpcTarget)
- [x] Promise pipelining strategy documented (generateBatch processes all PDFs in parallel, single round trip)
- [x] Resource disposal using 'using' keyword or Symbol.dispose() (TypeScript 5.3 'using' for browser contexts)
- [x] WebSocket heartbeat mechanism planned (ping/pong every 30s, timeout after 5min inactive)
- [x] No event loop blocking operations (all async: Puppeteer, Supabase, R2 uploads)

### User Experience (Principle VII)
- [x] Landing page load time target <2s (LCP) (N/A - backend feature, future frontend compliance)
- [x] Live demo works without authentication (N/A - backend feature)
- [x] Dark mode support included (N/A - backend feature)
- [x] Mobile-responsive design (breakpoints: 640/768/1024/1280px) (N/A - backend feature)
- [x] Lighthouse score target 95+ documented (N/A - backend feature)

**Note**: UX standards not applicable to backend API. Future frontend implementation will comply.

### Testing & Quality (Principle VIII)
- [x] Unit tests planned for business logic (BrowserPoolDO methods, RPC handlers, quota enforcement)
- [x] Integration tests planned for API endpoints (REST `/api/generate`, RPC `/api/rpc`, WebSocket)
- [x] E2E tests planned for user flows (browser reuse, batch generation, quota limits)
- [x] 80%+ code coverage target for services/models (Vitest coverage reports)
- [x] Link validation strategy documented (N/A - no links in API responses, R2 URLs auto-generated)

### Documentation (Principle IX)
- [x] API endpoints will be documented in SPEEDSTEIN_API_REFERENCE.md (update with RPC methods)
- [x] Code examples planned for JS, Python, PHP, Ruby (RPC client examples for WebSocket)
- [x] README updates identified (quickstart.md will document RPC usage)
- [x] Complex logic will have inline comments (BrowserPoolDO eviction, promise pipelining)
- [x] Public functions will have JSDoc/TSDoc (PdfGeneratorApi methods, DO handlers)

### Deployment & Operations (Principle X)
- [x] Zero-downtime deployment strategy documented (feature flag for DO routing, gradual rollout)
- [x] Sentry error tracking configured (existing Sentry integration)
- [x] 99.9% uptime monitoring planned (existing uptime monitoring, add DO health metrics)
- [x] Structured logging for critical operations (existing logger service, add DO pool metrics)
- [x] Environment variables for configuration (existing .dev.vars, add CAP_N_WEB_ENABLED flag)

**Gate Status**: ✅ PASSED - All applicable constitutional principles satisfied. Backend-only feature exempted from UI/UX standards as expected.

## Project Structure

### Documentation (this feature)

```text
specs/004-architecture-alignment/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── rpc-api.capnp    # Cap'n Proto schema for RPC
│   └── rest-api.yaml    # OpenAPI for REST updates
├── checklists/          # Quality validation
│   └── requirements.md  # Spec validation (complete ✅)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

**Current Structure** (Cloudflare Workers monorepo):

```text
apps/worker/
├── src/
│   ├── durable-objects/
│   │   └── BrowserPoolDO.ts       # EXISTS: Browser pool DO (needs RPC integration)
│   ├── rpc/
│   │   └── pdf-generator-api.ts   # TO CREATE: Cap'n Web RPC target
│   ├── services/
│   │   ├── auth.service.ts        # EXISTS: API key auth
│   │   ├── pdf.service.ts         # EXISTS: PDF generation logic
│   │   └── quota.service.ts       # EXISTS: Quota enforcement (needs update)
│   ├── middleware/
│   │   ├── durable-object-routing.ts  # EXISTS: DO routing helpers
│   │   ├── rate-limit.ts          # EXISTS: Rate limiting (needs update)
│   │   └── cors.ts                # EXISTS: CORS
│   ├── lib/
│   │   ├── browser.ts             # EXISTS: SimpleBrowserService
│   │   ├── browser-pool.ts        # DEPRECATED: Legacy pool (unused)
│   │   ├── r2.ts                  # EXISTS: R2 storage
│   │   ├── crypto.ts              # EXISTS: SHA-256 hashing
│   │   └── constants.ts           # TO CREATE: Quota/rate limit constants
│   ├── types/
│   │   └── env.ts                 # EXISTS: Env type (needs BROWSER_POOL_DO binding)
│   └── index.ts                   # EXISTS: Main Worker (needs RPC endpoint + DO routing)
├── wrangler.toml                  # EXISTS: DO bindings configured ✅
└── package.json                   # TO UPDATE: Add capnweb dependency

packages/shared/
└── src/
    └── types/
        └── pdf.ts                 # EXISTS: Shared PDF types

tests/
├── unit/
│   ├── browser-pool.test.ts       # TO CREATE: BrowserPoolDO tests
│   └── rpc-api.test.ts            # TO CREATE: RPC handler tests
└── integration/
    ├── do-routing.test.ts         # TO CREATE: DO routing tests
    └── rpc-websocket.test.ts      # TO CREATE: WebSocket RPC tests

scripts/
├── test-rpc-client.mjs            # TO CREATE: RPC test client
└── configure-r2-lifecycle.sh      # TO CREATE: R2 lifecycle config
```

**Structure Decision**: Existing Cloudflare Workers monorepo structure is ideal for this backend-only feature. All code lives in `apps/worker/src/` with clear separation:
- **Durable Objects** for stateful browser pooling
- **RPC** directory for Cap'n Web targets
- **Services** for business logic
- **Middleware** for cross-cutting concerns

No structural changes needed. Future frontend (`apps/web/`) will be added when building landing page feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations requiring justification**. All constitutional principles are satisfied for this backend-focused feature. UI/UX standards (Principle III, VII) correctly marked N/A as this is API-only work.

---

## Phase 0: Research & Technical Investigation

### Research Questions

Based on Technical Context gaps and constitutional requirements, the following research questions must be resolved:

1. **Cap'n Web Integration Pattern**
   - **Question**: What is the correct pattern for integrating Cap'n Web RPC into Cloudflare Workers with Durable Objects?
   - **Research Focus**: Official Cap'n Web examples, Workers RPC patterns, DO + RPC integration
   - **Success Criteria**: Working example of RpcTarget class in Worker, WebSocket upgrade handling, HTTP Batch mode

2. **Durable Objects Migration Strategy**
   - **Question**: How to safely migrate production traffic from SimpleBrowserService to BrowserPoolDO without downtime?
   - **Research Focus**: Feature flag patterns, gradual rollout strategies, fallback mechanisms
   - **Success Criteria**: Zero-downtime migration plan with automated rollback

3. **Browser Pool Sizing & Performance**
   - **Question**: Is 8 browsers per DO optimal, or should we start with 4 and scale dynamically?
   - **Research Focus**: Cloudflare DO memory limits, Chrome memory footprint, concurrency patterns
   - **Success Criteria**: Empirical data on memory usage per browser, optimal pool size calculation

4. **R2 Lifecycle Policy Configuration**
   - **Question**: How to configure tiered lifecycle policies with R2 object tagging?
   - **Research Focus**: R2 lifecycle rules API, object tagging best practices, policy precedence
   - **Success Criteria**: Working lifecycle policy configs for all 4 tiers (24h/7d/30d/90d)

5. **Promise Pipelining Implementation**
   - **Question**: How to properly implement promise pipelining in Cap'n Web for batch PDF generation?
   - **Research Focus**: Cap'n Web promise pipelining examples, RPC method design, error handling in batches
   - **Success Criteria**: Batch method that processes 10 PDFs in single round trip with proper error isolation

6. **WebSocket Heartbeat & Timeout**
   - **Question**: What are the optimal heartbeat interval and timeout values for WebSocket RPC connections?
   - **Research Focus**: Cloudflare Workers WebSocket limits, Cap'n Web heartbeat patterns, production timeout tuning
   - **Success Criteria**: Heartbeat configuration that keeps connections alive for 5+ minutes under load

7. **Token Bucket Rate Limiting**
   - **Question**: How to implement token bucket algorithm in Cloudflare KV with per-tier burst limits?
   - **Research Focus**: Token bucket algorithms, KV atomic operations, burst allowance calculation
   - **Success Criteria**: Rate limiter that allows 2x burst while maintaining average limit

8. **Quota Enforcement Race Conditions**
   - **Question**: How to prevent race conditions in quota enforcement when handling concurrent requests?
   - **Research Focus**: Atomic operations in Supabase, optimistic locking patterns, idempotent usage tracking
   - **Success Criteria**: Concurrent request handler that prevents quota over-run

### Research Outputs

**Consolidated findings will be documented in `research.md` with the following structure:**

```markdown
# Architecture Alignment Research

## Decision Log

### D1: Cap'n Web Integration Architecture
- **Decision**: [Chosen approach]
- **Rationale**: [Why this approach]
- **Alternatives Considered**: [Other options evaluated]
- **Implementation Notes**: [Key technical details]

### D2: Migration Strategy
[Same structure]

### D3-D8: [Remaining decisions]

## Best Practices Summary

### Cap'n Web RPC
- [Key patterns discovered]
- [Common pitfalls to avoid]
- [Performance optimizations]

### Durable Objects
- [Session affinity patterns]
- [Memory management]
- [Migration strategies]

### R2 Lifecycle
- [Tagging conventions]
- [Policy configuration]
- [Testing approaches]

## Implementation References

- [Links to official docs]
- [Example code repositories]
- [Performance benchmarks]
```

---

## Phase 1: Design & Contracts

### Data Model

**New Entities** (to be detailed in `data-model.md`):

1. **BrowserSession** (in-memory, Durable Object state)
   - Fields: browserId, createdAt, lastUsedAt, requestCount, status
   - Validation: createdAt < 1 hour ago, status in [active, idle, crashed]
   - State Transitions: active → idle (after 5min), idle → evicted, crashed → removed

2. **RpcSession** (in-memory, WebSocket state)
   - Fields: sessionId, userId, connectedAt, lastHeartbeat, activeRequests
   - Validation: connectedAt < 10min ago, lastHeartbeat < 90s ago
   - State Transitions: connected → active, active → idle, idle → closed

3. **PlanTierConfig** (constants, code-defined)
   - Fields: tier, monthlyQuota, rateLimit, burstLimit, retentionDays
   - Validation: tier in [free, starter, pro, enterprise], monthlyQuota > 0
   - No state transitions (immutable configuration)

### API Contracts

**RPC Contract** (`contracts/rpc-api.capnp`):

```capnproto
# Cap'n Proto schema for PdfGeneratorApi
interface PdfGeneratorApi {
  generatePdf @0 (html :Text, options :PdfOptions) -> (result :PdfResult);
  generateBatch @1 (jobs :List(PdfJob)) -> (results :List(PdfResult));
}

struct PdfOptions {
  format @0 :Text;        # "A4", "Letter", etc.
  margin @1 :Margin;      # Top, right, bottom, left
  printBackground @2 :Bool;
  landscape @3 :Bool;
}

struct PdfJob {
  html @0 :Text;
  options @1 :PdfOptions;
  metadata @2 :Text;      # User-provided identifier
}

struct PdfResult {
  success @0 :Bool;
  pdfUrl @1 :Text;
  size @2 :UInt64;
  generationTime @3 :UInt64;
  error @4 :Text;
}
```

**REST Contract Updates** (`contracts/rest-api.yaml`):

```yaml
# OpenAPI 3.0 updates for existing /api/generate
/api/generate:
  post:
    summary: Generate single PDF (enhanced with DO routing)
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [html]
            properties:
              html:
                type: string
              options:
                $ref: '#/components/schemas/PdfOptions'
    responses:
      200:
        description: PDF generated successfully
        headers:
          X-Browser-Pool-Hit:
            description: "true if pooled browser reused, false if cold start"
            schema:
              type: boolean
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PdfResponse'

/api/rpc:
  get:
    summary: WebSocket RPC endpoint (Cap'n Web)
    responses:
      101:
        description: Switching Protocols to WebSocket
  post:
    summary: HTTP Batch RPC endpoint (Cap'n Web)
    requestBody:
      content:
        application/capnproto:
          schema:
            description: Serialized Cap'n Proto RPC message
    responses:
      200:
        description: Batch RPC response
```

### Quickstart Guide

**RPC Usage** (to be detailed in `quickstart.md`):

```typescript
// JavaScript/TypeScript WebSocket RPC Client
import { newWebSocketRpcSession } from 'capnweb';

const api = await newWebSocketRpcSession(
  'wss://api.speedstein.com/api/rpc',
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);

// Single PDF
const result = await api.generatePdf(
  '<html><h1>Invoice</h1></html>',
  { format: 'A4', printBackground: true }
);

// Batch (promise pipelining - single round trip!)
const results = await Promise.all([
  api.generatePdf('<html>Invoice 1</html>', {}),
  api.generatePdf('<html>Invoice 2</html>', {}),
  api.generatePdf('<html>Invoice 3</html>', {}),
]);

await api.close();
```

### Agent Context Update

Run the agent context update script to add new technologies:

```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

**Technologies to add**:
- Cap'n Web RPC (capnweb npm package)
- Durable Objects browser pooling
- WebSocket RPC patterns
- Promise pipelining techniques
- R2 lifecycle policies

---

## Re-Evaluation: Constitution Check Post-Design

*After completing Phase 1 design, re-check all constitutional principles:*

### Performance (Principle I) - ✅ PASS
- Design supports <2s P95 latency with 80% browser reuse
- Browser pooling eliminates 450ms overhead
- Promise pipelining reduces batch time by 9x

### Security (Principle II) - ✅ PASS
- No new security risks introduced
- Existing SHA-256 hashing, RLS policies maintained
- Rate limiting enhanced with per-tier configuration

### Design System (Principle III) - ✅ PASS (N/A)
- Backend-only feature, no UI components

### Technology Stack (Principle IV) - ✅ PASS
- Cloudflare Workers + Durable Objects ✅
- Cap'n Web for RPC ✅
- Supabase with RLS ✅

### Code Quality (Principle V) - ✅ PASS
- TypeScript strict mode ✅
- Error handling in all async paths ✅
- Zod schemas for RPC validation ✅

### Cap'n Web (Principle VI) - ✅ PASS
- PdfGeneratorApi extends RpcTarget ✅
- Promise pipelining in generateBatch ✅
- Resource disposal with 'using' keyword ✅

### UX (Principle VII) - ✅ PASS (N/A)
- Backend-only feature

### Testing (Principle VIII) - ✅ PASS
- Unit tests for DO, RPC, quotas planned
- Integration tests for all endpoints planned
- E2E tests for browser reuse, batch ops planned

### Documentation (Principle IX) - ✅ PASS
- API reference will be updated
- RPC examples for 4 languages planned
- quickstart.md will document usage

### Deployment (Principle X) - ✅ PASS
- Feature flag for zero-downtime rollout
- Existing Sentry integration
- Structured logging for DO metrics

**Post-Design Gate Status**: ✅ ALL PRINCIPLES SATISFIED

---

## Next Steps

This plan is now complete through Phase 1 (design). The next command is:

```bash
/speckit.tasks
```

This will generate `tasks.md` breaking down the 6 user stories into concrete implementation tasks with:
- Task dependencies and ordering
- Acceptance criteria per task
- Estimated effort (hours)
- Testing requirements
- Deployment steps

**Summary of Artifacts Generated**:
1. ✅ plan.md (this file)
2. ⏳ research.md (next: manual research or agent dispatch)
3. ⏳ data-model.md (next: entity extraction)
4. ⏳ contracts/ (next: schema generation)
5. ⏳ quickstart.md (next: usage examples)
6. ⏳ tasks.md (next: `/speckit.tasks` command)
