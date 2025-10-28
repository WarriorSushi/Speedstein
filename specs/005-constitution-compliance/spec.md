# Feature Specification: Constitution Compliance - Production Readiness

**Feature Branch**: `005-constitution-compliance`
**Created**: 2025-10-27
**Status**: Draft
**Input**: Complete all missing constitution requirements: frontend with OKLCH design system and shadcn/ui, DodoPayments integration, authentication UI flows, comprehensive testing infrastructure, performance validation, and architecture fixes for browser session management and R2 storage integration

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marketing Site Visitor (Priority: P1)

A potential customer visits the Speedstein landing page to understand the product and try it without signing up. They interact with a live HTML-to-PDF demo directly on the homepage, see instant results, and understand the pricing tiers available.

**Why this priority**: Without a landing page, we cannot demo the product or acquire customers. This is blocking deployment and violates Constitution Principle VII (landing page <2s LCP, live demo without signup).

**Independent Test**: Visit landing page in browser, confirm it loads in under 2 seconds, interact with Monaco editor demo by entering HTML and generating a PDF, all without authentication.

**Acceptance Scenarios**:

1. **Given** a user visits speedstein.com, **When** the page loads, **Then** they see the landing page with hero section in under 2 seconds (LCP <2s)
2. **Given** a user is on the landing page, **When** they type HTML in the Monaco editor, **Then** they can generate a PDF preview instantly without signing up
3. **Given** a user has generated a demo PDF, **When** they view the result, **Then** they see a download button and clear pricing information
4. **Given** a user is on the landing page, **When** they view it on mobile or desktop, **Then** the design is fully responsive across all screen sizes
5. **Given** a user toggles dark mode, **When** the page re-renders, **Then** all colors remain perceptually consistent and WCAG AAA compliant

---

### User Story 2 - New User Registration & Authentication (Priority: P1)

A user decides to sign up for Speedstein after trying the demo. They create an account with email/password, verify their email, log in, and access their dashboard where they can manage API keys and subscriptions.

**Why this priority**: Without signup/login flows, users cannot onboard or access paid features. This blocks monetization and violates Constitution Principle on user management.

**Independent Test**: Complete the full signup flow (email/password → verification → login → dashboard access), generate an API key from the dashboard, and verify the key works for PDF generation.

**Acceptance Scenarios**:

1. **Given** a user clicks "Sign Up" on the landing page, **When** they enter email and password, **Then** their account is created and verification email is sent
2. **Given** a user has verified their email, **When** they log in with correct credentials, **Then** they are redirected to their dashboard
3. **Given** a logged-in user is on the dashboard, **When** they click "Generate API Key", **Then** a new SHA-256 hashed API key is created and displayed once
4. **Given** a user tries to access the dashboard, **When** they are not authenticated, **Then** they are redirected to the login page
5. **Given** a user enters incorrect credentials, **When** they attempt to log in, **Then** they see a clear error message and remain on the login page

---

### User Story 3 - Subscription Management & Payments (Priority: P1)

A user on the free tier hits their quota limit and decides to upgrade to a paid plan. They view pricing options, select a plan, complete payment through DodoPayments, and immediately see their quota increased.

**Why this priority**: Without payment integration, we cannot monetize the product. This violates Constitution Principle IV (DodoPayments mandatory) and blocks revenue generation.

**Independent Test**: Navigate to pricing page, select a paid plan (Starter/Pro/Enterprise), complete payment flow, and verify that the subscription is activated and quota limits reflect the new tier.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard at 80%+ quota usage, **When** they view the quota indicator, **Then** they see an upgrade prompt with clear pricing information
2. **Given** a user clicks "Upgrade to Starter", **When** they complete the DodoPayments checkout flow, **Then** their subscription is immediately activated
3. **Given** a user has an active paid subscription, **When** a payment webhook is received, **Then** their subscription status and quota limits are automatically updated
4. **Given** a user wants to change their plan, **When** they select a different tier, **Then** they see clear information about billing changes and prorated amounts
5. **Given** a subscription payment fails, **When** the webhook is processed, **Then** the user is notified and their account is flagged for attention (grace period before downgrade)

---

### User Story 4 - Developer Using the API (Priority: P2)

A developer integrates Speedstein's PDF API into their application. They reference the API documentation, implement PDF generation in their preferred language (JavaScript, Python, PHP, or Ruby), and monitor their quota usage.

**Why this priority**: Comprehensive documentation improves developer experience and reduces support burden, but the API already works for early adopters without complete docs.

**Independent Test**: Follow the API documentation to integrate PDF generation in one language, generate 10 PDFs successfully, and verify quota is decremented correctly.

**Acceptance Scenarios**:

