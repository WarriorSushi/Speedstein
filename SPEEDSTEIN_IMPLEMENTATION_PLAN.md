# Speedstein Implementation Plan
## Step-by-Step Development Guide

**Objective:** Build a production-ready PDF generation API using Next.js 15, Cloudflare Workers, Cap'n Web, and Supabase.

**Estimated Timeline:** 4-6 weeks  
**Tech Stack:** See SPEEDSTEIN_TECHSTACK.md

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20+ installed
- Git installed
- Cloudflare account (free tier works)
- Supabase account (free tier works)
- DodoPayments account
- Domain speedstein.com configured in Cloudflare

---

## Phase 1: Initial Setup (Week 1)

### Step 1: Repository Setup
Create a new Git repository for the project with the following structure:
- Initialize a new Next.js 15 project using App Router
- Set up a monorepo structure with separate directories for frontend and backend
- Configure TypeScript with strict mode enabled
- Install essential dependencies: Next.js, React, Tailwind CSS, shadcn/ui
- Set up ESLint and Prettier for code consistency
- Create a README with basic project information

### Step 2: Download and Study Cap'n Web
Clone the Cap'n Web repository to understand its architecture:
- Clone cloudflare/capnweb from GitHub
- Read through the main README to understand core concepts
- Study the examples directory, particularly the WebSocket and HTTP batch examples
- Review the TypeScript types to understand the API surface
- Run the example projects locally to see Cap'n Web in action
- Take notes on how RpcTarget, RpcStub, and promise pipelining work
- Understand the difference between HTTP Batch mode and WebSocket mode

### Step 3: Supabase Project Setup
Create and configure your Supabase database:
- Create a new Supabase project
- Save the project URL and anon key
- Navigate to the SQL Editor
- Create the users table with id, email, name, timestamps
- Create the api_keys table with user foreign key, key hash, prefix, and metadata
- Create the subscriptions table with plan info and DodoPayments integration fields
- Create the usage_records table for tracking PDF generation
- Enable Row Level Security on all tables
- Write RLS policies so users can only access their own data
- Set up database indexes on frequently queried columns (user_id, created_at, key_hash)
- Test RLS policies by creating test users and verifying data isolation

### Step 4: Supabase Auth Configuration
Set up authentication system:
- Enable Email/Password authentication provider in Supabase dashboard
- Configure email templates for signup and password reset
- Set up email redirects to point to your domain
- Configure site URL and redirect URLs
- Enable email confirmations for new signups
- Set session timeout and refresh token settings
- Test the authentication flow manually using Supabase dashboard

### Step 5: Local Development Environment
Set up your local development environment:
- Create a dot-env file for environment variables
- Add Supabase URL, anon key, and service key
- Add placeholder values for DodoPayments API keys
- Set up Next.js development server with proper environment variable loading
- Configure hot module replacement for faster development
- Set up a local HTTPS proxy if needed for testing secure contexts
- Install browser extensions for debugging (React DevTools, etc.)

---

## Phase 2: Landing Page (Week 1-2)

### Step 6: Design System Setup
Implement the OKLCH color system and shadcn/ui:
- Install shadcn/ui CLI and initialize the project
- Create a custom Tailwind config with OKLCH color tokens
- Define the complete gray scale from 50 to 950 using OKLCH
- Define primary brand color (blue) across all shades
- Define success (green), warning (amber), and error (red) color scales
- Set up CSS custom properties for light and dark themes
- Implement theme toggle component using next-themes
- Create elevation utilities using OKLCH lightness manipulation
- Test all colors for WCAG AAA contrast compliance
- Document the color system in a Storybook or style guide

### Step 7: Component Library
Build reusable UI components using shadcn/ui:
- Install and configure all needed shadcn/ui components: Button, Card, Input, Label, Dropdown, Dialog, Toast
- Create custom variants for primary, secondary, ghost, and destructive buttons
- Build a consistent spacing system using Tailwind spacing scale
- Create typography components with proper hierarchy (h1 through h6, body, caption)
- Build a responsive navigation component with mobile menu
- Create a footer component with links to docs, pricing, support
- Build a theme toggle button that smoothly transitions between light and dark
- Create loading skeletons for async content
- Build error state components
- Test all components in both light and dark modes

