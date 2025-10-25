# Feature Specification: Speedstein PDF API Platform

**Feature Branch**: `001-pdf-api-platform`
**Created**: 2025-10-25
**Status**: Draft
**Input**: User description: "Build Speedstein, the fastest PDF generation API on the market. Core value proposition: POST HTML → Get Beautiful PDF in <2 Seconds"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - REST API PDF Generation (Priority: P1)

A developer integrates Speedstein into their SaaS application to generate invoices and reports. They send HTML via a simple POST request and receive a PDF URL within 2 seconds. The PDF renders perfectly with modern CSS (Flexbox, Grid, custom fonts).

**Why this priority**: This is the core value proposition and MVP. Without fast, reliable REST API PDF generation, there is no product. Every other feature depends on this working flawlessly.

**Independent Test**: Can be fully tested by sending various HTML payloads via POST request and verifying PDF generation time is <2 seconds with correct rendering, and delivers immediate value for basic PDF generation use cases.

**Acceptance Scenarios**:

1. **Given** a developer has valid HTML content, **When** they POST to `/api/generate` with HTML and default options, **Then** they receive a PDF URL within 2 seconds and the PDF renders correctly
2. **Given** a developer wants custom formatting, **When** they POST with options (page size: A4, orientation: landscape, margins: 20mm), **Then** the generated PDF respects all custom options
3. **Given** HTML contains modern CSS (Flexbox, Grid, CSS variables), **When** PDF is generated, **Then** all CSS features render pixel-perfect
4. **Given** HTML contains custom web fonts, **When** PDF is generated, **Then** fonts are embedded correctly in the PDF
5. **Given** invalid HTML is submitted, **When** generation is attempted, **Then** user receives clear error message with validation details

---

### User Story 2 - Interactive Landing Page Demo (Priority: P1)

A prospective customer visits speedstein.com and immediately sees a working demo. They can edit HTML in a Monaco code editor, click "Generate PDF", and see the result in an embedded viewer with the generation time displayed prominently. This experience convinces them of Speedstein's speed and quality without requiring signup.

**Why this priority**: The live demo is the primary conversion tool. Developers won't trust marketing claims - they need to see it work. This is essential for product-market fit validation and customer acquisition.

**Independent Test**: Can be tested by visiting the landing page, editing HTML in the demo editor, clicking generate, and verifying the PDF preview loads with generation time displayed - delivers value as a standalone marketing/demo tool.

**Acceptance Scenarios**:

1. **Given** a visitor lands on speedstein.com, **When** the page loads, **Then** they see a pre-populated Monaco editor with sample HTML and a "Generate PDF" button within 2 seconds (LCP)
2. **Given** a visitor edits the HTML in the Monaco editor, **When** they click "Generate PDF", **Then** the PDF generates and displays in an embedded viewer with generation time shown
3. **Given** a visitor generates a demo PDF, **When** generation completes, **Then** generation time is prominently displayed (e.g., "Generated in 1.4 seconds")
4. **Given** a visitor is on mobile device, **When** they view the landing page, **Then** the demo editor is responsive and usable on small screens
5. **Given** a visitor has dark mode enabled, **When** the page loads, **Then** all UI elements use OKLCH dark mode color scheme

---

### User Story 3 - User Authentication & API Key Management (Priority: P2)

A developer signs up for Speedstein, creates an account, and accesses their dashboard. They can create multiple API keys with descriptive names (e.g., "Production", "Staging", "Dev"), view usage for each key, and revoke keys when needed. This enables organized credential management across environments.

**Why this priority**: API keys are required for production use beyond the demo. Users need secure credential management before they can integrate Speedstein into their applications. This unlocks revenue generation.

**Independent Test**: Can be tested by completing signup flow, creating/naming/revoking API keys in dashboard, and verifying keys work for API calls - delivers value as standalone credential management system.

**Acceptance Scenarios**:

