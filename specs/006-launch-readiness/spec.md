# Feature Specification: Launch Readiness - Complete Critical MVP Components

**Feature Branch**: `006-launch-readiness`
**Created**: 2025-10-27
**Status**: Draft
**Input**: Complete all critical missing components identified in specification compliance analysis: Priority 1 BLOCKING items (Authentication & Dashboard Phase 3, Payment Integration Phase 6, Monitoring Phase 9), Priority 2 HIGH RISK items (E2E Testing Phase 8, Documentation), and Priority 3 items (OKLCH Design System completion, Performance Optimization). This represents 70% of the 50-step implementation plan that was skipped, comprising Phases 3, 5, 6, 7, 8, 9, and 10.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration and Authentication (Priority: P1)

A potential customer visits the Speedstein landing page, signs up for a free account using their email and password, receives a verification email, confirms their account, and logs into the dashboard where they see their API usage statistics and can generate their first API key.

**Why this priority**: This is the absolute foundation - without authentication, users cannot access the service at all. This is currently 0% implemented and is blocking all revenue generation. Users cannot sign up, log in, or use the paid service.

**Independent Test**: Can be fully tested by creating an account at /signup, verifying email, logging in at /login, and accessing /dashboard. Delivers the ability for users to create accounts and access the platform.

**Acceptance Scenarios**:

1. **Given** a new visitor on the landing page, **When** they click "Sign Up" and enter valid email/password, **Then** they receive a verification email and see a "Check your email" confirmation message
2. **Given** a user with an unverified account, **When** they click the verification link in their email, **Then** their account is activated and they are redirected to the dashboard
3. **Given** a verified user, **When** they enter correct credentials on the login page, **Then** they are authenticated and redirected to their dashboard
4. **Given** an authenticated user on the dashboard, **When** they view their account overview, **Then** they see their current subscription tier (Free), API usage statistics (0 requests), and available quota
5. **Given** an authenticated user, **When** they navigate to protected routes without a valid session, **Then** they are redirected to the login page

---

### User Story 2 - API Key Management (Priority: P1)

An authenticated user needs to integrate Speedstein into their application. They navigate to the API Keys section of their dashboard, generate a new API key with a descriptive name, copy the key to their clipboard, and use it to make their first PDF generation request. Later, they revoke an old key that was compromised.

**Why this priority**: Without API key management, users cannot actually use the PDF generation service even if they have an account. This is the bridge between having an account and being able to generate PDFs programmatically.

**Independent Test**: Can be tested by logging into the dashboard, navigating to /dashboard/api-keys, creating a new key, copying it, testing it against the API endpoint, then revoking it and verifying the key no longer works.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the API keys page, **When** they click "Generate New Key" and provide a name, **Then** a new API key is created and displayed once (with a warning to copy it)
2. **Given** a user viewing their API keys list, **When** they see the list, **Then** each key shows its name, prefix (first 8 characters), creation date, last used timestamp, and active/revoked status
3. **Given** a user with an active API key, **When** they click "Revoke" and confirm, **Then** the key is immediately deactivated and can no longer authenticate API requests
4. **Given** a user copying their new API key, **When** they paste it into their application code, **Then** they can successfully make authenticated PDF generation requests
5. **Given** a user with multiple API keys, **When** they view their keys, **Then** they can identify which key is used for which project based on the descriptive names they provided

---

### User Story 3 - Subscription Selection and Payment (Priority: P1)

A free-tier user has exceeded their monthly quota and wants to upgrade to the Starter plan. They navigate to the billing page, review the pricing tiers, click "Upgrade to Starter", are redirected to a checkout page powered by DodoPayments, enter their payment details, complete the purchase, and are redirected back to the dashboard where their new subscription tier and increased quotas are immediately reflected.

**Why this priority**: Without payment integration, there is no revenue model. Users cannot upgrade from free tier, and the business cannot monetize. This is blocking all revenue generation and is critical for launch.

**Independent Test**: Can be tested by logging in as a free-tier user, navigating to /dashboard/billing, clicking upgrade, completing checkout via DodoPayments sandbox, and verifying the subscription status updates in the dashboard and database.