### Step 8: Hero Section with Live Demo
Create an interactive landing page:
- Design a hero section with headline "The Fastest PDF API" and value proposition
- Build a two-column layout: left side has code editor, right side shows live PDF preview
- Implement a draggable HTML editor using Monaco Editor or CodeMirror
- Pre-populate the editor with a beautiful example HTML template (invoice or report)
- Add syntax highlighting for HTML, CSS, and JavaScript
- Create a "Generate PDF" button that calls your API
- Display the generated PDF in an embedded iframe viewer
- Show generation time prominently (e.g., "Generated in 1.2 seconds")
- Add a loading spinner during PDF generation
- Allow users to download the generated PDF
- Include social proof: "100+ PDFs/minute" and "5x faster than competitors"
- Make the demo fully responsive for mobile devices

### Step 9: Pricing Section
Build a compelling pricing page:
- Create four pricing tiers: Free, Starter, Pro, Enterprise
- Display each tier in a card with plan name, price, and feature list
- Highlight the most popular plan (Starter) with a badge
- Include a comparison table showing features across all plans
- Add a monthly/annual toggle with discount shown for annual billing
- Include clear call-to-action buttons: "Start Free" and "Upgrade Now"
- Add a FAQ section addressing common questions about pricing
- Include a cost calculator: user inputs expected PDF volume, see recommended plan
- Make pricing cards responsive and use subtle elevation effects
- Add smooth animations when switching between monthly/annual view

### Step 10: Documentation Links
Create a comprehensive docs section:
- Build a documentation homepage with three main sections: Getting Started, API Reference, Examples
- Link to the SPEEDSTEIN_API_REFERENCE.md content
- Create quickstart guides for popular languages: JavaScript, Python, PHP, Ruby
- Add code examples for common use cases: invoices, reports, receipts
- Build a searchable API endpoint list with descriptions
- Include webhook documentation
- Add troubleshooting guides for common errors
- Create a video tutorial showing how to generate your first PDF
- Implement a search function using Algolia or simple client-side search
- Make docs mobile-friendly with collapsible navigation

### Step 11: SEO Optimization
Optimize the site for search engines:
- Add Next.js metadata API for title, description, OpenGraph tags
- Create a sitemap XML file with all public pages
- Add robots.txt allowing all crawlers
- Implement structured data (JSON-LD) for the homepage and pricing page
- Optimize images: use next/image for automatic optimization, add alt text
- Add canonical URLs to prevent duplicate content issues
- Implement lazy loading for below-the-fold images
- Add prefetch hints for critical assets
- Set up Google Analytics and Google Search Console
- Create a blog section for SEO content (optional but recommended)
- Write blog posts: "How to Generate PDFs 5x Faster" and "PDF API Comparison Guide"

### Step 12: Performance Optimization
Make the site blazingly fast:
- Use Next.js Image component for all images with proper sizing
- Implement code splitting by route
- Enable Incremental Static Regeneration for landing page
- Add service worker for offline support (optional)
- Minimize JavaScript bundle size: analyze with Webpack Bundle Analyzer
- Enable Brotli compression for text assets
- Use CSS-in-JS or Tailwind purge to remove unused styles
- Add resource hints: dns-prefetch, preconnect, preload
- Optimize fonts: use next/font with display:swap
- Aim for Lighthouse score of 95+ on all metrics
- Test on slow 3G connection to ensure fast loading

---

## Phase 3: Authentication & Dashboard (Week 2)

### Step 13: Signup Flow
Build user registration:
- Create a signup page at /signup
- Add a form with email, password, and confirm password fields
- Implement client-side validation: email format, password strength (min 8 chars, uppercase, lowercase, number)
- Use Supabase Auth to create new user accounts
- Handle errors gracefully: email already exists, weak password, network errors
- Send email confirmation and redirect user to check email page
- Implement email verification by clicking link in email
- Redirect verified users to onboarding or dashboard
- Add social login options: Google, GitHub (optional)
- Track signup events in analytics