1. **Given** a developer visits the API documentation, **When** they select their language (JS/Python/PHP/Ruby), **Then** they see complete code examples for all endpoints
2. **Given** a developer has an API key, **When** they send a PDF generation request, **Then** they receive a public R2 URL (not a buffer) with the generated PDF
3. **Given** a developer generates multiple PDFs, **When** they check their dashboard, **Then** their quota usage updates in real-time
4. **Given** a developer hits a rate limit, **When** they make another request, **Then** they receive a 429 response with clear retry-after headers
5. **Given** a developer uses the RPC endpoint for batch processing, **When** they send 10 PDFs via Cap'n Web, **Then** all PDFs are generated in under 2 seconds total

---

### User Story 5 - Performance Validation & Monitoring (Priority: P2)

Operations team validates that the system meets performance targets under production load. They run load tests to verify P95 latency <2s, monitor 100+ PDFs/minute throughput, and confirm browser pool reuse achieves 80%+ hit rate.

**Why this priority**: Performance validation ensures Constitution Principle I (Performance First - P95 <2s mandatory) is met before deployment, but this is a validation step rather than a user-facing feature.

**Independent Test**: Execute load test script with 1000 concurrent PDF generation requests, measure P95 latency, verify throughput, and confirm browser pool metrics show 80%+ reuse.

**Acceptance Scenarios**:

1. **Given** the system is under normal load, **When** a PDF generation request is made, **Then** 95% of requests complete in under 2 seconds (P95 latency target)
2. **Given** a load test sends 100 requests per minute, **When** the system processes them, **Then** all requests complete successfully without errors
3. **Given** the browser pooling is enabled, **When** monitoring metrics over 1 hour, **Then** browser reuse rate is 80% or higher
4. **Given** an error occurs during PDF generation, **When** it is logged, **Then** Sentry captures the full stack trace with user context
5. **Given** performance degrades below targets, **When** monitoring alerts trigger, **Then** the operations team is notified immediately

---

### User Story 6 - Comprehensive Testing Coverage (Priority: P3)

QA team runs automated test suites to validate all user flows. They execute E2E tests for signup/login/payment flows, run unit tests for business logic, and measure code coverage to ensure it meets the 80%+ target.

**Why this priority**: Comprehensive testing is required by Constitution Principle VIII but doesn't directly deliver user value. It's essential for production readiness but lower priority than user-facing features.

**Independent Test**: Execute the full test suite (E2E + unit tests), generate a code coverage report, and verify all critical user flows pass.

**Acceptance Scenarios**:

1. **Given** the E2E test suite is executed, **When** it runs the signup flow, **Then** a test user can complete registration, verification, and login successfully
2. **Given** the E2E test suite tests the payment flow, **When** it simulates a subscription upgrade, **Then** the subscription is activated and quota is updated
3. **Given** the unit test suite runs, **When** it tests business logic components, **Then** all tests pass with no failures
4. **Given** a code coverage report is generated, **When** the results are analyzed, **Then** coverage is 80% or higher for all critical paths
5. **Given** a developer creates a pull request, **When** tests run in CI/CD, **Then** all tests must pass before merge is allowed

---

### Edge Cases

- What happens when a user's payment method is declined during subscription renewal? (System should send notification, provide grace period, then downgrade to free tier)
- How does the system handle a user reaching exactly 100% quota at the same moment multiple PDFs are being generated? (Quota checks should be atomic with proper locking)
- What happens when the Monaco editor demo times out due to complex HTML? (Show timeout message after 10 seconds, allow retry)
- How does the browser pool handle sudden traffic spikes that exceed 16 browsers? (Queue requests with clear wait-time messaging, scale Durable Objects horizontally)
- What happens when R2 storage is unavailable during PDF upload? (Retry with exponential backoff, fall back to temporary buffer response, log incident)
- How does dark mode handle user preference persistence? (Store preference in localStorage, respect system preference if no user choice)
- What happens when DodoPayments webhook delivery fails? (Implement retry mechanism with exponential backoff, manual reconciliation for failures after 24 hours)

## Requirements *(mandatory)*

### Functional Requirements

#### Frontend & Design System

- **FR-001**: Landing page MUST load with LCP (Largest Contentful Paint) under 2 seconds on desktop and mobile
- **FR-002**: All colors MUST use OKLCH color space exclusively (no RGB, HSL, or hex colors)
- **FR-003**: Design system MUST provide a gray scale (50-950) using OKLCH with perceptually uniform steps
- **FR-004**: All color combinations MUST meet WCAG AAA contrast requirements for accessibility
- **FR-005**: Landing page MUST include a live Monaco editor demo allowing HTML-to-PDF conversion without signup
- **FR-006**: UI components MUST use shadcn/ui exclusively (no other UI libraries permitted)
- **FR-007**: System MUST support dark mode with automatic color elevation using OKLCH lightness manipulation
- **FR-008**: Landing page MUST be fully responsive across mobile, tablet, and desktop screen sizes
- **FR-009**: Dashboard MUST display user quota usage with real-time updates

#### Authentication & User Management

