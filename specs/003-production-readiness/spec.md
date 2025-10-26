# Feature Specification: Production Readiness - Critical Blockers Fix

**Feature Branch**: `003-production-readiness`
**Created**: October 26, 2025
**Status**: Draft
**Input**: Fix critical production blockers: database schema creation, R2 storage integration, crypto bug fixes, Enterprise quota correction, and frontend initialization for MVP launch

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Foundation Setup (Priority: P1)

As a backend developer, I need a fully functional Supabase database with all required tables, RLS policies, and indexes so that API endpoints can persist user data, API keys, subscriptions, and usage records.

**Why this priority**: **CRITICAL BLOCKER** - The entire authentication, authorization, quota tracking, and subscription system depends on these database tables. Without this, the backend API cannot function in production. Currently, AuthService and QuotaService are referencing non-existent tables, making the API completely non-functional for real users.

**Independent Test**: Can be fully tested by running the migration script, inserting sample data (test user, API key, subscription), and querying the tables to verify RLS policies and constraints work correctly. Success means all 4 core tables exist with proper relationships and security.

**Acceptance Scenarios**:

1. **Given** Supabase project is initialized, **When** I run the migration script, **Then** all 4 tables (users, api_keys, subscriptions, usage_records) are created with correct schemas
2. **Given** tables are created, **When** I insert a test user record, **Then** the user record is created with UUID primary key and timestamps
3. **Given** a user exists, **When** I try to query another user's API keys without proper RLS policy, **Then** the query returns no results (RLS protection working)
4. **Given** RLS is enabled, **When** I query my own API keys with proper authentication, **Then** I receive my API keys successfully
5. **Given** tables exist, **When** I create an API key with a hashed key, **Then** the key_hash index allows fast lookups by hash
6. **Given** usage_records table exists, **When** I insert 1000 usage records, **Then** the composite index (user_id, created_at) enables fast quota queries

---

### User Story 2 - R2 Storage Integration (Priority: P1)

As an API consumer, I want my generated PDFs to be automatically uploaded to R2 storage with public CDN URLs so that I can access, download, and share the PDFs without storing large binary data in API responses.

**Why this priority**: **CRITICAL BLOCKER** - Currently, the API returns raw PDF buffers in JSON responses (inefficient, breaks for large PDFs, wastes bandwidth). The specification clearly requires R2 storage with tier-based retention. Without this, the product is not production-ready and violates the architecture specification.

**Independent Test**: Can be fully tested by calling the `/api/generate` endpoint with sample HTML, verifying the response contains a `pdf_url` field (not `pdfBuffer`), then fetching the URL to confirm the PDF is accessible. Success means PDFs are stored in R2 with correct tier tags for lifecycle policies.

**Acceptance Scenarios**:

1. **Given** a Free tier user generates a PDF, **When** the generation completes, **Then** the PDF is uploaded to R2 with tier tag "free" and expiration set to 1 day
2. **Given** a Pro tier user generates a PDF, **When** the generation completes, **Then** the response contains `pdf_url` pointing to CDN (e.g., "https://cdn.speedstein.com/pdfs/abc123.pdf")
3. **Given** a PDF URL is returned, **When** I fetch the URL, **Then** I receive the PDF file with correct Content-Type header
4. **Given** R2 lifecycle policies are applied, **When** a Free tier PDF is 25 hours old, **Then** the PDF is automatically deleted by R2
5. **Given** an Enterprise tier user generates a PDF, **When** the PDF is uploaded, **Then** the tier tag is "enterprise" and retention is 90 days
6. **Given** BrowserPoolDO generates a PDF, **When** upload fails, **Then** the system falls back to returning the buffer with a warning log

---

### User Story 3 - API Key Hashing Fix (Priority: P1)

As a platform operator, I need API key hashing to work correctly using the async `crypto.subtle.digest()` API so that API keys are securely stored and can be validated for authentication.

**Why this priority**: **CRITICAL BLOCKER** - The current implementation uses `crypto.subtle.digestSync()` which **does not exist** in the Web Crypto API. This causes runtime errors whenever the system tries to hash an API key, completely breaking API key creation and validation. This is a showstopper bug.