**Acceptance Scenarios**:

1. **Given** a free-tier user on the billing page, **When** they view the pricing tiers, **Then** they see Free (current), Starter ($29/mo), Pro ($149/mo), and Enterprise ($499/mo) with clear feature comparisons
2. **Given** a user clicking "Upgrade to Starter", **When** they are redirected to DodoPayments checkout, **Then** they see the correct amount ($29), subscription details, and payment form
3. **Given** a user completing payment successfully, **When** the payment is processed, **Then** a webhook is triggered to update their subscription status to "active" and tier to "starter"
4. **Given** a user with an active paid subscription, **When** they view the billing page, **Then** they see their current plan, next billing date, payment method (last 4 digits), and the option to manage or cancel
5. **Given** a subscription payment fails, **When** the webhook receives a "payment_failed" event, **Then** the user's subscription status is updated to "past_due" and they receive a notification
6. **Given** a user canceling their subscription, **When** the cancellation webhook is received, **Then** their subscription remains active until the end of the billing period, then downgrades to free tier

---

### User Story 4 - Error Tracking and Monitoring (Priority: P1)

A production issue occurs where PDF generation fails for certain HTML inputs. The error is automatically captured by Sentry with full context (user ID, request payload, stack trace). The development team receives an alert, investigates the error in Sentry's dashboard, identifies the root cause (unsupported CSS property), deploys a fix, and monitors the error rate dropping to zero.

**Why this priority**: Without monitoring, the team is flying blind in production. Critical errors could be happening without anyone knowing, leading to poor user experience and lost revenue. This is currently 0% implemented and is a critical production readiness requirement.

**Independent Test**: Can be tested by triggering an intentional error (invalid HTML input), verifying it appears in Sentry dashboard with correct context, then fixing the issue and verifying error rate decreases.

**Acceptance Scenarios**:

1. **Given** an error occurs in the worker (PDF generation failure), **When** the error is thrown, **Then** it is captured by Sentry with request context (user_id, api_key_id, html_content hash)
2. **Given** an error occurs in the Next.js frontend, **When** the error is thrown, **Then** it is captured by Sentry with user context (session, page URL, user actions)
3. **Given** multiple errors of the same type, **When** they are sent to Sentry, **Then** they are grouped together with occurrence count and affected user count
4. **Given** a critical error (P95 latency exceeded, database connection failure), **When** it occurs, **Then** an alert is sent to the team via configured notification channel
5. **Given** a developer reviewing errors in Sentry, **When** they view an error, **Then** they see full context: stack trace, breadcrumbs, environment variables (sanitized), and user impact metrics

---

### User Story 5 - End-to-End User Flow Testing (Priority: P2)

A QA engineer needs to verify the complete user journey works before launch. They run the Playwright E2E test suite which automatically: signs up a new user, verifies the email flow (using a test email inbox), logs in, generates an API key, makes a PDF generation request, upgrades to a paid plan (using DodoPayments sandbox), and verifies all steps succeed. The test results show 100% pass rate with screenshots and execution traces.

**Why this priority**: Without E2E tests, there is no automated verification that critical user flows work end-to-end. Manual testing is time-consuming, error-prone, and doesn't catch regressions. This is high risk - currently only 10% of testing is complete.

**Independent Test**: Can be tested by running `pnpm test:e2e` and verifying all test scenarios pass, with artifacts (screenshots, traces, videos) captured for debugging.

**Acceptance Scenarios**:

1. **Given** the E2E test suite for signup flow, **When** tests are executed, **Then** they verify: signup form validation, email verification, first login, and dashboard access
2. **Given** the E2E test suite for PDF generation flow, **When** tests are executed, **Then** they verify: API key creation, authenticated request, PDF generation, and download
3. **Given** the E2E test suite for payment flow, **When** tests are executed using DodoPayments sandbox, **Then** they verify: checkout redirect, payment processing, webhook handling, and subscription activation
4. **Given** a test failure, **When** the test completes, **Then** artifacts are captured (screenshot, video, trace) and attached to the test report for debugging
5. **Given** all E2E tests, **When** they run in CI/CD pipeline, **Then** deployment is blocked if any critical tests fail