### Step 14: Login Flow
Build user authentication:
- Create a login page at /login
- Add email and password input fields
- Implement "Remember Me" checkbox that extends session duration
- Use Supabase Auth to authenticate users
- Handle errors: invalid credentials, unverified email, too many attempts
- Redirect authenticated users to dashboard
- Add "Forgot Password" link that opens password reset flow
- Implement password reset by sending email with reset link
- Create password reset page that accepts new password
- Add loading state while authenticating
- Track login events in analytics

### Step 15: Protected Routes
Secure the dashboard and API routes:
- Create a middleware that checks Supabase session on protected routes
- Redirect unauthenticated users to login page
- Store redirect URL so users return to intended page after login
- Create a session provider component that wraps the entire app
- Implement automatic token refresh before expiration
- Add session timeout warning: "Your session will expire in 5 minutes"
- Allow session extension by clicking "Stay Logged In"
- Log out users and clear session on timeout or manual logout
- Test protected routes by attempting access without authentication

### Step 16: Dashboard Layout
Create the main dashboard UI:
- Build a two-column layout: sidebar navigation on left, main content on right
- Add navigation links: Overview, API Keys, Usage, Billing, Settings
- Highlight active navigation item
- Include user profile dropdown in top-right corner with name, email, logout option
- Add theme toggle in sidebar or top bar
- Create a breadcrumb navigation for nested pages
- Make sidebar collapsible on mobile with hamburger menu
- Add smooth transitions when switching between pages
- Include a "What's New" badge on navigation items when features are added

### Step 17: Dashboard Overview Page
Create an overview dashboard:
- Display current plan tier prominently (Free, Starter, Pro, Enterprise)
- Show usage statistics: PDFs generated this month, PDFs remaining, usage percentage
- Create a progress bar showing usage (e.g., "1,250 / 5,000 PDFs used")
- Display a line chart showing PDF generation over the last 30 days
- Show quick stats: total PDFs generated, average generation time, current rate limit
- Add quick action buttons: "Generate PDF" and "View API Docs"
- Display recent PDF generations in a table with timestamp, size, and download link
- Include an upgrade prompt if user is near quota: "You've used 90% of your monthly PDFs. Upgrade to Pro?"
- Make all stats update in real-time using Supabase real-time subscriptions
- Add loading skeletons while data is fetching

### Step 18: API Keys Management
Build API key creation and management:
- Create an API Keys page at /dashboard/api-keys
- Display all existing API keys in a table with name, prefix, created date, last used date
- Add a "Create New API Key" button that opens a dialog
- In the dialog, allow user to name the key (e.g., "Production API Key")
- Generate a secure random API key with format sk_live_xxxxxxxxxxxxx (or sk_test for test keys)
- Display the full API key ONLY once immediately after creation with copy button
- Show a warning: "Save this key now. You won't be able to see it again."
- Hash the API key using SHA-256 before storing in database
- Store only the key hash and key prefix (first 8 characters) in database
- Add a "Revoke" button for each API key that disables it
- Show confirmation dialog before revoking: "Are you sure? This cannot be undone."
- Allow filtering keys by active/revoked status
- Track when each key was last used and display in table
- Add pagination if user has many keys

---

## Phase 4: Cloudflare Workers (Week 3)

### Step 19: Cloudflare Workers Setup
Set up the backend infrastructure:
- Create a new Cloudflare Workers project using Wrangler CLI
- Initialize wrangler.toml configuration file
- Configure environment variables: Supabase URL, Supabase service key, DodoPayments API key
- Set up KV namespace for rate limiting and API key caching
- Configure R2 bucket for PDF storage
- Enable Cloudflare Browser Rendering API in your account
- Set up custom domain routing: api.speedstein.com -> Worker
- Configure CORS headers to allow requests from speedstein.com
- Add health check endpoint at /health that returns 200 OK
- Deploy the Worker and test it returns the health check response