**Independent Test**: Can be fully tested by calling `hashApiKey('sk_test_abc123')` and verifying it returns a SHA-256 hash without errors. Then verify that the hash can be used to query the api_keys table successfully.

**Acceptance Scenarios**:

1. **Given** the crypto module is imported, **When** I call `hashApiKey('sk_test_abc123')`, **Then** it returns a 64-character hex string (SHA-256 hash)
2. **Given** `hashApiKey()` is called, **When** the function executes, **Then** it uses `await crypto.subtle.digest()` (async) not `digestSync()`
3. **Given** a user creates an API key, **When** the key is stored, **Then** only the hash is persisted to the database (never plaintext)
4. **Given** an API request includes an API key header, **When** AuthService validates it, **Then** the key is hashed and compared to stored hashes successfully
5. **Given** the same API key is hashed twice, **When** both hashes are compared, **Then** they are identical (deterministic hashing)

---

### User Story 4 - Pricing Configuration Correction (Priority: P1)

As a subscription system, I need the Enterprise plan quota to be correctly set to 500,000 PDFs/month (not 200,000) so that pricing matches the specification and customer expectations.

**Why this priority**: **CRITICAL BUG** - The specification defines Enterprise as 500K PDFs/month, but the implementation has 200K. This is a contractual issue that could lead to incorrect billing and customer disputes. Must be fixed before any Enterprise customers sign up.

**Independent Test**: Can be fully tested by reading the pricing-config.ts file and verifying `PRICING_TIERS.enterprise.quota === 500000`. Then test quota checks with an Enterprise user to ensure they can generate up to 500K PDFs.

**Acceptance Scenarios**:

1. **Given** pricing-config.ts is updated, **When** I read the Enterprise tier config, **Then** `quota` field equals 500000 (not 200000)
2. **Given** an Enterprise user has generated 200,001 PDFs, **When** they request another PDF, **Then** the request succeeds (not quota exceeded)
3. **Given** an Enterprise user has generated 500,000 PDFs, **When** they request another PDF, **Then** the request is rejected with QuotaExceededError
4. **Given** QuotaService checks quota, **When** it calculates remaining quota for Enterprise, **Then** it uses 500000 as the base quota

---

### User Story 5 - Frontend Foundation Setup (Priority: P2)

As a new user, I need a landing page where I can learn about Speedstein, see pricing, sign up for an account, and access a dashboard to manage my API keys so that I can start using the PDF generation API.

**Why this priority**: **HIGH PRIORITY** - While the backend is functional, there's no user-facing interface. Users cannot sign up, create API keys, or view usage without a frontend. This is required for MVP launch but is not blocking backend development/testing.

**Independent Test**: Can be fully tested by navigating to the landing page, clicking "Sign Up", completing the registration flow, and seeing the dashboard with an empty API keys section. Success means a minimal but functional UI exists.

**Acceptance Scenarios**:

1. **Given** Next.js 15 is initialized, **When** I navigate to the root URL, **Then** I see a landing page with hero section, features, and pricing table
2. **Given** the landing page is loaded, **When** I click "Get Started", **Then** I'm redirected to the sign-up page with Supabase Auth
3. **Given** I complete the sign-up form, **When** I submit valid credentials, **Then** a user record is created in Supabase and I'm redirected to the dashboard
4. **Given** I'm logged in, **When** I navigate to /dashboard, **Then** I see sections for "API Keys", "Usage", and "Subscription"
5. **Given** the dashboard is loaded, **When** I click "Create API Key", **Then** a modal opens with a form to name the key
6. **Given** I submit the API key form, **When** the key is created, **Then** I see the full key once (sk_live_...) and it's stored hashed in the database
7. **Given** I'm on the dashboard, **When** I view the Usage section, **Then** I see my current quota, usage count, and percentage used

---

### User Story 6 - OKLCH Design System Implementation (Priority: P2)

As a designer/developer, I need a consistent OKLCH-based design system with dark mode support so that the frontend has perceptually uniform colors and meets WCAG AAA accessibility standards.

**Why this priority**: **HIGH PRIORITY** - The specification mandates OKLCH colors (non-negotiable per constitution). This ensures accessibility compliance and brand consistency. Required before public launch, but not blocking MVP development.

