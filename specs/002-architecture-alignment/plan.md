# Implementation Plan: Architecture Alignment - Durable Objects, Cap'n Web RPC, and Performance Optimization

**Branch**: `002-architecture-alignment` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-architecture-alignment/spec.md`

## Summary

This feature addresses critical architectural gaps identified in the Speedstein PDF API platform analysis. The implementation will add Cloudflare Durable Objects for stateful browser session pooling, implement Cap'n Web RPC with promise pipelining for WebSocket support, correct Pro plan pricing from $99 to $149/month, and configure R2 storage lifecycle policies for automatic PDF cleanup. These changes are essential to achieve the promised "5x faster than competitors" performance targets (<2s P95 latency, 100+ PDFs/min throughput) and fulfill documented API contracts that are currently missing from the implementation.

**Technical Approach**: Implement Cloudflare Durable Objects class to maintain 1-5 warm Chrome browser instances per object with automatic initialization and cleanup. Create PdfGeneratorApi extending Cap'n Web RpcTarget with generatePdf, generateBatch, and ping methods. Add WebSocket endpoint at `/api/rpc` using newWorkersRpcResponse for HTTP Batch and WebSocket upgrade support. Route existing REST API requests through Durable Object infrastructure for transparent performance improvements. Update pricing configuration across specs, frontend, and DodoPayments integration. Configure R2 bucket lifecycle rules with plan-tier tagging for automated PDF deletion (24h free, 7d starter, 30d pro, 90d enterprise).

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 20+
**Primary Dependencies**:
- `capnweb` (Cap'n Web RPC library)
- `@cloudflare/workers-types` (Cloudflare Workers runtime types)
- `@cloudflare/puppeteer` (Browser Rendering API)
- `@supabase/supabase-js` (Database client)
- `hono` (HTTP routing in Workers)
- `zod` (Runtime validation)

**Storage**:
- Cloudflare R2 (PDF files with lifecycle policies)
- Cloudflare KV (rate limiting, caching)
- Cloudflare Durable Objects (stateful browser session pools)
- Supabase PostgreSQL (users, subscriptions, usage tracking - existing)

**Testing**:
- Vitest (unit tests for Durable Object logic, RPC methods)
- Playwright (E2E tests for WebSocket RPC connection)
- k6 or Artillery (load testing for 100 PDFs/min throughput validation)
- Cloudflare Workers local dev with Miniflare (Durable Objects testing)

**Target Platform**: Cloudflare Workers (edge runtime), Cloudflare Durable Objects (stateful compute)

**Project Type**: Monorepo with backend Worker modification (apps/worker/) - no frontend changes for P1 priorities

**Performance Goals**:
- P95 latency <2s for all PDF generation requests
- P50 latency <1.5s for PDF generation
- 100+ PDFs per minute throughput per Durable Object
- 10,000 concurrent PDF generation requests across all Durable Objects
- Average browser session lifetime 5+ minutes before idle cleanup

**Constraints**:
- Cloudflare Workers CPU time limit: 30s per request (50ms for free tier)
- Durable Object storage limit: 1GB per object
- WebSocket message size limit: 1MB per message
- Browser Rendering API concurrency: varies by account tier
- Zero-downtime deployment required (cannot break existing REST API users)
- Backward compatibility: existing SimpleBrowserService must continue working during migration

**Scale/Scope**:
- Target: 10,000 users, 1M PDF generations/month
- 5 new TypeScript files (Durable Object class, RpcTarget implementation, routing logic, R2 lifecycle config, pricing updates)
- 8 modified files (worker index.ts, wrangler.toml, spec.md pricing references, DodoPayments integration)
- 10+ new unit tests, 5 integration tests, 2 E2E tests
- Load testing scenarios for 100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [x] Feature design supports P95 latency <2s for PDF generation (Durable Objects eliminate cold starts, browser session reuse targets 1.5s P50, 2s P95)
- [x] Browser session reuse strategy documented (Durable Objects maintain 1-5 warm Chrome instances, reuse across requests, recycle after 1000 PDFs or 1 hour)
- [x] Chrome instance warming approach defined (Durable Objects initialize browser on first request, keep alive for 5 minutes idle, warm instances ready for subsequent requests)
- [x] Promise pipelining identified for batch operations (Cap'n Web generateBatch method uses Promise.all for concurrent processing, pipelining enables dependent ops in single round trip)
- [x] No blocking operations in critical path (all I/O is async/await, no sync fs operations, browser rendering is async, Durable Object operations are async)

### Security & Authentication (Principle II)
- [x] API keys will be SHA-256 hashed before storage (existing implementation already compliant - no changes needed)
- [x] No plaintext secrets in code or configuration (all secrets in Wrangler secrets for Workers, environment variables for local dev)
- [x] RLS policies defined for all Supabase tables (existing implementation already compliant - no new tables added)
- [x] Rate limiting strategy documented for endpoints (existing rate limiting middleware applies to both REST and WebSocket endpoints - no changes needed)
- [x] CORS configuration specified (existing CORS middleware applies - WebSocket upgrade is same-origin by default)
- [x] Environment variables identified for all secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2 bucket bindings in wrangler.toml)

### Design System Standards (Principle III)
- [x] All colors use OKLCH color space (no RGB/HSL/hex) (N/A - no UI changes in this feature, only backend architecture)
- [x] WCAG AAA contrast compliance verified (7:1 normal, 4.5:1 large) (N/A - no UI changes)
- [x] Elevation system uses OKLCH lightness manipulation (N/A - no UI changes)
- [x] Only shadcn/ui components used (no other UI libraries) (N/A - no UI changes; pricing corrections will be config-only in existing frontend)

### Technology Stack (Principle IV)
- [x] Frontend uses Next.js 15 with App Router (N/A - no frontend changes except pricing config updates)
- [x] Backend uses Cloudflare Workers (✅ Core of this feature - adding Durable Objects to existing Workers infrastructure)
- [x] RPC uses Cap'n Web for PDF generation (✅ Core of this feature - implementing PdfGeneratorApi extending RpcTarget)
- [x] Database uses Supabase with RLS (✅ Existing implementation - no schema changes)
- [x] Payments use DodoPayments (✅ Update Pro plan pricing from $99 to $149 in DodoPayments config)
- [x] Styling uses Tailwind CSS with OKLCH tokens (N/A - no styling changes)

### Code Quality (Principle V)
- [x] TypeScript strict mode enabled (existing tsconfig.json has strict: true - applies to all new code)
- [x] Error handling strategy documented (try-catch in Durable Object methods, browser crash handling with instance recycling, WebSocket disconnect handling with reconnection support)
- [x] No console.log in production code paths (use structured logging, Winston or Pino with JSON output - document in research phase)
- [x] Zod schemas defined for API validation (RPC method parameters validated with Zod, R2 lifecycle config validated, pricing tier validation)
- [x] Browser instance disposal strategy documented (page.close() in finally blocks, browser.close() on instance recycling, Durable Object cleanup on 5min idle timeout)

### Cap'n Web Best Practices (Principle VI)
- [x] Server classes extend RpcTarget (✅ Core requirement: PdfGeneratorApi extends RpcTarget from capnweb)
- [x] Promise pipelining strategy documented (generateBatch uses Promise.all for concurrent job processing, RpcPromise enables client-side pipelining for dependent calls)
- [x] Resource disposal using 'using' keyword or Symbol.dispose() (implement Symbol.dispose() on RpcTarget class, document in research phase if 'using' keyword is available in Workers runtime)
- [x] WebSocket heartbeat mechanism planned (30-second ping/pong interval, close connection on missed heartbeat, client auto-reconnect on disconnect)
- [x] No event loop blocking operations (all browser operations are async, R2 uploads are async, database queries are async)

### User Experience (Principle VII)
- [x] Landing page load time target <2s (LCP) (N/A - no frontend changes in P1 priorities, pricing corrections are config-only)
- [x] Live demo works without authentication (N/A - no demo changes, existing demo unaffected)
- [x] Dark mode support included (N/A - no UI changes)
- [x] Mobile-responsive design (breakpoints: 640/768/1024/1280px) (N/A - no UI changes)
- [x] Lighthouse score target 95+ documented (N/A - backend-only feature, no impact on Lighthouse score)

### Testing & Quality (Principle VIII)
- [x] Unit tests planned for business logic (Durable Object browser pool management, RPC method logic, R2 lifecycle policy application, pricing tier validation)
- [x] Integration tests planned for API endpoints (WebSocket RPC connection establishment, generatePdf via RPC, generateBatch via RPC, REST API routing through Durable Objects)
- [x] E2E tests planned for user flows (WebSocket connection → batch PDF generation → verify throughput, REST API → verify <2s latency with session reuse)
- [x] 80%+ code coverage target for services/models (Durable Object class methods, PdfGeneratorApi methods, routing logic)
- [x] Link validation strategy documented (N/A - no documentation links added, existing link validation applies)

### Documentation (Principle IX)
- [x] API endpoints will be documented in SPEEDSTEIN_API_REFERENCE.md (WebSocket RPC endpoint /api/rpc already documented in original spec - verify it matches implementation)
- [x] Code examples planned for JS, Python, PHP, Ruby (WebSocket RPC examples for JavaScript, HTTP Batch examples for Python/PHP/Ruby - document in quickstart.md)
- [x] README updates identified (Update main README with Durable Objects setup instructions, wrangler.toml configuration for DO bindings)
- [x] Complex logic will have inline comments (Durable Object browser pool allocation algorithm, promise pipelining implementation, R2 lifecycle policy rules)
- [x] Public functions will have JSDoc/TSDoc (All RpcTarget methods, Durable Object public methods, routing functions)

### Deployment & Operations (Principle X)
- [x] Zero-downtime deployment strategy documented (Wrangler gradual rollouts with canary deployment, feature flag for Durable Objects routing, fallback to SimpleBrowserService if DO fails)
- [x] Sentry error tracking configured (existing Sentry integration captures Durable Object errors, WebSocket errors, browser crash events)
- [x] 99.9% uptime monitoring planned (existing UptimeRobot monitors apply, add WebSocket endpoint health check at /api/rpc/health)
- [x] Structured logging for critical operations (log Durable Object lifecycle events, browser instance creation/recycling, WebSocket connections/disconnects, R2 PDF deletions)
- [x] Environment variables for configuration (R2 bucket name, Durable Object namespace, browser pool size limits - document in .env.example)

## Project Structure

### Documentation (this feature)

```text
specs/002-architecture-alignment/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Durable Objects best practices, Cap'n Web patterns
├── data-model.md        # Phase 1 output - Durable Object state structure, RPC interfaces
├── quickstart.md        # Phase 1 output - WebSocket RPC connection guide
├── contracts/           # Phase 1 output - RPC method signatures, Durable Object API
│   ├── durable-object-browser-pool.md
│   ├── pdf-generator-rpc.md
│   ├── r2-lifecycle-config.md
│   └── pricing-tier-updates.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
speedstein/
├── apps/
│   └── worker/                          # Cloudflare Worker backend (MODIFIED)
│       ├── src/
│       │   ├── durable-objects/         # NEW - Durable Object implementations
│       │   │   └── BrowserPoolDO.ts     # NEW - Stateful browser session pool
│       │   ├── rpc/
│       │   │   └── PdfGeneratorApi.ts   # MODIFIED - Extend RpcTarget, add WebSocket support
│       │   ├── services/
│       │   │   ├── pdf.service.ts       # MODIFIED - Route through Durable Objects
│       │   │   ├── browser.service.ts   # MODIFIED - Add DO-aware browser acquisition
│       │   │   └── pricing.service.ts   # MODIFIED - Update Pro plan to $149
│       │   ├── middleware/
│       │   │   ├── websocket.ts         # NEW - WebSocket upgrade handling
│       │   │   └── durable-object-routing.ts  # NEW - Request routing to DOs
│       │   ├── lib/
│       │   │   ├── r2-lifecycle.ts      # NEW - R2 lifecycle policy configuration
│       │   │   └── browser-pool-manager.ts  # NEW - DO stub creation and routing
│       │   ├── index.ts                 # MODIFIED - Add /api/rpc endpoint, DO bindings
│       │   └── types/
│       │       └── durable-objects.ts   # NEW - DO state types, RPC interfaces
│       ├── wrangler.toml                # MODIFIED - Add DO bindings, R2 lifecycle config
│       ├── test/
│       │   ├── durable-objects/         # NEW - DO unit tests
│       │   │   └── BrowserPoolDO.test.ts
│       │   ├── rpc/                     # NEW - RPC integration tests
│       │   │   └── PdfGeneratorApi.test.ts
│       │   └── e2e/                     # NEW - E2E tests
│       │       ├── websocket-rpc.spec.ts
│       │       └── performance.spec.ts
│       └── package.json                 # MODIFIED - No new dependencies (capnweb already installed)
│
├── specs/
│   ├── 001-pdf-api-platform/
│   │   └── spec.md                      # MODIFIED - Update Pro plan pricing references
│   └── 002-architecture-alignment/      # THIS FEATURE
│       └── [documented above]
│
├── docs/
│   └── SPEEDSTEIN_API_REFERENCE.md      # MODIFIED - Add WebSocket RPC examples
│
└── README.md                            # MODIFIED - Add Durable Objects setup instructions
```

**Structure Decision**: Modified existing monorepo structure (apps/worker/) to add Durable Objects support. Created new `durable-objects/` directory for DO implementations, added RPC and middleware layers for WebSocket support. No frontend changes required for P1 priorities - pricing corrections are configuration updates only. This approach minimizes disruption while adding critical architectural components.

## Complexity Tracking

**No constitutional violations requiring justification.**

All complexity is mandated by original technical specifications:
- Durable Objects are REQUIRED per original SPEEDSTEIN_TECHNICAL_SPEC.md architecture (session reuse mandate)
- Cap'n Web RPC is MANDATORY per Principle VI and original API documentation (WebSocket endpoint documented but not implemented)
- Performance targets (<2s P95) are NON-NEGOTIABLE per Principle I
- Pricing correction ($149 Pro plan) restores consistency with original SPEEDSTEIN_TECHNICAL_SPEC.md

## Research Phase (Phase 0)

### Objectives
- Validate Cloudflare Durable Objects can maintain long-lived browser processes (5+ minutes)
- Research Cap'n Web RpcTarget implementation patterns for Workers runtime
- Determine R2 lifecycle policy configuration syntax and tag-based rules
- Identify WebSocket upgrade handling in Cloudflare Workers with Hono
- Research promise pipelining patterns for batch operations in Cap'n Web
- Validate Browser Rendering API behavior within Durable Object context

### Key Questions to Answer
1. **Durable Objects + Browser Rendering**: Can Chrome browser instances be maintained across Durable Object requests? What are memory limits? How to handle browser crashes within DO context?
2. **Cap'n Web RpcTarget**: What is the exact syntax for extending RpcTarget? How to expose methods via RPC? How to handle async methods returning Promises?
3. **WebSocket Upgrade**: How does newWorkersRpcResponse handle WebSocket upgrade in Workers? Is Hono compatible with WebSocket routing?
4. **R2 Lifecycle Policies**: Does R2 support tag-based lifecycle rules? What is the syntax for configuring lifecycle policies in wrangler.toml vs. API calls?
5. **Promise Pipelining**: How do RpcPromise types enable pipelining? What is the client-side syntax for pipelined calls? How to return Promise types from RPC methods?
6. **Durable Object Routing**: What is the pattern for routing requests to DOs based on user ID? How to create DO stubs? How to handle DO migrations?
7. **Pricing Updates**: How to update DodoPayments plan pricing without disrupting existing subscribers? Can we grandfather $99 users or force migration?

### Deliverable
[research.md](./research.md) containing:
- Durable Objects + Browser Rendering integration patterns with code examples
- Cap'n Web RpcTarget implementation template for Workers
- R2 lifecycle policy configuration guide
- WebSocket upgrade handling in Workers with newWorkersRpcResponse
- Promise pipelining client/server examples
- Durable Object routing strategies (user ID hash vs. round-robin)
- DodoPayments pricing update procedure

## Design Phase (Phase 1)

### Objectives
- Define Durable Object state structure (browser instances, queue, metrics)
- Design RPC method signatures (generatePdf, generateBatch, ping)
- Specify REST→DO routing algorithm (user ID hash or stub naming)
- Design R2 lifecycle policy rules (tag format, TTL periods)
- Define pricing tier entity structure (plan, price, quota, retention)

### Key Deliverables

#### 1. Data Model ([data-model.md](./data-model.md))

**Durable Object State:**
```typescript
interface BrowserPoolState {
  objectId: string;
  browserInstances: BrowserInstance[];
  requestQueue: QueuedRequest[];
  createdAt: Date;
  lastActivityAt: Date;
  totalPdfsGenerated: number;
  currentLoad: number;
}