1. **Given** a new user visits the signup page, **When** they submit email and password, **Then** their account is created and they are redirected to the dashboard
2. **Given** a user is logged into their dashboard, **When** they click "Create API Key" and provide a name, **Then** a new SHA-256 hashed API key is generated and displayed once
3. **Given** a user has created an API key, **When** they use it in API requests, **Then** the key authenticates successfully and requests are processed
4. **Given** a user wants to organize credentials, **When** they create multiple API keys with different names (Production, Staging, Dev), **Then** all keys are listed with their names in the dashboard
5. **Given** a user suspects a key is compromised, **When** they click "Revoke" on an API key, **Then** the key is immediately invalidated and future requests fail with 401 Unauthorized
6. **Given** a user creates an API key, **When** they leave the page and return, **Then** they can only see the key name and last 4 characters (plaintext is never stored)

---

### User Story 4 - Usage Tracking & Dashboard Analytics (Priority: P2)

A user logs into their dashboard and sees visual charts showing their PDF generation history over time, total PDFs generated this month, remaining quota for their plan, and a breakdown of usage by API key. This visibility helps them understand their usage patterns and know when to upgrade.

**Why this priority**: Usage visibility is essential for users to self-manage their accounts and make informed upgrade decisions. This reduces support burden and increases upgrade conversions.

**Independent Test**: Can be tested by generating PDFs via API, viewing dashboard charts, and verifying usage counts match actual API calls - delivers value as standalone analytics tool.

**Acceptance Scenarios**:

1. **Given** a user has generated PDFs via the API, **When** they view their dashboard, **Then** they see a time-series chart showing PDF generation count over the past 30 days
2. **Given** a user is on a specific plan (e.g., Starter: 5K PDFs/month), **When** they view the dashboard, **Then** they see current usage count, plan quota, and percentage used (e.g., "2,347 / 5,000 PDFs (47%)")
3. **Given** a user has multiple API keys, **When** they view usage breakdown, **Then** they see usage per API key with names (e.g., "Production: 1,200 PDFs, Staging: 450 PDFs")
4. **Given** a user is approaching their plan quota (>80%), **When** they view the dashboard, **Then** they see a prominent upgrade prompt
5. **Given** a user exceeds their plan quota, **When** they attempt to generate more PDFs, **Then** requests are rate-limited and dashboard shows "Quota exceeded" message with upgrade CTA

---

### User Story 5 - Subscription Management & Billing (Priority: P3)

A user upgrades from the Free plan to the Starter plan ($29/month for 5K PDFs). They enter payment details via DodoPayments, receive immediate plan activation, and get automatic monthly invoices via email. They can upgrade, downgrade, or cancel their subscription at any time.

**Why this priority**: Subscriptions enable revenue generation and business sustainability. While important, the product can launch with manual billing initially. Automated billing is essential for scaling but not required for MVP validation.

**Independent Test**: Can be tested by completing checkout flow, verifying plan activation, generating PDFs under new quota, and receiving invoice email - delivers value as standalone billing system.

**Acceptance Scenarios**:

1. **Given** a user is on the Free plan, **When** they click "Upgrade to Starter" and complete DodoPayments checkout, **Then** their plan is immediately activated with 5K PDF quota
2. **Given** a user has an active paid subscription, **When** the billing cycle renews, **Then** they are automatically charged and receive an invoice via email
3. **Given** a user wants to upgrade mid-cycle, **When** they upgrade from Starter to Pro, **Then** they are charged prorated amount and quota increases immediately
4. **Given** a user wants to downgrade, **When** they downgrade from Pro to Starter, **Then** the change takes effect at next billing cycle and they retain current quota until then
5. **Given** a user wants to cancel, **When** they click "Cancel Subscription", **Then** they receive confirmation and retain access until end of current billing period
6. **Given** a payment fails during renewal, **When** DodoPayments webhook notifies Speedstein, **Then** user receives email notification and account is flagged for payment update

---

### User Story 6 - WebSocket API with Promise Pipelining (Priority: P3)

A high-volume user (e.g., tax software generating thousands of invoices) connects to Speedstein's WebSocket API and uses Cap'n Web promise pipelining to batch-generate 100+ PDFs per minute. They chain dependent calls (e.g., fetch user data → generate invoice) in a single network round trip, achieving maximum throughput.

**Why this priority**: This is a differentiator for enterprise users with high-volume needs, but not required for MVP. Most users will be satisfied with REST API. WebSocket API targets advanced users and justifies premium pricing tiers.

**Independent Test**: Can be tested by establishing WebSocket connection, sending batch PDF generation requests using promise pipelining, and verifying 100+ PDFs/min throughput - delivers value as standalone high-performance API option.