### Step 20: Cap'n Web RPC Implementation
Build the core PDF generation service:
- Install capnweb npm package in the Worker project
- Create a class PdfGeneratorApi that extends RpcTarget from capnweb
- Implement the constructor that accepts env (for accessing KV, R2, Browser API)
- Create a generatePdf method that accepts html string and options object
- Inside generatePdf, use Cloudflare Browser Rendering API to launch a browser page
- Set the HTML content on the page using page.setContent with waitUntil networkidle
- Call page.pdf with the user's options (format, margin, printBackground, etc.)
- Generate the PDF as a buffer
- Upload the PDF buffer to Cloudflare R2 with a unique filename (use UUID)
- Generate a public URL for the PDF using R2 bucket URL
- Return a PdfResult object with success, url, size, and generated_at timestamp
- Always close the browser page in a finally block to prevent memory leaks
- Handle errors gracefully and return error information in the result

### Step 21: Cap'n Web Session Management
Implement efficient browser session reuse:
- Create a browser instance manager that keeps a pool of warm browser instances
- Reuse browser instances across multiple PDF generation requests
- Set a maximum session lifetime (e.g., 5 minutes) before recycling
- Implement a cleanup mechanism that closes idle browser instances after 1 minute
- Track active sessions and browser instance usage in logs
- Add monitoring to alert if browser instance pool is exhausted
- Implement session limits per user to prevent abuse (e.g., max 10 concurrent sessions)

### Step 22: HTTP Batch RPC Endpoint
Add HTTP Batch support for REST clients:
- Create a fetch handler in the Worker that listens for POST requests to /api/rpc
- Use newWorkersRpcResponse from capnweb to handle the request
- Pass an instance of PdfGeneratorApi as the RPC target
- This automatically handles both HTTP Batch and WebSocket upgrade requests
- Test the endpoint using curl with a simple PDF generation request
- Verify promise pipelining works by making multiple chained calls in one request

### Step 23: REST API Wrapper
Build a simple REST API for standard HTTP clients:
- Create a REST endpoint at /api/generate that accepts POST requests
- Parse the request body as JSON containing html and options
- Validate the HTML is present and not empty, return 400 error if invalid
- Check HTML size is under 5MB, return 400 error if too large
- Validate options object using Zod schema
- Internally use Cap'n Web HTTP Batch mode to call PdfGeneratorApi
- Return the PDF result as JSON with pdf_url, size, generated_at
- Add proper CORS headers
- Test the endpoint using Postman or curl

### Step 24: Batch Generation Endpoint
Add batch PDF generation:
- Create a REST endpoint at /api/batch that accepts POST requests
- Parse request body containing an array of jobs (max 100 jobs)
- Return 400 error if more than 100 jobs submitted
- Use PdfGeneratorApi.generateBatch method to process all jobs in parallel
- Use Cap'n Web promise pipelining to batch all jobs in one round trip
- Return an array of results with pdf_url for each job
- Include metadata field in each job so users can track which PDF is which
- Track total generation time and include in response
- Test with multiple jobs and verify all PDFs are generated correctly

---

## Phase 5: Authentication & Authorization (Week 3-4)

### Step 25: API Key Middleware
Implement API key authentication:
- Create a middleware function that runs on all /api requests
- Extract API key from Authorization header (Bearer token) or query parameter
- Hash the provided API key using SHA-256
- Look up the key hash in Supabase api_keys table
- Cache successful lookups in Cloudflare KV for 5 minutes to reduce database hits
- Return 401 Unauthorized if key not found or inactive
- Add the user_id from the API key to the request context for downstream handlers
- Update last_used_at timestamp for the API key
- Log all authentication attempts for security auditing

### Step 26: Rate Limiting
Implement per-user rate limiting:
- Use Cloudflare Rate Limiting API to enforce limits based on plan tier
- Create rate limit buckets per API key: free (10/min), starter (50/min), pro (200/min), enterprise (1000/min)
- Use a sliding window algorithm to count requests
- Store rate limit counters in Cloudflare KV with TTL of 60 seconds
- Return 429 Too Many Requests when limit exceeded
- Include rate limit headers in all responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Add burst limit that allows temporary spikes (2x the per-minute limit)
- Test rate limiting by making rapid requests and verifying 429 is returned
- Log rate limit violations for monitoring