**Independent Test**: Can be fully tested by inspecting computed CSS variables and verifying all colors use OKLCH format (e.g., `oklch(0.5 0.2 180)`). Toggle dark mode and verify colors adapt correctly with maintained contrast ratios.

**Acceptance Scenarios**:

1. **Given** Tailwind CSS is configured, **When** I inspect CSS custom properties, **Then** all color tokens use OKLCH format (not hex, RGB, or HSL)
2. **Given** OKLCH colors are defined, **When** I measure contrast between text and background, **Then** all combinations meet WCAG AAA standards (7:1 ratio)
3. **Given** the design system is implemented, **When** I toggle dark mode, **Then** all colors adapt using OKLCH lightness manipulation
4. **Given** shadcn/ui is installed, **When** I render a Button component, **Then** it uses OKLCH color tokens from the design system
5. **Given** the landing page is loaded, **When** I toggle dark mode, **Then** the transition is smooth and all text remains readable

---

### User Story 7 - Browser Pool Performance Validation (Priority: P3)

As a platform operator, I need to validate that the Durable Objects browser pool can handle the performance targets (100 PDFs/min, <2s P95 latency) so that I can confidently claim these benchmarks in marketing materials.

**Why this priority**: **MEDIUM PRIORITY** - The architecture is built for these targets, but they haven't been validated under load. This is important for SLA commitments but not blocking since the architecture supports it.

**Independent Test**: Can be fully tested by running a load test script that generates 100 PDFs over 60 seconds, measures latency for each, and calculates P95. Success means P95 latency is under 2 seconds.

**Acceptance Scenarios**:

1. **Given** the BrowserPoolDO is deployed, **When** I send 100 PDF generation requests over 60 seconds, **Then** all requests complete successfully
2. **Given** latency is measured for all requests, **When** I calculate P95, **Then** it is less than 2000ms
3. **Given** the browser pool is under load, **When** I check browser instance count, **Then** it scales from 1 to 5 instances as needed
4. **Given** a browser has generated 1000 PDFs, **When** the next request arrives, **Then** the browser is recycled and a new instance is created
5. **Given** all browsers are busy, **When** a request waits for 5 seconds, **Then** the oldest browser is recycled and the request proceeds

---

### Edge Cases

- **What happens when R2 upload fails?** System should fall back to returning the PDF buffer with a logged error, allowing the user to still receive their PDF while alerting operators to the storage issue.
- **What happens when Supabase is unreachable during API key validation?** System should fail closed (reject request) with a 503 Service Unavailable error, not fail open (allow without auth).
- **What happens when a user's subscription expires during a PDF generation request?** The request should complete (quota was checked at start), but subsequent requests should be blocked.
- **What happens when R2 lifecycle policy deletes a PDF while a user is accessing it?** User receives a 404 from CDN. Frontend should display a friendly "PDF expired" message based on tier.
- **What happens when Enterprise quota is updated from 200K to 500K mid-month?** Existing usage records remain unchanged; new quota applies immediately for future requests.
- **What happens when crypto.subtle.digest() fails (unsupported environment)?** System should throw a clear error during startup (not at runtime) indicating Web Crypto API is required.
- **What happens when Next.js frontend is deployed but backend is down?** Landing page should still load (static). Dashboard should show "API Unavailable" banner instead of crashing.
- **What happens when a user toggles dark mode rapidly?** OKLCH color transitions should remain smooth without flickering or layout shifts.

## Requirements *(mandatory)*

### Functional Requirements

#### Database (P1 - Critical Blocker)