**Acceptance Scenarios**:

1. **Given** a user wants high-volume PDF generation, **When** they establish WebSocket connection to `/api/rpc`, **Then** connection is established with Cap'n Web RPC session
2. **Given** a user has an active WebSocket session, **When** they send 100 PDF generation requests without awaiting, **Then** all requests are batched and processed with session reuse achieving 100+ PDFs/min
3. **Given** a user has dependent operations (fetch data → generate PDF), **When** they use promise pipelining to chain calls, **Then** both operations complete in a single network round trip
4. **Given** a WebSocket session is idle for 30 seconds, **When** heartbeat mechanism activates, **Then** session stays alive and doesn't disconnect
5. **Given** a user's WebSocket session encounters an error, **When** the error occurs, **Then** user receives structured error message and can reconnect

---

### User Story 7 - Developer Documentation & Code Examples (Priority: P3)

A developer wants to integrate Speedstein and visits the documentation. They find a quickstart guide, complete API reference, and code examples in JavaScript, Python, PHP, and Ruby. Within 10 minutes, they have successfully generated their first PDF.

**Why this priority**: Documentation is critical for adoption, but initial users can work with basic README examples. Comprehensive multi-language docs are important for scaling to diverse developer audiences but not required for initial validation.

**Independent Test**: Can be tested by following quickstart guide from scratch, copying code examples, and successfully generating a PDF - delivers value as standalone onboarding resource.

**Acceptance Scenarios**:

1. **Given** a developer visits the documentation, **When** they navigate to Quickstart, **Then** they see step-by-step guide with code examples in their preferred language
2. **Given** a developer needs API reference, **When** they visit API docs, **Then** they see complete endpoint documentation with request/response examples
3. **Given** a developer uses JavaScript, **When** they copy the JavaScript example, **Then** they can generate a PDF without modification
4. **Given** a developer uses Python, **When** they copy the Python example, **Then** they can generate a PDF without modification
5. **Given** a developer uses PHP or Ruby, **When** they copy those language examples, **Then** they can generate a PDF without modification
6. **Given** a developer wants WebSocket examples, **When** they visit advanced docs, **Then** they see Cap'n Web promise pipelining examples

---

### User Story 8 - Multi-Team API Key Management (Priority: P4)

A team lead manages a Speedstein account for their organization. They create separate API keys for different team members or services, name them descriptively (e.g., "Alex - Backend", "Sarah - Reports", "Cron Job"), and track usage per key. When a team member leaves, they can revoke that specific key without affecting others.

**Why this priority**: This is valuable for team/enterprise use cases but not critical for individual developers or MVP. Most early users will use 1-2 keys. This becomes important when targeting larger organizations.

**Independent Test**: Can be tested by creating multiple named API keys, using each for different purposes, tracking usage separately, and revoking individual keys - delivers value as team coordination tool.

**Acceptance Scenarios**:

1. **Given** a team lead wants to organize credentials, **When** they create API keys with team member names, **Then** each key is listed with its descriptive name
2. **Given** multiple team members use different API keys, **When** the team lead views usage dashboard, **Then** they see usage breakdown by API key/team member
3. **Given** a team member leaves the organization, **When** the team lead revokes that person's API key, **Then** only that specific key is invalidated without affecting other keys
4. **Given** a team wants to track service-specific usage, **When** they create keys named by service (e.g., "Invoice Generator", "Report Builder"), **Then** they can monitor which services consume the most quota

---

### Edge Cases

- What happens when user submits extremely large HTML (>10MB)? → System validates payload size and returns 413 Payload Too Large with size limit message
- How does system handle malformed HTML or invalid CSS? → Chrome rendering handles gracefully, generates PDF with best-effort rendering
- What happens if PDF generation exceeds 10 seconds due to complex HTML? → Request times out, user receives 504 Gateway Timeout with retry suggestion
- What happens when user reaches 100% of plan quota? → All API requests return 429 Rate Limit Exceeded with upgrade link in response headers
- How does system handle concurrent API requests from same user? → Requests are queued and processed with browser session pooling to maintain <2s P95 latency
- What happens if DodoPayments webhook fails or is delayed? → Webhook retries with exponential backoff, subscription status syncs when webhook succeeds
- What happens when user downgrades mid-cycle with usage above new plan quota? → Downgrade scheduled for next cycle, current quota maintained until renewal
- How does system handle WebSocket disconnections? → Client receives connection closed event, can reconnect with exponential backoff, in-flight requests fail gracefully
- What happens if API key is leaked publicly? → User can immediately revoke compromised key via dashboard, create new key, and update their integration
- What happens when HTML references external resources (images, fonts) that fail to load? → Chrome handles missing resources gracefully, PDF generates with fallbacks

