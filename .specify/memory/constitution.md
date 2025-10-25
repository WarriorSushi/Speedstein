<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0
Change Type: MAJOR (Initial constitution creation)
Date: 2025-10-25

Modified Principles:
- NEW: I. Performance First (Non-Negotiable)
- NEW: II. Security & Authentication
- NEW: III. Design System Standards (Non-Negotiable)
- NEW: IV. Technology Stack Constraints
- NEW: V. Code Quality
- NEW: VI. Cap'n Web Best Practices (Critical)
- NEW: VII. User Experience
- NEW: VIII. Testing & Quality
- NEW: IX. Documentation
- NEW: X. Deployment & Operations

Added Sections:
- Reference Documents (links to technical specs)
- Detailed governance rules
- Compliance verification requirements

Templates Requiring Updates:
✅ constitution.md (this file - created)
⚠ plan-template.md (Constitution Check section needs Speedstein-specific gates)
✅ spec-template.md (no changes needed - principles align with existing structure)
✅ tasks-template.md (no changes needed - supports all principle-driven task types)
✅ checklist-template.md (no changes needed - generic structure sufficient)

Follow-up TODOs:
- Update plan-template.md Constitution Check with specific gates for:
  * Performance benchmarks (P95 latency <2s)
  * Security requirements (API key hashing, RLS policies)
  * OKLCH color usage verification
  * Cap'n Web implementation patterns
  * Test coverage targets
-->

# Speedstein Constitution

## Core Principles

### I. Performance First (NON-NEGOTIABLE)

All PDF generation operations MUST meet the following performance standards:
- P95 latency MUST be under 2 seconds for PDF generation
- Browser session reuse is MANDATORY - no cold starts allowed
- Chrome instances MUST be kept warm at all times
- Promise pipelining MUST be used for all batch operations
- Blocking operations are PROHIBITED in the event loop

**Rationale:** Performance is Speedstein's primary competitive advantage. A 5x speed improvement over competitors is the core value proposition. Any performance regression directly undermines the product's market position and must be treated as a critical blocker.

### II. Security & Authentication

All authentication and authorization operations MUST adhere to these rules:
- API keys MUST be SHA-256 hashed before storage
- Plaintext API keys MUST NEVER be stored in any database
- Row Level Security (RLS) MUST be enabled on all Supabase tables
- Rate limiting is MANDATORY on all API endpoints
- CORS MUST be properly configured and validated
- All secrets MUST use environment variables

**Rationale:** Security breaches destroy trust and can lead to regulatory penalties. API key compromise could result in unauthorized usage, revenue loss, and reputational damage. RLS prevents data leakage between tenants in a multi-tenant architecture.

### III. Design System Standards (NON-NEGOTIABLE)

All UI styling and color definitions MUST follow these constraints:
- ONLY OKLCH color space is permitted - RGB, HSL, and hex colors are PROHIBITED
- All colors MUST be perceptually uniform for WCAG AAA accessibility compliance
- WCAG AAA contrast compliance is MANDATORY (7:1 for normal text, 4.5:1 for large text)
- Elevation system MUST use OKLCH lightness manipulation exclusively
- shadcn/ui components are the ONLY permitted UI library - no alternatives allowed

**Rationale:** OKLCH provides perceptually uniform colors, ensuring consistent brightness across all hues, which is critical for accessibility. Traditional color spaces (RGB, HSL) are perceptually non-uniform, making it difficult to achieve consistent contrast ratios. Using a single design system (shadcn/ui) ensures consistency and reduces bundle size.

### IV. Technology Stack Constraints

The following technology choices are MANDATORY and MUST NOT be substituted:
- **Frontend:** Next.js 15 with App Router (mandatory)
- **Backend:** Cloudflare Workers (mandatory)
- **RPC:** Cap'n Web for all PDF generation (mandatory)
- **Database:** Supabase with RLS policies (mandatory)
- **Payments:** DodoPayments (mandatory)
- **Styling:** Tailwind CSS with OKLCH tokens (mandatory)

**Rationale:** This stack is specifically chosen for performance, developer experience, and cost optimization. Cloudflare Workers provide edge computing with 300+ global locations. Cap'n Web enables promise pipelining, reducing round-trip latency. Supabase provides PostgreSQL with built-in auth and RLS. DodoPayments offers competitive pricing with webhook support. Any substitution would require re-architecting significant portions of the system.

### V. Code Quality

All code MUST meet these quality standards:
- TypeScript strict mode is REQUIRED for all TypeScript files
- All functions MUST have proper error handling (try-catch or Result types)
- console.log statements are PROHIBITED in production code
- Zod schemas MUST validate all API inputs and outputs
- Browser instances MUST be properly disposed using 'using' keyword or explicit disposal

**Rationale:** TypeScript strict mode catches type errors at compile time, preventing runtime failures. Proper error handling prevents uncaught exceptions that crash Workers. Console.log statements leak information and clutter logs. Zod validation prevents malformed data from causing downstream failures. Resource leaks (undisposed browser instances) cause memory exhaustion and performance degradation.

### VI. Cap'n Web Best Practices (CRITICAL)

All Cap'n Web implementations MUST follow these patterns:
- All server-side classes MUST extend RpcTarget
- Promise pipelining MUST be used for dependent operations (avoid sequential await)
- Resources MUST be disposed properly using 'using' keyword or Symbol.dispose()
- WebSocket sessions MUST have heartbeat mechanisms to stay alive
- RPC methods MUST NEVER block the event loop (use async/await, not sync operations)