interface BrowserInstance {
  instanceId: string;
  browserHandle: any; // @cloudflare/puppeteer Browser
  createdAt: Date;
  pdfsGenerated: number;
  lastUsedAt: Date;
  memoryUsage: number; // estimated in MB
  status: 'active' | 'idle' | 'crashed';
}

interface QueuedRequest {
  requestId: string;
  userId: string;
  html: string;
  options: PdfOptions;
  timestamp: Date;
  priority: number;
}
```

**RPC Session Metadata:**
```typescript
interface RpcSessionMetadata {
  sessionId: string;
  userId: string | null; // null for unauthenticated demo
  connectionType: 'http-batch' | 'websocket';
  startedAt: Date;
  lastHeartbeat: Date;
  requestCount: number;
}
```

**Pricing Tier Configuration:**
```typescript
interface PricingTierConfig {
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  monthlyPrice: number; // 0, 29, 149, 499
  pdfQuota: number; // 100, 5000, 50000, 500000
  retentionDays: number; // 1, 7, 30, 90
  rateLimitPerMinute: number; // 10, 50, 200, 1000
}
```

**R2 Lifecycle Policy:**
```typescript
interface R2LifecycleRule {
  ruleId: string;
  filter: {
    tags: { key: 'tier', value: 'free' | 'starter' | 'pro' | 'enterprise' };
  };
  expiration: {
    days: number; // 1, 7, 30, 90
  };
  enabled: boolean;
}
```

#### 2. API Contracts ([contracts/](./contracts/))

**[contracts/pdf-generator-rpc.md](./contracts/pdf-generator-rpc.md)**
```typescript
// Server-side RpcTarget implementation
class PdfGeneratorApi extends RpcTarget {
  async generatePdf(html: string, options: PdfOptions): Promise<PdfResult>;
  async generateBatch(jobs: PdfJob[]): Promise<PdfResult[]>;
  async ping(): Promise<string>; // Returns "pong"
}