## Requirements *(mandatory)*

### Functional Requirements

#### REST API (User Story 1)
- **FR-001**: System MUST accept HTML content via POST to `/api/generate` endpoint
- **FR-002**: System MUST generate PDFs with P95 latency under 2 seconds
- **FR-003**: System MUST support custom options (page size, orientation, margins, headers, footers)
- **FR-004**: System MUST use real Chrome engine for rendering (not wkhtmltopdf or legacy engines)
- **FR-005**: System MUST support modern CSS features (Flexbox, Grid, CSS Variables, custom properties)
- **FR-006**: System MUST return PDF as public URL stored in Cloudflare R2
- **FR-007**: System MUST validate HTML payload size (max 10MB)
- **FR-008**: System MUST handle web font embedding automatically
- **FR-009**: System MUST maintain browser session pool to avoid cold starts

#### Landing Page & Demo (User Story 2)
- **FR-010**: Landing page MUST load in under 2 seconds (LCP <2s)
- **FR-011**: Landing page MUST include Monaco code editor with syntax highlighting
- **FR-012**: Demo MUST work without authentication or signup
- **FR-013**: Demo MUST display PDF in embedded viewer after generation
- **FR-014**: Demo MUST prominently display generation time after each request
- **FR-015**: UI MUST use OKLCH color space exclusively (no RGB/HSL/hex)
- **FR-016**: UI MUST support dark mode with OKLCH-based theme switching
- **FR-017**: Landing page MUST be mobile-responsive (breakpoints: 640/768/1024/1280px)
- **FR-018**: Landing page MUST achieve Lighthouse score 95+ (performance, accessibility, best practices, SEO)

#### Authentication & API Keys (User Story 3)
- **FR-019**: System MUST support email/password signup and login
- **FR-020**: System MUST use Supabase Auth for authentication (JWT-based)
- **FR-021**: System MUST allow users to create multiple API keys
- **FR-022**: API keys MUST be SHA-256 hashed before storage (plaintext never stored)
- **FR-023**: System MUST display full API key only once at creation
- **FR-024**: System MUST allow users to name API keys with descriptive labels
- **FR-025**: System MUST allow users to revoke API keys instantly
- **FR-026**: Revoked API keys MUST return 401 Unauthorized immediately
- **FR-027**: Dashboard MUST show API key name and last 4 characters only

#### Usage Tracking (User Story 4)
- **FR-028**: System MUST track PDF generation count per user
- **FR-029**: System MUST track PDF generation count per API key
- **FR-030**: System MUST display time-series chart of usage over 30 days
- **FR-031**: System MUST display current usage vs plan quota with percentage
- **FR-032**: System MUST show usage breakdown by API key
- **FR-033**: System MUST show upgrade prompt when user reaches 80% quota
- **FR-034**: System MUST enforce rate limiting when user exceeds 100% quota
- **FR-035**: System MUST return 429 Rate Limit Exceeded when quota exceeded

#### Subscription & Billing (User Story 5)
- **FR-036**: System MUST support four pricing tiers (Free: 100 PDFs/month, Starter: 5K at $29/month, Pro: 50K at $99/month, Enterprise: Custom)
- **FR-037**: System MUST integrate with DodoPayments for payment processing
- **FR-038**: System MUST activate plan immediately after successful payment
- **FR-039**: System MUST handle automatic monthly billing and renewal
- **FR-040**: System MUST send invoice emails after each successful charge
- **FR-041**: System MUST support mid-cycle upgrades with prorated billing
- **FR-042**: System MUST schedule downgrades for next billing cycle
- **FR-043**: System MUST process DodoPayments webhooks for payment events
- **FR-044**: System MUST handle failed payment notifications and user alerts