### Step 27: Usage Tracking
Track PDF generation for billing:
- After each successful PDF generation, record usage in Supabase usage_records table
- Store user_id, api_key_id, pdf_size, generation_time, created_at
- Use Supabase RLS to ensure users can only query their own usage records
- Create a cron trigger that runs daily to aggregate usage per user
- Check if user has exceeded their plan quota
- If quota exceeded, disable their API keys and send email notification
- Create a usage API endpoint at /api/usage that returns current period usage
- Calculate usage_percentage and pdfs_remaining
- Cache usage stats in KV for 1 minute to reduce database load
- Test by generating PDFs and verifying usage increments correctly

### Step 28: Plan Quotas
Enforce plan limits:
- Create a middleware that checks user's current plan and usage
- Query Supabase subscriptions table to get plan_id and current period
- Query usage_records table to count PDFs generated in current period
- Compare against plan quotas: free (100), starter (5000), pro (50000), enterprise (500000)
- Return 402 Payment Required if quota exceeded
- Include details in error response: pdfs_generated, pdfs_limit, period_end
- Allow a small overage buffer (e.g., 5%) before hard blocking
- Send warning emails at 80%, 90%, and 100% usage
- Test by manually setting a low quota and exceeding it

---

## Phase 6: Payment Integration (Week 4)

### Step 29: DodoPayments Integration
Connect to payment provider:
- Sign up for DodoPayments account and get API keys
- Install DodoPayments SDK in your Next.js project
- Create DodoPayments product catalog with four plans: Free, Starter, Pro, Enterprise
- Set pricing for each plan in DodoPayments dashboard
- Configure webhook URL: https://speedstein.com/api/webhooks/dodo
- Test webhook delivery using DodoPayments webhook testing tool
- Store DodoPayments product IDs in environment variables

### Step 30: Checkout Flow
Build the payment UI:
- Create a checkout page at /checkout with plan selection
- Display plan details: name, price, features, PDFs included
- Add a "Subscribe" button that redirects to DodoPayments hosted checkout
- Pass user's email and selected plan ID to DodoPayments
- Set success_url to /dashboard?success=true
- Set cancel_url to /pricing?cancelled=true
- Handle DodoPayments redirect back to success_url after payment
- Show success message and update user's subscription in database
- Send welcome email with subscription details

### Step 31: Webhook Handler
Process payment events:
- Create a webhook endpoint at /api/webhooks/dodo
- Verify webhook signature using DodoPayments SDK to ensure authenticity
- Parse the webhook payload for event type: subscription.created, subscription.updated, subscription.cancelled
- For subscription.created: create new subscription record in Supabase with user_id, plan_id, dodo_subscription_id
- For subscription.updated: update subscription plan_id and status
- For subscription.cancelled: set subscription status to cancelled and disable user's API keys
- For payment.failed: send email to user and set subscription to past_due status
- Return 200 OK to acknowledge webhook receipt
- Log all webhook events for debugging
- Test webhooks using DodoPayments test mode

### Step 32: Subscription Management
Allow users to manage their subscriptions:
- Create a billing page at /dashboard/billing
- Display current plan, billing period dates, and next renewal date
- Show payment method on file (last 4 digits of card)
- Add "Update Payment Method" button that opens DodoPayments portal
- Add "Change Plan" button that shows plan comparison and allows upgrade/downgrade
- For upgrades, charge prorated amount immediately and update subscription
- For downgrades, schedule change for next billing period
- Add "Cancel Subscription" button with confirmation dialog
- On cancellation, set subscription to cancel at end of period
- Allow reactivation of cancelled subscription before period ends
- Display past invoices in a table with download links
- Test the full flow: upgrade, downgrade, cancel, reactivate

---