// Client-side usage (JavaScript/TypeScript)
import { newWebSocketRpcSession } from 'capnweb';

const api = newWebSocketRpcSession('wss://api.speedstein.com/api/rpc', {
  headers: { 'Authorization': 'Bearer sk_live_...' }
});

// Single PDF
const result = await api.generatePdf('<html>...</html>', { format: 'A4' });

// Batch with promise pipelining
const jobs = [...];
const results = await api.generateBatch(jobs);

// Cleanup
api[Symbol.dispose]();
```

**[contracts/durable-object-browser-pool.md](./contracts/durable-object-browser-pool.md)**
```typescript
// Durable Object class
export class BrowserPoolDO {
  constructor(state: DurableObjectState, env: Env);

  // HTTP handler for internal routing
  async fetch(request: Request): Promise<Response>;

  // Internal methods
  private async acquireBrowser(): Promise<Browser>;
  private async releaseBrowser(browser: Browser): Promise<void>;
  private async recycleBrowser(instanceId: string): Promise<void>;
  private async cleanup(): Promise<void>;
}

// Worker → DO routing
const doId = env.BROWSER_POOL_DO.idFromName(userId); // or newUniqueId()
const doStub = env.BROWSER_POOL_DO.get(doId);
const response = await doStub.fetch(request);
```

**[contracts/r2-lifecycle-config.md](./contracts/r2-lifecycle-config.md)**
```typescript
// R2 lifecycle configuration (wrangler.toml)
[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "speedstein-pdfs"
preview_bucket_name = "speedstein-pdfs-preview"

// Lifecycle rules (set via API or dashboard)
const lifecycleRules = [
  {
    id: "free-tier-cleanup",
    filter: { tags: { tier: "free" } },
    expiration: { days: 1 },
    enabled: true
  },
  {
    id: "starter-tier-cleanup",
    filter: { tags: { tier: "starter" } },
    expiration: { days: 7 },
    enabled: true
  },
  {
    id: "pro-tier-cleanup",
    filter: { tags: { tier: "pro" } },
    expiration: { days: 30 },
    enabled: true
  },
  {
    id: "enterprise-tier-cleanup",
    filter: { tags: { tier: "enterprise" } },
    expiration: { days: 90 },
    enabled: true
  }
];

// Upload with tier tag
await env.PDF_BUCKET.put(key, pdfBuffer, {
  customMetadata: { tier: userTier }
});
```

**[contracts/pricing-tier-updates.md](./contracts/pricing-tier-updates.md)**
```typescript
// Updated pricing configuration
const PRICING_TIERS = {
  free: { price: 0, quota: 100, retention: 1, rateLimit: 10 },
  starter: { price: 29, quota: 5000, retention: 7, rateLimit: 50 },
  pro: { price: 149, quota: 50000, retention: 30, rateLimit: 200 }, // CHANGED from $99
  enterprise: { price: 499, quota: 500000, retention: 90, rateLimit: 1000 }
};

// Files to update:
// - specs/001-pdf-api-platform/spec.md (FR-036 pricing reference)
// - apps/web/src/app/(marketing)/pricing/page.tsx (display pricing)
// - apps/worker/src/services/pricing.service.ts (validation logic)
// - DodoPayments dashboard: Update Pro plan product pricing to $149.00
```

#### 3. Quickstart Guide ([quickstart.md](./quickstart.md))

```markdown
# WebSocket RPC Quickstart Guide

## Prerequisites
- Node.js 18+
- Speedstein API key (get from dashboard)

## Installation
npm install capnweb

## Connect to WebSocket RPC
\`\`\`javascript
import { newWebSocketRpcSession } from 'capnweb';

const api = newWebSocketRpcSession('wss://api.speedstein.com/api/rpc', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

// Generate single PDF
const result = await api.generatePdf('<html><h1>Hello</h1></html>', {
  format: 'A4',
  printBackground: true
});

console.log(result.pdf_url);

// Batch generation (100 PDFs in <60 seconds)
const jobs = Array.from({ length: 100 }, (_, i) => ({
  html: `<html><h1>Invoice #${i}</h1></html>`,
  options: { format: 'A4' }
}));