---

### User Story 6 - API Documentation Discovery (Priority: P2)

A developer integrating Speedstein for the first time visits the documentation page, searches for "generate PDF", finds the REST API endpoint documentation with examples in JavaScript, Python, PHP, and Ruby, copies the code example for their language, replaces the placeholder API key with their own, runs the code, and successfully generates their first PDF.

**Why this priority**: Without comprehensive documentation, developers struggle to integrate the API, leading to increased support burden and slower adoption. Currently only 20% complete (markdown files exist but no web pages).

**Independent Test**: Can be tested by visiting /docs, searching for an endpoint, viewing code examples in multiple languages, and verifying examples work when executed.

**Acceptance Scenarios**:

1. **Given** a developer visiting /docs, **When** the page loads, **Then** they see a searchable list of all API endpoints, authentication guide, and quickstart tutorial
2. **Given** a developer viewing the "Generate PDF" endpoint documentation, **When** they scroll down, **Then** they see working code examples in JavaScript, Python, PHP, and Ruby
3. **Given** a developer clicking a code example, **When** they click the copy button, **Then** the code is copied to their clipboard with syntax highlighting preserved
4. **Given** a developer searching for "authentication", **When** the search executes, **Then** they see relevant documentation sections highlighted with matching keywords
5. **Given** a developer experiencing an error, **When** they view the troubleshooting guide, **Then** they see common error codes, causes, and solutions with example fixes

---

### User Story 7 - Design System Consistency (Priority: P3)

A designer audits the Speedstein application and verifies all colors use the OKLCH color space with perceptually uniform transitions, all text meets WCAG AAA contrast requirements, the elevation system uses consistent OKLCH lightness manipulation, and dark mode toggles smoothly with proper color transformations. The design system documentation shows all color tokens and elevation levels.

**Why this priority**: While not blocking launch, a consistent and accessible design system is critical for brand quality and legal compliance (accessibility). This is currently 60% complete and needs polish before public launch.

**Independent Test**: Can be tested by running an automated contrast checker on all pages, verifying OKLCH values in computed styles, toggling dark mode, and reviewing the design system documentation.

**Acceptance Scenarios**:

1. **Given** any text element on any page, **When** contrast is measured, **Then** it meets WCAG AAA standards (7:1 for normal text, 4.5:1 for large text)
2. **Given** the color palette, **When** colors are inspected in DevTools, **Then** all colors use OKLCH format with documented lightness/chroma/hue values
3. **Given** an elevated component (card, modal, dropdown), **When** elevation is applied, **Then** it uses OKLCH lightness manipulation (not box-shadow) following the documented elevation scale
4. **Given** a user toggling dark mode, **When** the theme changes, **Then** all colors transform smoothly with OKLCH transformations maintaining perceptual consistency
5. **Given** a developer adding a new component, **When** they reference the design system docs, **Then** they find all OKLCH color tokens, elevation levels, and usage guidelines

---

### User Story 8 - Performance Target Achievement (Priority: P3)

A performance engineer runs load tests against the production API and measures: P50 latency at 1.2s (target <1.5s), P95 latency at 1.8s (target <2.0s), P99 latency at 2.5s (target <3.0s), throughput at 120 PDFs/minute (target 100/min), and browser reuse rate at 85% (target 80%). All performance targets are met or exceeded, and the results are documented in the performance dashboard.

**Why this priority**: While the current performance is close to targets (2.3s P95), achieving and maintaining the performance targets is important for user satisfaction and competitive advantage. This is a polish item that can be refined post-MVP launch.

**Independent Test**: Can be tested by running load tests with tools like k6 or Artillery against production, measuring latency percentiles, and comparing against documented targets.

**Acceptance Scenarios**:

1. **Given** a load test with 100 concurrent users, **When** PDFs are generated, **Then** P95 latency is consistently under 2.0 seconds
2. **Given** browser pooling in production, **When** sessions are monitored, **Then** browser reuse rate is above 80% (sessions recycled vs. new sessions created)
3. **Given** continuous monitoring, **When** performance data is collected, **Then** a dashboard shows real-time P50/P95/P99 latencies and throughput metrics
4. **Given** a performance regression, **When** P95 latency exceeds 2.5s, **Then** an alert is triggered and the team investigates
5. **Given** production deployment, **When** performance is compared to local/remote dev, **Then** latency improvements are documented (estimated 30-40% faster due to no wrangler overhead)