## Phase 7: Advanced Features (Week 5)

### Step 33: WebSocket Support
Enable WebSocket connections for high-volume users:
- In the Cloudflare Worker fetch handler, check for Upgrade: websocket header
- Use newWorkersRpcResponse which automatically handles WebSocket upgrade
- Pass PdfGeneratorApi instance as the RPC target
- Test WebSocket connection using a client library
- Implement heartbeat/ping messages to keep connection alive
- Set connection timeout to 5 minutes
- Close idle connections automatically
- Track active WebSocket connections per user
- Limit concurrent WebSocket connections per user (e.g., max 5)
- Log WebSocket connection/disconnection events

### Step 34: Promise Pipelining Support
Enable advanced RPC features:
- Ensure PdfGeneratorApi methods return proper RpcPromise types
- Test promise pipelining: make dependent calls in one round trip
- Create example code showing how to chain generatePdf calls
- Add documentation explaining promise pipelining benefits
- Test batch generation with pipelining to verify performance improvement
- Measure latency: single call vs pipelined batch of 10 calls

### Step 35: PDF Caching (Optional)
Implement intelligent caching:
- Create a pdf_cache table in Supabase with html_hash, pdf_url, options_hash, expires_at
- Before generating a PDF, compute SHA-256 hash of html + options
- Query pdf_cache table for matching hash
- If cached PDF found and not expired, return cached URL immediately
- If not cached, generate PDF and store in cache with 24-hour expiration
- Add a cache TTL based on plan: free (24h), starter (7d), pro (30d), enterprise (90d)
- Create a cron job that deletes expired cache entries daily
- Add Cache-Hit header to responses: X-Cache: HIT or X-Cache: MISS
- Test caching by generating the same PDF twice and verifying second call is instant

### Step 36: Custom Fonts (Optional)
Allow users to upload custom fonts:
- Create a fonts upload page at /dashboard/fonts
- Allow users to upload TTF or WOFF2 font files (max 5MB per font)
- Store fonts in Cloudflare R2 bucket
- Create a fonts table in Supabase linking user_id to font URLs
- In PDF generation, inject custom font CSS using @font-face
- Fetch font files from R2 and embed in generated PDF
- Add font family dropdown in live demo on landing page
- Test by uploading a custom font and generating a PDF using it

### Step 37: Watermarks (Optional)
Add watermark support:
- Add watermark options to PdfOptions interface: text, image, position, opacity
- For text watermarks, inject CSS to position text on every page
- For image watermarks, fetch image from URL and embed in PDF
- Support positions: top-left, top-center, top-right, center, bottom-left, bottom-center, bottom-right
- Set opacity using CSS (0.1 to 1.0)
- Test watermarks with various positions and styles

---

## Phase 8: Testing & QA (Week 5-6)

### Step 38: Unit Tests
Write comprehensive unit tests:
- Set up Vitest for testing
- Write unit tests for API key validation logic
- Write unit tests for rate limiting calculations
- Write unit tests for usage tracking
- Write unit tests for PDF generation options validation
- Aim for 80%+ code coverage
- Run tests in CI/CD pipeline on every commit

### Step 39: Integration Tests
Test the full system:
- Create end-to-end tests using Playwright
- Test signup flow: create account, verify email, login
- Test API key creation: generate key, copy key, use key to call API
- Test PDF generation: submit HTML, verify PDF is generated and downloadable
- Test batch generation: submit 10 jobs, verify all PDFs generated
- Test rate limiting: exceed rate limit, verify 429 error
- Test quota enforcement: exceed plan quota, verify 402 error
- Test payment flow: upgrade plan, verify subscription updated
- Run integration tests nightly to catch regressions

### Step 40: Performance Testing
Benchmark the API:
- Use Apache Bench or k6 to load test the API
- Test single PDF generation latency: aim for P95 < 2 seconds
- Test batch generation throughput: aim for 100 PDFs/minute per browser instance
- Test WebSocket connection handling: open 100 concurrent connections
- Test rate limiting accuracy: verify rate limits are enforced correctly
- Identify bottlenecks using Cloudflare Workers analytics
- Optimize slow endpoints