- **FR-001**: System MUST create a `users` table with fields: id (UUID PK), email (unique), name, created_at, updated_at
- **FR-002**: System MUST create an `api_keys` table with fields: id (UUID PK), user_id (FK), key_hash (unique), key_prefix, name, is_active, created_at, last_used_at
- **FR-003**: System MUST create a `subscriptions` table with fields: id (UUID PK), user_id (FK), plan_id, status, current_period_start, current_period_end, dodo_subscription_id (unique)
- **FR-004**: System MUST create a `usage_records` table with fields: id (UUID PK), user_id (FK), api_key_id (FK), pdf_size, generation_time, created_at
- **FR-005**: System MUST enable Row Level Security (RLS) on all 4 tables
- **FR-006**: System MUST create an index on `api_keys.key_hash` for fast authentication lookups
- **FR-007**: System MUST create an index on `api_keys.user_id` for user key listing
- **FR-008**: System MUST create an index on `subscriptions.user_id` for subscription queries
- **FR-009**: System MUST create a composite index on `usage_records(user_id, created_at DESC)` for quota queries
- **FR-010**: System MUST configure RLS policies so users can only access their own records
- **FR-011**: System MUST support foreign key cascades (DELETE user → DELETE api_keys, subscriptions, usage_records)

#### R2 Storage (P1 - Critical Blocker)

- **FR-012**: System MUST upload generated PDFs to R2 after generation (not return buffer)
- **FR-013**: System MUST return a public CDN URL in the response (field: `pdf_url`)
- **FR-014**: System MUST tag uploaded PDFs with tier metadata ("free", "starter", "pro", "enterprise")
- **FR-015**: System MUST set R2 lifecycle policies for automatic deletion: Free (1 day), Starter (7 days), Pro (30 days), Enterprise (90 days)
- **FR-016**: System MUST generate unique PDF filenames using UUID or timestamp-based naming
- **FR-017**: System MUST include metadata on R2 objects: userId, apiKeyId, requestId, uploadedAt, expiresAt
- **FR-018**: System MUST handle R2 upload failures gracefully (fallback to buffer response + error log)
- **FR-019**: System MUST apply lifecycle rules to the R2 bucket via Cloudflare dashboard or API

#### Crypto Bug Fix (P1 - Critical Blocker)

- **FR-020**: System MUST use async `crypto.subtle.digest('SHA-256', data)` for API key hashing (not digestSync)
- **FR-021**: System MUST await the digest() call since it returns a Promise
- **FR-022**: System MUST update all callers of `hashApiKey()` to use async/await syntax
- **FR-023**: System MUST hash API keys before storing in database (never store plaintext)
- **FR-024**: System MUST hash incoming API keys during validation for comparison

#### Pricing Correction (P1 - Critical Bug)

- **FR-025**: System MUST set Enterprise plan quota to 500,000 PDFs/month (not 200,000)
- **FR-026**: System MUST update `PRICING_TIERS.enterprise.quota` in pricing-config.ts
- **FR-027**: System MUST validate quota checks use the correct 500K limit for Enterprise users
- **FR-028**: System MUST document the pricing correction in CHANGELOG or migration notes

#### Frontend Foundation (P2 - High Priority)

- **FR-029**: System MUST initialize a Next.js 15 project with App Router in `apps/web/`
- **FR-030**: System MUST install and configure shadcn/ui component library
- **FR-031**: System MUST configure Tailwind CSS with custom OKLCH color tokens
- **FR-032**: System MUST create a landing page with sections: Hero, Features, Pricing, Footer
- **FR-033**: System MUST implement Supabase Auth for sign-up and login
- **FR-034**: System MUST create a /dashboard route protected by authentication
- **FR-035**: System MUST display API key management UI (list keys, create key, delete key)
- **FR-036**: System MUST display usage statistics (quota, used, remaining, percentage)
- **FR-037**: System MUST display subscription information (plan, status, renewal date)
- **FR-038**: System MUST show the full API key only once after creation (then show prefix only)
- **FR-039**: System MUST provide a "Copy to Clipboard" button for new API keys
- **FR-040**: System MUST validate all form inputs (email format, password strength)

#### OKLCH Design System (P2 - High Priority)

- **FR-041**: System MUST use OKLCH color space exclusively (no RGB, HSL, or hex colors)
- **FR-042**: System MUST define color tokens in Tailwind config using OKLCH format
- **FR-043**: System MUST ensure all text/background combinations meet WCAG AAA contrast (7:1 ratio)
- **FR-044**: System MUST implement dark mode using OKLCH lightness manipulation
- **FR-045**: System MUST provide a theme toggle (light/dark mode switch)
- **FR-046**: System MUST persist theme preference in localStorage
- **FR-047**: System MUST apply theme consistently across all pages and components
- **FR-048**: System MUST use shadcn/ui components styled with OKLCH tokens