---

### Edge Cases

- **What happens when a user tries to sign up with an email that already exists?** The system shows a clear error message "Email already registered" and suggests logging in instead or resetting password
- **What happens when a payment webhook arrives out of order** (e.g., subscription_updated before subscription_created)? The webhook handler uses idempotency keys and checks current state before applying updates
- **What happens when a user's payment method expires?** DodoPayments sends a payment_failed webhook, the subscription status changes to "past_due", and the user receives an email notification to update their payment method
- **What happens when Sentry is unreachable?** Errors are logged locally to CloudFlare Workers logs as fallback, and Sentry client retries with exponential backoff
- **What happens when a user generates an API key, copies it, but immediately closes the dialog?** The key is only shown once and cannot be retrieved again - user must revoke and generate a new key
- **What happens when browser pool is exhausted** (all sessions in use)? The request waits in queue with timeout, or a new browser instance is spawned if below max capacity
- **What happens when E2E tests run against production?** Tests use a dedicated test user account and DodoPayments sandbox credentials to avoid affecting real data
- **What happens when a user's quota is exceeded mid-request?** The request is rejected with HTTP 429 status code and clear error message indicating quota exceeded and suggesting upgrade
- **What happens when documentation code examples are outdated?** Automated tests run against code examples to verify they work with current API version, failing build if examples are broken

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Dashboard (Phase 3)

- **FR-001**: System MUST provide signup page at /signup accepting email and password with client-side validation (email format, password strength minimum 8 characters)
- **FR-002**: System MUST integrate with Supabase Auth for user registration, sending verification emails via Supabase's email service
- **FR-003**: System MUST provide login page at /login with email/password authentication and "Forgot Password" link
- **FR-004**: System MUST implement protected route middleware that verifies JWT session tokens and redirects unauthenticated users to /login
- **FR-005**: System MUST provide dashboard layout at /dashboard with navigation to overview, API keys, billing, and settings sections
- **FR-006**: System MUST display user account overview showing: subscription tier, API usage (current period), quota limits, and account creation date
- **FR-007**: System MUST integrate dashboard with existing Row Level Security (RLS) policies in Supabase ensuring users only see their own data
- **FR-008**: System MUST implement session management with secure HTTP-only cookies and 7-day session expiration

#### API Key Management

- **FR-009**: System MUST provide API keys page at /dashboard/api-keys listing all user's API keys with name, prefix (first 8 chars), created_at, last_used_at, and is_active status
- **FR-010**: System MUST allow users to generate new API keys with required descriptive name, displaying the full key exactly once upon creation
- **FR-011**: System MUST generate API keys in format `sk_[tier]_[32-character-base62-string]` where tier is one of: test, live
- **FR-012**: System MUST hash API keys using SHA-256 before storage, storing only hash and prefix in database
- **FR-013**: System MUST allow users to revoke API keys, immediately setting is_active=false and preventing further use
- **FR-014**: System MUST update last_used_at timestamp each time an API key successfully authenticates a request
- **FR-015**: System MUST enforce maximum 10 active API keys per user account

#### Payment Integration (Phase 6)