- **FR-010**: System MUST allow users to register with email and password
- **FR-011**: System MUST send email verification to new users before account activation
- **FR-012**: System MUST use Supabase JWT-based authentication for session management
- **FR-013**: Protected routes (dashboard, API keys) MUST redirect unauthenticated users to login page
- **FR-014**: Dashboard MUST provide UI for generating new API keys with one-time display
- **FR-015**: All API keys MUST be SHA-256 hashed before storage (no plaintext storage)
- **FR-016**: Users MUST be able to log in with email/password credentials
- **FR-017**: Users MUST be able to log out and invalidate their session
- **FR-018**: System MUST provide password reset functionality via email

#### Payments & Billing

- **FR-019**: System MUST integrate with DodoPayments for all subscription management
- **FR-020**: Users MUST be able to subscribe to pricing tiers: Free, Starter ($29), Pro ($149), Enterprise ($999)
- **FR-021**: System MUST process DodoPayments webhooks for subscription events (created, updated, cancelled, payment_failed)
- **FR-022**: Users at 80%+ quota usage MUST see upgrade prompts with clear pricing information
- **FR-023**: Subscription changes MUST immediately update user quota limits in the database
- **FR-024**: System MUST handle failed payments with grace period before downgrade
- **FR-025**: Users MUST be able to view their current subscription status and billing history

#### Architecture Fixes

- **FR-026**: PDF generation MUST return public R2 CDN URLs (not buffers)
- **FR-027**: All generated PDFs MUST be uploaded to R2 storage with tier-based metadata tagging
- **FR-028**: R2 uploads MUST include tier-specific expiration dates (Free: 1 day, Starter: 7 days, Pro: 30 days, Enterprise: 90 days)
- **FR-029**: RPC API MUST hold persistent browser session references (not delegate to PdfService)
- **FR-030**: Browser sessions MUST implement proper cleanup with Symbol.dispose()
- **FR-031**: Browser session reuse MUST be tracked and reported in metrics

#### Performance & Monitoring

- **FR-032**: System MUST achieve P95 latency under 2 seconds for PDF generation
- **FR-033**: System MUST support throughput of 100+ PDFs per minute under load
- **FR-034**: Browser pool MUST achieve 80%+ reuse rate during normal operation
- **FR-035**: System MUST integrate Sentry for error tracking with full stack traces
- **FR-036**: Performance metrics MUST be collected and queryable for monitoring dashboards
- **FR-037**: All errors MUST be logged with user context for debugging

#### Testing & Quality

- **FR-038**: E2E test suite MUST cover signup, login, payment, and PDF generation flows
- **FR-039**: Unit tests MUST cover all critical business logic components
- **FR-040**: Code coverage MUST be measured and reported for each build
- **FR-041**: All tests MUST run in CI/CD pipeline before merge is allowed
- **FR-042**: Load testing MUST validate P95 latency and throughput targets before production deployment

#### Documentation

- **FR-043**: API documentation MUST include code examples in JavaScript, Python, PHP, and Ruby
- **FR-044**: All API endpoints MUST be documented with request/response schemas
- **FR-045**: Documentation MUST include Cap'n Web RPC examples for batch processing
- **FR-046**: Documentation MUST provide clear setup instructions for local development

### Key Entities

- **User Account**: Represents a registered user with email, hashed password, email verification status, subscription tier, and quota limits
- **API Key**: Represents a user-generated authentication token (SHA-256 hashed) with creation date and associated user
- **Subscription**: Represents a user's payment plan with tier (free/starter/pro/enterprise), status (active/cancelled/past_due), billing cycle, and DodoPayments subscription ID
- **Quota Usage**: Represents monthly PDF generation counts per user with quota limit, used count, remaining count, and reset date
- **PDF Generation Request**: Represents a single API call with HTML input, generated PDF R2 URL, file size, tier metadata, and expiration date
- **Payment Event**: Represents DodoPayments webhook data including event type (subscription.created, payment.succeeded, payment.failed), timestamp, and user association

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Landing page loads with LCP under 2 seconds on 95% of page views (measured via Lighthouse CI)
- **SC-002**: Users can complete signup, verification, and login flow in under 3 minutes
- **SC-003**: 95% of PDF generation requests complete in under 2 seconds (P95 latency target)
- **SC-004**: System sustains 100+ PDFs per minute throughput during load testing without errors
- **SC-005**: Browser pool achieves 80%+ reuse rate over a 1-hour monitoring period
- **SC-006**: All color combinations meet WCAG AAA contrast requirements (automated checks pass 100%)
- **SC-007**: E2E test suite achieves 100% pass rate for critical user flows (signup, login, payment, PDF generation)
- **SC-008**: Code coverage reaches 80%+ across all business logic components
- **SC-009**: Zero constitution violations remain in production deployment (all 8 critical violations resolved)
- **SC-010**: API documentation includes working code examples for all 4 languages (JavaScript, Python, PHP, Ruby)
- **SC-011**: 90% of users successfully generate their first PDF within 5 minutes of signup
- **SC-012**: Subscription upgrade flow completes in under 2 minutes from clicking "Upgrade" to quota increase