#### WebSocket API (User Story 6)
- **FR-045**: System MUST expose WebSocket endpoint at `/api/rpc`
- **FR-046**: System MUST implement Cap'n Web RPC protocol
- **FR-047**: Server-side PDF generator MUST extend RpcTarget class
- **FR-048**: System MUST support promise pipelining for batch operations
- **FR-049**: System MUST achieve 100+ PDFs per minute throughput with session reuse
- **FR-050**: System MUST implement WebSocket heartbeat mechanism (30s interval)
- **FR-051**: System MUST properly dispose browser instances using 'using' keyword

#### Documentation (User Story 7)
- **FR-052**: System MUST provide quickstart guide in documentation
- **FR-053**: System MUST provide complete API reference for all endpoints
- **FR-054**: System MUST provide code examples in JavaScript, Python, PHP, and Ruby
- **FR-055**: Documentation MUST be accessible at `/docs` route
- **FR-056**: System MUST update SPEEDSTEIN_API_REFERENCE.md with all endpoint changes

#### Security & Operations
- **FR-057**: All Supabase tables MUST have Row Level Security (RLS) policies enabled
- **FR-058**: System MUST validate all API inputs with Zod schemas
- **FR-059**: System MUST use TypeScript strict mode for all code
- **FR-060**: System MUST configure CORS properly for API endpoints
- **FR-061**: System MUST use environment variables for all secrets
- **FR-062**: System MUST implement structured logging for critical operations
- **FR-063**: System MUST integrate Sentry for error tracking
- **FR-064**: System MUST deploy with zero-downtime strategy

### Key Entities *(include if feature involves data)*

- **User**: Represents registered account; attributes include email, hashed password, current plan tier, subscription status, created timestamp
- **ApiKey**: Represents authentication credential; attributes include SHA-256 hash, user association, descriptive name, creation timestamp, revocation status, last used timestamp
- **PdfGeneration**: Represents single PDF generation event; attributes include user ID, API key ID, HTML content hash, generation time, PDF URL, timestamp, options used
- **Subscription**: Represents billing relationship; attributes include user ID, plan tier (Free/Starter/Pro/Enterprise), billing cycle start, payment method ID, status (active/past_due/canceled)
- **UsageQuota**: Represents usage limits and tracking; attributes include user ID, plan quota, current period usage, reset date, last updated timestamp
- **Invoice**: Represents billing transaction; attributes include user ID, amount, billing period, payment status, DodoPayments transaction ID, PDF invoice URL

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate PDFs from HTML with P95 latency under 2 seconds (measured via server-side timing logs)
- **SC-002**: Landing page loads in under 2 seconds (LCP measured via Lighthouse CI)
- **SC-003**: Live demo converts at least 5% of visitors to signups (measured via analytics funnel)
- **SC-004**: Users successfully generate their first API-based PDF within 10 minutes of signup (measured via time between account creation and first API call)
- **SC-005**: API uptime maintains 99.9% availability (measured via uptime monitoring, max 43 minutes downtime/month)
- **SC-006**: WebSocket API achieves 100+ PDFs per minute throughput (measured via load testing with batch operations)
- **SC-007**: Users self-serve upgrade without support intervention (measured by upgrade conversion rate in dashboard)
- **SC-008**: Zero plaintext API keys exist in database (verified via database audit query)
- **SC-009**: All UI colors use OKLCH color space (verified via CSS audit, zero RGB/HSL/hex values)
- **SC-010**: Lighthouse score remains 95+ on all pages (verified via CI checks on every deployment)
- **SC-011**: Payment webhook success rate exceeds 99% (measured via DodoPayments webhook retry logs)
- **SC-012**: Users can find and use code examples in their preferred language within 5 minutes (measured via documentation time-to-first-PDF metric)

## Assumptions