**Rationale:** Cap'n Web is the foundation of Speedstein's performance advantage. Extending RpcTarget enables automatic RPC method exposure. Promise pipelining reduces network round trips from N to 1, achieving the sub-2-second target. Improper resource disposal causes memory leaks. Blocked event loops freeze Workers, causing timeouts. Heartbeats prevent premature WebSocket closure during long-running operations.

### VII. User Experience

All user-facing features MUST meet these standards:
- Landing page MUST load in under 2 seconds (LCP < 2s)
- Live demo MUST work without signup or authentication
- Dark mode support is MANDATORY across all pages
- Mobile-responsive design is REQUIRED (breakpoints: 640px, 768px, 1024px, 1280px)
- Lighthouse score MUST be 95+ on all pages (performance, accessibility, best practices, SEO)

**Rationale:** Fast page loads reduce bounce rate and improve SEO rankings. A working live demo is the most effective conversion tool for developer-focused products. Dark mode reduces eye strain and is expected by 60%+ of developers. Mobile responsiveness is essential for 40%+ mobile traffic. Lighthouse scores correlate with user satisfaction and search rankings.

### VIII. Testing & Quality

All features MUST meet these testing requirements:
- Unit tests REQUIRED for critical business logic (API key validation, rate limiting, quota checks)
- Integration tests REQUIRED for all API endpoints
- E2E tests REQUIRED for key user flows (signup, generate PDF, API key creation)
- Code coverage target: 80%+ for business logic (services, models)
- No broken links or 404 errors allowed in production

**Rationale:** Unit tests catch logic errors early. Integration tests validate endpoint contracts. E2E tests ensure user flows work end-to-end. 80% coverage balances thoroughness with development speed. Broken links damage SEO and user trust.

### IX. Documentation

All code and APIs MUST be documented according to these rules:
- All API endpoints MUST be documented in SPEEDSTEIN_API_REFERENCE.md
- Code examples MUST be provided in JavaScript, Python, PHP, and Ruby
- README MUST include setup instructions, prerequisites, and quick start guide
- Complex logic (>10 lines or non-obvious algorithms) MUST have inline comments
- All public functions MUST have JSDoc or TSDoc comments

**Rationale:** Developer-facing products live or die by documentation quality. Multi-language examples reduce friction for adoption across diverse tech stacks. Clear setup instructions reduce support burden. Inline comments prevent future confusion during refactoring.

### X. Deployment & Operations

All deployments MUST follow these operational standards:
- Zero-downtime deployments REQUIRED (use rolling deployments, feature flags)
- Error tracking with Sentry is MANDATORY
- Uptime monitoring with 99.9% SLA target (43 minutes downtime/month max)
- Structured logging REQUIRED for all critical operations (PDF generation, auth, payments)
- Environment variables REQUIRED for all secrets and configuration

**Rationale:** Downtime directly impacts revenue and customer trust. Sentry provides real-time error alerting for quick incident response. 99.9% uptime is industry standard for B2B SaaS. Structured logs enable fast debugging during incidents. Environment variables prevent secrets from being committed to source control.

## Reference Documents

The following markdown files contain detailed technical specifications and MUST be consulted during planning and implementation:

- **SPEEDSTEIN_TECHNICAL_SPEC.md**: Complete system architecture, Cap'n Web integration patterns, database schema, security considerations
- **SPEEDSTEIN_API_REFERENCE.md**: Developer-facing API documentation, authentication methods, code examples, error handling
- **SPEEDSTEIN_IMPLEMENTATION_PLAN.md**: 50 detailed implementation steps organized into 10 phases (6-week timeline)
- **SPEEDSTEIN_TECHSTACK.md**: Technology stack documentation, architecture diagrams, deployment workflow, cost estimates

These documents provide the authoritative reference for technical decisions and MUST be updated when constitution principles change.

## Governance

### Authority and Compliance

- This constitution supersedes all other development practices, guidelines, and conventions
- All feature specifications MUST verify compliance with constitutional principles before planning begins
- All pull requests MUST include a constitution compliance checklist confirming adherence
- Deviations from constitutional principles MUST be explicitly documented and approved by project stakeholders

### Amendment Process

- Constitutional amendments require explicit documentation of:
  - Rationale for the change
  - Impact analysis on existing features
  - Migration plan for affected code
  - Updated reference documentation
- Version bump rules (semantic versioning):
  - **MAJOR**: Backward-incompatible principle removals or redefinitions
  - **MINOR**: New principle additions or material expansions
  - **PATCH**: Clarifications, wording improvements, typo fixes

### Enforcement

- **Performance regressions** (P95 > 2s) are BLOCKING issues and MUST be fixed before merge
- **Security violations** (plaintext keys, missing RLS, missing rate limiting) are CRITICAL priority
- **Design system violations** (non-OKLCH colors, non-shadcn components) MUST be rejected in code review
- **Testing gaps** (missing tests for user flows) MUST be addressed before feature completion

### Complexity Justification

If a feature violates simplicity principles (e.g., introduces new dependencies, adds architectural complexity):
- Document the specific problem being solved
- Explain why simpler alternatives were rejected
- Include this justification in the feature's plan.md Complexity Tracking table

**Version**: 1.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