#### Performance Validation (P3 - Medium Priority)

- **FR-049**: System MUST support 100 PDFs/minute throughput under load testing
- **FR-050**: System MUST maintain P95 latency under 2 seconds for PDF generation
- **FR-051**: System MUST scale browser pool from 1 to 5 instances based on load
- **FR-052**: System MUST recycle browsers after 1000 PDFs or 1 hour (whichever first)
- **FR-053**: System MUST log performance metrics (latency, throughput, browser count)

### Key Entities

- **User**: Represents a registered account holder with email, name, and timestamps. Primary entity for authentication and authorization.
- **API Key**: Represents a hashed authentication credential belonging to a user. Contains key_hash (SHA-256), key_prefix (for display), name, and active status.
- **Subscription**: Represents a user's current pricing plan with tier, status, billing period, and DodoPayments subscription ID.
- **Usage Record**: Represents a single PDF generation event with user_id, api_key_id, pdf_size, generation_time, and timestamp. Used for quota tracking.
- **PDF Object (R2)**: Represents a stored PDF file with URL, tier tag, expiration date, and metadata (userId, requestId).
- **Pricing Tier**: Configuration object defining plan_id, quota, price, retention days (Free: 100/1d, Starter: 5K/7d, Pro: 50K/30d, Enterprise: 500K/90d).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Database migration script executes successfully and creates all 4 tables with RLS enabled
- **SC-002**: API key can be created, hashed, stored, and validated without runtime errors
- **SC-003**: PDF generation returns a `pdf_url` field (not `pdfBuffer`) and the URL is accessible
- **SC-004**: Free tier PDFs are automatically deleted after 1 day via R2 lifecycle policy
- **SC-005**: Enterprise user can generate 500,000 PDFs in a month (not blocked at 200K)
- **SC-006**: Landing page loads in under 2 seconds with Lighthouse score 95+
- **SC-007**: User can sign up, log in, create an API key, and make a successful PDF generation request end-to-end
- **SC-008**: All frontend text/background combinations pass WCAG AAA contrast checker (7:1 ratio)
- **SC-009**: Dark mode toggle works without page reload and persists across sessions
- **SC-010**: Load test of 100 PDFs over 60 seconds shows P95 latency under 2000ms
- **SC-011**: All TypeScript compilation errors in new code are resolved (tsc --noEmit passes)
- **SC-012**: No runtime errors when calling `hashApiKey()` with test input

### Quality Gates

- **QG-001**: Migration script tested on clean Supabase instance (no leftover state)
- **QG-002**: R2 upload integration tested with all 4 tier tags (free, starter, pro, enterprise)
- **QG-003**: Crypto fix verified by unit test covering async digest() call
- **QG-004**: Pricing config verified by reading PRICING_TIERS.enterprise.quota value
- **QG-005**: Frontend builds without errors (`npm run build` succeeds)
- **QG-006**: OKLCH colors validated using browser DevTools (computed styles show oklch() format)
- **QG-007**: Dashboard tested with sample data (test user with 5 API keys, 1000 usage records)
- **QG-008**: End-to-end flow tested: Sign up → Create API key → Generate PDF → Access URL
- **QG-009**: RLS policies tested by attempting cross-user data access (should fail)
- **QG-010**: Performance baseline established (record current throughput/latency for comparison)

### Technical Validation

- **TV-001**: All database indexes improve query performance (measured via EXPLAIN ANALYZE)
- **TV-002**: R2 lifecycle policies appear in Cloudflare dashboard under bucket settings
- **TV-003**: `crypto.subtle.digest()` returns ArrayBuffer (verified by typeof check)
- **TV-004**: PDF URLs follow CDN format (e.g., "https://cdn.speedstein.com/pdfs/[uuid].pdf")
- **TV-005**: API response time for authenticated requests under 200ms (excluding PDF generation)
- **TV-006**: Frontend bundle size under 500KB (main.js + CSS)
- **TV-007**: Dark mode transition completes in under 300ms
- **TV-008**: Browser pool scales to 5 instances under load (verified by DO logs)
- **TV-009**: No memory leaks in browser instances (tested over 1000 PDF generations)
- **TV-010**: shadcn/ui components render correctly with OKLCH colors (manual inspection)