const results = await api.generateBatch(jobs);
console.log(`Generated ${results.length} PDFs`);

// Cleanup
api[Symbol.dispose]();
\`\`\`

## REST API (Alternative)
\`\`\`bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><h1>Hello</h1></html>","options":{"format":"A4"}}'
\`\`\`

## Performance Comparison
- **REST API**: 1.5-2.5s per PDF (with Durable Objects session reuse)
- **WebSocket RPC**: 1-1.5s per PDF + 100+ PDFs/min batch throughput
```

## Stop and Report

**Implementation planning complete** ✅

### Deliverables Created

1. **[plan.md](./plan.md)** - Comprehensive implementation plan (this file)
2. **Technical Context** - Complete with all dependencies, constraints, and performance goals
3. **Constitution Check** - All 10 constitutional principles validated with justifications
4. **Project Structure** - Detailed file-level breakdown of modifications and additions
5. **Complexity Tracking** - No violations (all complexity is constitutionally mandated)

### Research Phase Ready

**[research.md](./research.md)** will address 7 critical unknowns:
1. Durable Objects + Browser Rendering integration patterns
2. Cap'n Web RpcTarget implementation for Workers
3. R2 lifecycle policy configuration syntax
4. WebSocket upgrade handling with newWorkersRpcResponse
5. Promise pipelining patterns for batch operations
6. Durable Object routing strategies
7. DodoPayments pricing update procedure

### Design Phase Ready

Phase 1 will generate:
- **[data-model.md](./data-model.md)** - Durable Object state, RPC interfaces, pricing configuration
- **[contracts/](./contracts/)** - 4 API contract documents
- **[quickstart.md](./quickstart.md)** - WebSocket RPC connection guide

### Next Steps

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Proceed with Phase 0 research to validate Durable Objects + Browser Rendering
3. Implement Durable Objects browser pool (T001-T010)
4. Implement Cap'n Web RPC endpoint (T011-T020)
5. Update pricing configuration (T021-T025)
6. Configure R2 lifecycle policies (T026-T030)
7. Load test to validate 100 PDFs/min throughput (T031-T035)

**Branch**: `002-architecture-alignment`
**Plan File**: `C:\coding\speedstein\specs\002-architecture-alignment\plan.md`
**Status**: ✅ Ready for task generation