- **FR-016**: System MUST integrate DodoPayments SDK in both frontend (checkout) and backend (webhook handling)
- **FR-017**: System MUST provide billing page at /dashboard/billing displaying current subscription tier, next billing date (if paid), payment method (last 4 digits), and upgrade/downgrade options
- **FR-018**: System MUST display pricing tiers: Free ($0/mo, 100 PDFs), Starter ($29/mo, 5,000 PDFs), Pro ($149/mo, 50,000 PDFs), Enterprise ($499/mo, 500,000 PDFs)
- **FR-019**: System MUST create checkout flow at /checkout redirecting to DodoPayments hosted checkout page with pre-filled subscription tier and amount
- **FR-020**: System MUST implement webhook handler at /api/webhooks/dodo handling events: subscription.created, subscription.updated, subscription.cancelled, payment.succeeded, payment.failed
- **FR-021**: System MUST verify webhook signatures using DodoPayments webhook secret to prevent spoofing
- **FR-022**: System MUST update subscriptions table upon receiving subscription.created webhook with: user_id, plan_id, status="active", dodo_subscription_id, current_period_start, current_period_end
- **FR-023**: System MUST handle payment.failed webhook by updating subscription status to "past_due" and sending user notification email
- **FR-024**: System MUST handle subscription.cancelled webhook by scheduling subscription downgrade to free tier at current_period_end date
- **FR-025**: System MUST display subscription management UI allowing users to view invoices, update payment method, and cancel subscription
- **FR-026**: System MUST prevent API key usage when subscription status is "cancelled" or "past_due" for more than 3 days

#### Monitoring & Observability (Phase 9)

- **FR-027**: System MUST integrate Sentry SDK in both Next.js frontend (@sentry/nextjs) and Cloudflare Workers backend (@sentry/node or compatible)
- **FR-028**: System MUST configure Sentry DSN via environment variables (SENTRY_DSN) with separate projects for frontend and backend
- **FR-029**: System MUST capture all unhandled errors and rejected promises, sending them to Sentry with context: user_id, request_id, environment, timestamp
- **FR-030**: System MUST implement structured logging in Cloudflare Workers using console.log with JSON format including: level (info/warn/error), timestamp, context, message
- **FR-031**: System MUST tag Sentry errors with: environment (production/staging/development), user_id, api_key_id, feature (pdf-generation, auth, payment)
- **FR-032**: System MUST set up Sentry alerts for: error rate spike (>10 errors/min), P95 latency exceeding 3s, payment webhook failures
- **FR-033**: System MUST sanitize sensitive data before logging: mask API keys (show prefix only), mask payment details, hash email addresses in logs
- **FR-034**: System MUST track custom metrics in Sentry: PDF generation success rate, average generation time, browser pool utilization, quota enforcement hits

#### Testing & QA (Phase 8)

- **FR-035**: System MUST implement Playwright E2E test suite covering: signup flow (5 tests), login flow (3 tests), API key management (4 tests), PDF generation (6 tests), payment flow (5 tests)
- **FR-036**: System MUST configure Playwright to run tests against local development server using test database and DodoPayments sandbox credentials
- **FR-037**: System MUST capture test artifacts on failure: screenshots, video recordings, browser traces, and console logs
- **FR-038**: System MUST implement integration tests for webhook handlers verifying: signature validation, idempotency, database updates, error handling
- **FR-039**: System MUST implement unit tests for critical business logic: quota enforcement, API key validation, rate limiting, subscription tier calculations achieving minimum 60% code coverage
- **FR-040**: System MUST set up CI/CD pipeline to run all tests (unit, integration, E2E) on pull requests, blocking merge if tests fail
- **FR-041**: System MUST implement performance test suite using k6 or Artillery measuring P50/P95/P99 latencies under load (100 concurrent users)
- **FR-042**: System MUST run security audit using automated tools: npm audit, Snyk, or Dependabot checking for vulnerable dependencies

#### Documentation (Step 10)

- **FR-043**: System MUST create documentation landing page at /docs with navigation to: Getting Started, API Reference, Authentication Guide, Error Codes, Troubleshooting
- **FR-044**: System MUST provide API Reference pages documenting each endpoint with: HTTP method, URL, authentication requirements, request parameters, response format, example request/response
- **FR-045**: System MUST provide code examples in JavaScript, Python, PHP, and Ruby for each API endpoint, using syntax-highlighted code blocks with copy button
- **FR-046**: System MUST implement documentation search functionality indexing all pages and returning relevant results with highlighted matches
- **FR-047**: System MUST create troubleshooting guide covering common errors: authentication failures, quota exceeded, invalid HTML input, timeout errors with causes and solutions
- **FR-048**: System MUST version documentation (v1) with clear indicators when viewing older versions and upgrade guides

#### Design System Completion (Step 6)