## Assumptions & Dependencies

### Assumptions

1. Supabase project is already created and accessible (URL and service role key in environment)
2. R2 bucket named "speedstein-pdfs" already exists in Cloudflare
3. Cloudflare Workers Browser Rendering API is enabled for the account
4. Users have modern browsers supporting Web Crypto API (Chrome 60+, Firefox 57+)
5. CDN domain (cdn.speedstein.com) is configured to serve R2 bucket content publicly
6. DodoPayments integration is deferred to future feature (not blocking MVP)
7. Current TypeScript errors in logger.ts, pdf-generator.ts are non-blocking (files unused)
8. Existing BrowserPoolDO and PdfService implementations are functional (no rewrites needed)

### Dependencies

1. **Supabase**: Database hosting, Row Level Security, Authentication
2. **Cloudflare R2**: Object storage for PDFs with lifecycle policies
3. **Cloudflare Workers**: Serverless compute for API and Durable Objects
4. **Next.js 15**: Frontend framework with App Router
5. **shadcn/ui**: UI component library
6. **Tailwind CSS**: Utility-first CSS framework
7. **Zod**: Schema validation (already in use)
8. **@cloudflare/puppeteer**: Browser automation for PDF generation
9. **Web Crypto API**: SHA-256 hashing for API keys

### Blockers

1. **Database tables must be created before API can handle real users** (P1)
2. **Crypto bug must be fixed before API keys can be created/validated** (P1)
3. **R2 integration must be completed before PDFs can be stored persistently** (P1)
4. **Frontend cannot be built until Next.js project is initialized** (P2)
5. **OKLCH design system must be defined before shadcn/ui can be styled** (P2)

### External Constraints

1. Cloudflare R2 lifecycle policies require Cloudflare dashboard access or Wrangler CLI
2. Supabase migration requires direct database access (not via REST API)
3. OKLCH color support requires modern browsers (Safari 15.4+, Chrome 111+)
4. Next.js 15 requires Node.js 18.17 or higher
5. Performance targets (100 PDFs/min) depend on Cloudflare Workers quotas/limits

## Risk Assessment

### High Risk

- **Database migration failure**: If migration script has errors, entire backend is blocked. Mitigation: Test on local Supabase instance first.
- **R2 upload reliability**: If R2 has downtime, PDF generation breaks. Mitigation: Implement fallback to buffer response.
- **Crypto API unavailability**: If Web Crypto API is missing (old browser/Node.js), system crashes. Mitigation: Add startup check for `crypto.subtle`.

### Medium Risk

- **Frontend build complexity**: Next.js 15 is relatively new, may have undocumented issues. Mitigation: Follow official docs closely, use stable releases.
- **OKLCH browser support**: Safari 15.4+ required (older browsers fail). Mitigation: Provide fallback RGB colors via PostCSS.
- **Performance targets unmet**: Architecture may not hit 100 PDFs/min. Mitigation: Load test early, optimize or revise targets.

### Low Risk

- **Pricing config error**: Simple constant change, unlikely to fail. Mitigation: Code review + unit test.
- **Dark mode toggle**: Well-documented pattern, low complexity. Mitigation: Use Tailwind's built-in dark mode support.

## Out of Scope

The following are explicitly **NOT** part of this feature:

1. **DodoPayments integration**: Deferred to future feature (subscription webhooks, billing, invoices)
2. **Live demo with Monaco Editor**: Deferred to future feature (real-time PDF preview)
3. **Testing infrastructure**: Unit/integration/E2E tests deferred (minimal tests only)
4. **Monitoring and observability**: Sentry, uptime monitoring, analytics dashboards deferred
5. **Advanced features**: Webhooks, template library, custom fonts, watermarks, PDF merging
6. **Logo fixes in pre-existing code**: logger.ts (15 errors), pdf-generator.ts (6 errors) - non-blocking
7. **Performance optimization**: Beyond basic load testing, advanced optimizations deferred
8. **Documentation**: API reference docs, code examples deferred (minimal inline comments only)
9. **Security audit**: Comprehensive security review deferred (basic best practices applied)
10. **Mobile responsive design**: Desktop-first; mobile optimization deferred