### Step 41: Security Audit
Ensure the system is secure:
- Run OWASP ZAP scan on the web application
- Test for SQL injection vulnerabilities in Supabase queries (should be prevented by parameterized queries)
- Test for XSS vulnerabilities in HTML input (should be prevented by PDF generation, but verify)
- Test for CSRF vulnerabilities (should be prevented by CORS and token-based auth)
- Verify API keys are hashed and not stored in plain text
- Test rate limiting to ensure it cannot be bypassed
- Verify Row Level Security is working correctly in Supabase
- Test webhook signature verification
- Ensure HTTPS is enforced on all endpoints
- Review IAM permissions for Cloudflare and Supabase

---

## Phase 9: Monitoring & Observability (Week 6)

### Step 42: Logging
Set up comprehensive logging:
- Use Cloudflare Workers Analytics to log all requests
- Log all errors with stack traces
- Log API authentication attempts (success and failure)
- Log rate limit violations
- Log PDF generation times
- Log webhook events
- Use structured logging with JSON format for easy parsing
- Set up log retention policy (e.g., 30 days)

### Step 43: Error Tracking
Integrate error monitoring:
- Sign up for Sentry and create a new project
- Install Sentry SDK in Next.js and Cloudflare Workers
- Configure Sentry DSN in environment variables
- Set up error alerting: email or Slack notifications for critical errors
- Create custom error tags: user_id, plan, endpoint, error_type
- Set up source maps so stack traces show original TypeScript code
- Test error tracking by intentionally throwing an error and verifying it appears in Sentry

### Step 44: Metrics Dashboard
Build observability dashboards:
- Use Cloudflare Workers analytics dashboard for request metrics
- Create custom dashboard in Grafana or similar tool
- Display key metrics: requests per minute, error rate, P95 latency, active users
- Create charts showing PDF generation volume over time
- Display plan distribution: number of users on each plan
- Show revenue metrics: MRR, churn rate
- Set up alerts for anomalies: sudden spike in errors, latency increase, quota exhaustion
- Review dashboards weekly to identify issues

### Step 45: Uptime Monitoring
Ensure high availability:
- Set up uptime monitoring using UptimeRobot or Pingdom
- Monitor main endpoints: landing page, API health check, API generate endpoint
- Configure checks to run every 1 minute
- Set up alerts to email and Slack when downtime detected
- Create a status page at status.speedstein.com using Statuspage.io
- Display uptime percentage and recent incidents
- Link to status page from footer of website

---

## Phase 10: Launch Preparation (Week 6)

### Step 46: Documentation Polish
Finalize all documentation:
- Review and update API reference with all endpoints
- Create quickstart guides for each programming language
- Write tutorials for common use cases
- Record video walkthrough of creating first PDF
- Create FAQ page answering common questions
- Write troubleshooting guide for common errors
- Publish blog post announcing launch
- Create social media graphics for launch

### Step 47: Beta Testing
Get feedback before public launch:
- Recruit 10-20 beta users from your network or online communities
- Give beta users free Starter plan for 1 month
- Ask for feedback on API usability, documentation clarity, pricing
- Monitor beta user behavior: which features do they use, where do they get stuck
- Fix critical bugs found by beta testers
- Iterate on API design based on feedback
- Send thank you email to beta users with discount code for paid plan

### Step 48: Launch Checklist
Final pre-launch tasks:
- Verify all environment variables are set correctly in production
- Ensure Supabase database has proper indexes and RLS policies
- Test full signup and payment flow end-to-end
- Verify Cloudflare DNS is configured correctly
- Set up SSL certificate for api.speedstein.com
- Enable Cloudflare DDoS protection and WAF rules
- Test API from multiple geographic locations to ensure global availability
- Create launch announcement blog post
- Schedule social media posts for launch day
- Prepare email to send to beta users announcing public launch
- Set up Google Analytics and conversion tracking
- Create Product Hunt launch page
- Prepare support email templates for common questions