1. **Chrome Rendering API**: Assuming Cloudflare Browser Rendering API or equivalent Chrome-based service is available and meets performance requirements for P95 <2s latency
2. **DodoPayments Integration**: Assuming DodoPayments provides webhook support for subscription events (payment.succeeded, payment.failed, subscription.canceled) with retry mechanism
3. **Supabase Scalability**: Assuming Supabase can handle expected load (10K+ users, 1M+ API calls/month) with acceptable query performance for RLS-enabled tables
4. **Cap'n Web Stability**: Assuming Cap'n Web protocol is production-ready for WebSocket RPC with promise pipelining and adequate documentation exists
5. **OKLCH Browser Support**: Assuming OKLCH color space has sufficient browser support (95%+ of target users on modern browsers) or graceful fallbacks exist
6. **Monaco Editor Performance**: Assuming Monaco code editor performs well on landing page without significantly impacting LCP (<2s load time requirement)
7. **R2 Storage Limits**: Assuming Cloudflare R2 storage costs and limits are acceptable for storing generated PDFs (with TTL-based cleanup after 30 days)
8. **Session Reuse**: Assuming browser session pooling can maintain warm Chrome instances without memory leaks or degradation over time
9. **Default HTML Templates**: Assuming users will provide their own HTML content; system doesn't need built-in invoice/report templates (can be added post-MVP)
10. **Rate Limiting Granularity**: Assuming per-user quota enforcement is sufficient; per-IP rate limiting not required initially (can be added for abuse prevention)

## Out of Scope

The following features are explicitly excluded from this specification:

1. **HTML Templates Library**: Pre-built invoice, report, or receipt templates (users provide their own HTML)
2. **PDF Editing Features**: Ability to edit generated PDFs, merge PDFs, or manipulate existing PDFs
3. **OCR or Text Extraction**: Extracting text or data from generated PDFs
4. **Collaborative Editing**: Real-time collaborative HTML editing in the Monaco editor
5. **Version Control**: Tracking HTML content versions or PDF generation history beyond usage counts
6. **White-Label/Reseller Program**: Allowing users to rebrand Speedstein for their customers
7. **On-Premise Deployment**: Self-hosted version of Speedstein (cloud-only SaaS)
8. **Mobile Apps**: Native iOS/Android apps (web interface only)
9. **SSO/SAML**: Enterprise single sign-on (email/password only initially)
10. **Webhook Delivery**: Sending generated PDFs to user-specified webhook URLs (direct download only)
11. **Batch Upload**: Bulk HTML upload via CSV/ZIP (single requests only; batch via WebSocket API)
12. **Usage Alerts**: Proactive email alerts when approaching quota (dashboard visibility only)
13. **Team/Organization Accounts**: Formal team structures with roles and permissions (individual accounts only)
14. **API Versioning**: Multiple API versions (v1 only)
15. **Custom Domains**: Users bringing their own domain for PDF URLs (speedstein.com domain only)

## Dependencies

- **External Services**:
  - Cloudflare Workers (backend runtime)
  - Cloudflare Browser Rendering API (Chrome-based PDF engine)
  - Cloudflare R2 (PDF storage)
  - Supabase (PostgreSQL database + authentication)
  - DodoPayments (payment processing)
  - Vercel (Next.js frontend hosting)
  - Sentry (error tracking)

- **Third-Party Libraries**:
  - Next.js 15 (frontend framework)
  - shadcn/ui (UI component library)
  - Tailwind CSS (styling)
  - Monaco Editor (code editor)
  - Cap'n Web (WebSocket RPC)
  - Zod (schema validation)
  - Recharts (usage charts)

- **Technical Dependencies**:
  - TypeScript strict mode compiler
  - Node.js 18+ (development environment)
  - Git (version control)

## Reference Documentation

For complete technical implementation details, consult these documents in the project directory:

- **[SPEEDSTEIN_TECHNICAL_SPEC.md](../../SPEEDSTEIN_TECHNICAL_SPEC.md)**: Complete system architecture, database schema with RLS policies, Cap'n Web integration patterns, security considerations
- **[SPEEDSTEIN_API_REFERENCE.md](../../SPEEDSTEIN_API_REFERENCE.md)**: Developer-facing API documentation, authentication methods, request/response formats, error codes, code examples
- **[SPEEDSTEIN_IMPLEMENTATION_PLAN.md](../../SPEEDSTEIN_IMPLEMENTATION_PLAN.md)**: 50-step implementation guide organized into 10 phases (6-week timeline)
- **[SPEEDSTEIN_TECHSTACK.md](../../SPEEDSTEIN_TECHSTACK.md)**: Technology stack documentation, architecture diagrams, deployment workflow, cost estimates, rationale for tech choices

These documents MUST be consulted during the planning phase (`/speckit.plan`) to ensure technical decisions align with established architecture.