## Technical Notes

### Database Migration Strategy

Use Supabase CLI to run migration:
```bash
supabase db reset
supabase db push
```

Alternatively, execute SQL directly via Supabase dashboard SQL editor.

### R2 Lifecycle Policy Application

Cannot be applied via Wrangler TOML. Must use Cloudflare dashboard:
1. Navigate to R2 bucket
2. Settings → Lifecycle Policies
3. Add rules matching tier tags (free=1d, starter=7d, pro=30d, enterprise=90d)

### Crypto Fix Pattern

Before (BROKEN):
```typescript
const hashBuffer = crypto.subtle.digestSync('SHA-256', data);
```

After (CORRECT):
```typescript
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

All functions calling `hashApiKey()` must be async.

### R2 Upload Integration Point

In `BrowserPoolDO.ts`, after `page.pdf()`:
```typescript
const pdfBuffer = await page.pdf(options);

// NEW: Upload to R2
const fileName = `${crypto.randomUUID()}.pdf`;
const uploadResult = await uploadPdfToR2({
  bucket: this.env.PDF_STORAGE,
  content: pdfBuffer,
  fileName,
  userTier: 'pro', // TODO: Get from subscription
  metadata: { userId, apiKeyId, requestId }
});

// Return URL, not buffer
return { pdf_url: uploadResult.url, size: uploadResult.size };
```

### OKLCH Color Token Example

In `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    50: 'oklch(0.97 0.01 180)',
    100: 'oklch(0.93 0.03 180)',
    // ...
    900: 'oklch(0.30 0.15 180)',
  }
}
```

### Frontend Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Landing page
│   ├── dashboard/
│   │   ├── layout.tsx      # Dashboard layout
│   │   └── page.tsx        # Dashboard home
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── signup/
│       └── page.tsx        # Sign-up page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── landing/            # Landing page sections
│   └── dashboard/          # Dashboard components
├── lib/
│   └── supabase.ts         # Supabase client
└── styles/
    └── globals.css         # OKLCH color variables
```

## Clarifications Needed

1. **CDN Domain Configuration**: Is cdn.speedstein.com already configured to serve R2 content? If not, need to set up R2 public bucket + custom domain.
2. **Supabase Auth Provider**: Should we use email/password only, or also support OAuth (Google, GitHub)?
3. **API Key Prefix Format**: Should we use "sk_test_" vs "sk_live_" prefixes to distinguish environments?
4. **R2 Fallback Behavior**: When R2 upload fails, should we return buffer + warning, or fail the request entirely?
5. **Performance Target Priority**: Are the 100 PDFs/min and <2s P95 targets hard requirements for MVP, or nice-to-have?
6. **Frontend Hosting**: Will the Next.js app be deployed to Cloudflare Pages, Vercel, or another platform?
7. **Dark Mode Default**: Should the site default to light mode, dark mode, or system preference?
8. **Test User Creation**: Should the migration script include seed data (test users), or only schema?
9. **Enterprise Quota Announcement**: Should we notify existing customers (if any) about the quota increase?
10. **TypeScript Error Strategy**: Should we fix pre-existing errors (logger.ts, pdf-generator.ts) now or defer?

## References

- [PROJECT_STATE_ANALYSIS.md](../../PROJECT_STATE_ANALYSIS.md) - Comprehensive gap analysis
- [SPEEDSTEIN_TECHNICAL_SPEC.md](../../SPEEDSTEIN_TECHNICAL_SPEC.md) - Original technical specification
- [SPEEDSTEIN_TECHSTACK.md](../../SPEEDSTEIN_TECHSTACK.md) - Technology stack decisions
- [TYPESCRIPT_FIXES.md](../../TYPESCRIPT_FIXES.md) - Previous TypeScript error fixes
- [specs/002-architecture-alignment/spec.md](../002-architecture-alignment/spec.md) - Previous feature spec
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Cloudflare R2 Lifecycle Policies](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [Web Crypto API - SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- [OKLCH Color Picker](https://oklch.com/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