- **FR-049**: System MUST define complete OKLCH gray scale from 50 to 950 in Tailwind config with perceptually uniform lightness steps
- **FR-050**: System MUST implement elevation system using OKLCH lightness manipulation with documented levels: 0 (base), 1 (raised), 2 (overlay), 3 (modal)
- **FR-051**: System MUST validate all text/background color combinations meet WCAG AAA contrast ratio (7:1 for normal text, 4.5:1 for large text)
- **FR-052**: System MUST implement dark mode by transforming OKLCH colors: adjusting lightness inversely while preserving chroma and hue relationships
- **FR-053**: System MUST document design system in /docs/design-system showing: color palette (OKLCH values), elevation levels, spacing scale, typography scale, component variants

#### Performance Optimization

- **FR-054**: System MUST achieve P95 latency under 2.0 seconds for PDF generation measured from API request to response
- **FR-055**: System MUST maintain browser pool reuse rate above 80% measured as (reused sessions / total sessions)
- **FR-056**: System MUST implement CDN caching for R2 PDF URLs with 24-hour cache lifetime reducing latency for repeated access
- **FR-057**: System MUST implement PDF caching table (pdf_cache) storing html_hash -> pdf_url mapping with 1-hour expiration, returning cached PDFs for identical HTML
- **FR-058**: System MUST measure and report throughput sustaining minimum 100 PDFs/minute under load test conditions

### Key Entities

- **User Account**: Represents a registered user with email, password_hash, subscription tier, account status (active/suspended), created_at timestamp, and authentication metadata
- **API Key**: Represents an authentication credential with user_id (owner), key_hash (SHA-256), key_prefix (first 8 chars for identification), name (descriptive label), is_active status, created_at timestamp, last_used_at timestamp
- **Subscription**: Represents a user's billing subscription with user_id, plan_id (free/starter/pro/enterprise), status (active/past_due/cancelled), dodo_subscription_id (external reference), current_period_start, current_period_end, cancel_at_period_end flag
- **Usage Record**: Represents a single API request with user_id, api_key_id, pdf_size (bytes), generation_time (ms), html_hash, timestamp, success status
- **Payment Event**: Represents a webhook event from DodoPayments with event_type, dodo_subscription_id, payload (JSON), processed_at timestamp, idempotency_key
- **Error Log**: Represents a captured error with error_id (Sentry event ID), user_id, severity (info/warning/error/fatal), message, stack_trace, context (JSON), timestamp
- **Test Result**: Represents an E2E test execution with test_suite name, test_name, status (passed/failed/skipped), duration (ms), artifacts (screenshots/videos), executed_at timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete full signup flow (registration, email verification, first login) in under 3 minutes with 90% success rate
- **SC-002**: Users can generate and copy their first API key within 30 seconds of logging into dashboard
- **SC-003**: Users can complete upgrade from Free to Starter tier in under 2 minutes via DodoPayments checkout
- **SC-004**: System captures and reports 100% of production errors to Sentry with full context within 5 seconds of occurrence
- **SC-005**: E2E test suite runs in under 10 minutes with 95% pass rate on every commit to main branch
- **SC-006**: Developers can find relevant API documentation within 10 seconds using search functionality with 85% satisfaction rate
- **SC-007**: All text/background combinations meet WCAG AAA contrast standards validated by automated checker with 100% pass rate
- **SC-008**: P95 latency for PDF generation is under 2.0 seconds measured over 1-hour load test with 100 concurrent users
- **SC-009**: Webhook processing completes within 500ms for 95% of events preventing timeout issues
- **SC-010**: Authentication system maintains 99.9% uptime with average login time under 500ms
- **SC-011**: API key generation succeeds within 200ms for 99% of requests
- **SC-012**: Payment webhook handler processes events idempotently with zero duplicate subscription updates
- **SC-013**: Documentation code examples work correctly when executed without modification for all 4 languages (JavaScript, Python, PHP, Ruby)
- **SC-014**: User satisfaction rating for onboarding flow exceeds 4.5/5.0 based on post-signup survey
- **SC-015**: Support ticket volume related to authentication, payment, or API integration decreases by 60% after documentation launch