### Step 49: Launch
Go live with Speedstein:
- Deploy final version to production
- Announce launch on Twitter, LinkedIn, Hacker News, Product Hunt
- Send launch email to beta users and mailing list
- Monitor error logs and analytics closely for first 24 hours
- Be ready to respond quickly to support requests
- Fix any critical bugs discovered post-launch
- Celebrate the launch!

### Step 50: Post-Launch Iteration
Continuous improvement:
- Review analytics weekly: traffic, signups, conversions, churn
- Monitor support requests to identify common issues or feature requests
- Iterate on documentation based on user feedback
- Add new features to roadmap: webhooks, templates, AI-powered generation
- Optimize API performance based on real-world usage patterns
- Write case studies of successful customers
- Continue marketing efforts: SEO content, paid ads, partnerships
- Plan for next major version with advanced features

---

## Development Tips

### Using Claude Code CLI
For each step above, you can use Claude Code to generate the actual code. Here's how:

1. Open terminal in your project directory
2. Run: `claude-code "Implement Step X: [Step Title]"`
3. Claude Code will read this implementation plan and write the necessary code
4. Review the generated code and make any needed adjustments
5. Test the implementation before moving to the next step

Example:
```bash
claude-code "Implement Step 20: Cap'n Web RPC Implementation - create the PdfGeneratorApi class that extends RpcTarget and implements the generatePdf method using Cloudflare Browser Rendering API"
```

### Recommended Development Order
Follow the phases in order, but within each phase you can adjust the order if needed:
- Always complete setup steps first (Phase 1)
- Build frontend and backend in parallel if you have team members
- Test each feature immediately after implementing it
- Deploy to staging environment after each phase for integration testing

### Common Pitfalls to Avoid
- Don't skip RLS policies in Supabase - this is critical for security
- Don't store API keys in plain text - always hash them
- Don't forget to close browser instances after PDF generation - memory leaks!
- Don't skip rate limiting - this prevents abuse
- Don't launch without proper monitoring - you'll be flying blind

---

## Success Criteria

You'll know you're ready to launch when:
- [ ] All pages load in under 2 seconds (P95)
- [ ] Lighthouse score is 95+ on desktop and 90+ on mobile
- [ ] API generates PDFs in under 2 seconds (P95)
- [ ] All unit and integration tests pass
- [ ] Security audit shows no critical vulnerabilities
- [ ] Rate limiting works correctly for all plan tiers
- [ ] Payment flow works end-to-end with real credit cards
- [ ] Documentation is complete and accurate
- [ ] Beta testers are satisfied with the product
- [ ] Error rate is under 0.1%
- [ ] Uptime is 99.9%+

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 1 | Week 1 | Repository setup, Supabase database, local environment |
| Phase 2 | Week 1-2 | Landing page, live demo, pricing page, docs |
| Phase 3 | Week 2 | Authentication, dashboard, API key management |
| Phase 4 | Week 3 | Cloudflare Workers, Cap'n Web RPC, REST API |
| Phase 5 | Week 3-4 | API auth, rate limiting, usage tracking |
| Phase 6 | Week 4 | Payment integration, subscription management |
| Phase 7 | Week 5 | WebSocket support, advanced features |
| Phase 8 | Week 5-6 | Testing, QA, performance optimization |
| Phase 9 | Week 6 | Monitoring, error tracking, dashboards |
| Phase 10 | Week 6 | Beta testing, launch preparation, launch |

**Total Estimated Time:** 6 weeks for solo developer, 4 weeks with small team

---

## Next Steps

1. Read through this entire implementation plan
2. Review the SPEEDSTEIN_TECHNICAL_SPEC.md for technical details
3. Review the SPEEDSTEIN_API_REFERENCE.md to understand the API you're building
4. Review the SPEEDSTEIN_TECHSTACK.md to understand all technologies used
5. Start with Phase 1, Step 1: Repository Setup
6. Use Claude Code CLI to generate code for each step
7. Test frequently and deploy to staging after each phase
8. Launch with confidence!

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Author:** Implementation Team
