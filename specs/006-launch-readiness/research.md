# Research Findings: Launch Readiness Implementation

**Feature**: 006-launch-readiness | **Date**: 2025-10-27
**Purpose**: Document technical decisions, best practices, and alternatives considered for implementing authentication, payment integration, monitoring, testing, documentation, design system, and performance optimization.

## Research Questions

Based on Technical Context, no clarifications were needed (all technologies specified in constitution). Research focused on best practices for:
1. Supabase Auth integration patterns in Next.js 15 App Router
2. DodoPayments webhook security and idempotency
3. Sentry configuration for Cloudflare Workers
4. Playwright E2E test patterns for authentication flows
5. OKLCH color system implementation for WCAG AAA compliance
6. Performance testing strategies for serverless environments

---

## R1: Supabase Auth with Next.js 15 App Router

**Question**: What is the recommended pattern for integrating Supabase Auth with Next.js 15 App Router, given the new server components paradigm?

**Decision**: Use @supabase/ssr package with separate client/server contexts

**Rationale**:
- **@supabase/ssr 0.5.2+** provides first-class support for Next.js 15 App Router
- Separate clients prevent cookie/session leakage between server and client components
- Middleware pattern enables route protection without page-level checks
- HTTP-only cookies provide CSRF protection automatically

**Implementation Pattern**:
```typescript
// apps/web/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// apps/web/src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) }
      }
    }
  )
}

// apps/web/src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(/* ... */)
  await supabase.auth.getSession() // Refreshes session if needed
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/auth/:path*']
}
```

**Alternatives Considered**:
1. **NextAuth.js** - Rejected: Adds unnecessary complexity. Supabase Auth provides email verification, password reset, and RLS integration out-of-the-box.
2. **Custom JWT handling** - Rejected: Reinventing the wheel. Supabase handles token refresh, expiration, and cookie management.
3. **Client-only auth** - Rejected: Security risk. Server-side session validation prevents token theft/manipulation.

**References**:
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## R2: DodoPayments Webhook Security & Idempotency

**Question**: How should DodoPayments webhooks be secured and made idempotent to prevent duplicate subscription updates or webhook replay attacks?

**Decision**: Use signature verification + idempotency keys with database constraints

**Rationale**:
- **Signature verification** prevents webhook spoofing (attacker cannot forge valid signatures)
- **Idempotency keys** prevent duplicate processing if webhook is retried
- **Database unique constraints** provide last line of defense against race conditions
- **Timestamp validation** prevents replay attacks (reject webhooks >5 minutes old)

**Implementation Pattern**:
```typescript
// apps/worker/src/webhooks/dodo.ts
import { createHmac } from 'node:crypto'

async function verifyWebhook(request: Request, secret: string): Promise<boolean> {
  const signature = request.headers.get('X-Dodo-Signature')
  const timestamp = request.headers.get('X-Dodo-Timestamp')
  const body = await request.text()

  // Prevent replay attacks: reject if >5 minutes old
  if (Date.now() - parseInt(timestamp!) > 300000) {
    throw new Error('Webhook timestamp too old')
  }

  // Verify HMAC signature
  const expectedSignature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')

  return signature === expectedSignature
}

async function handleWebhook(env: Env, payload: WebhookPayload) {
  const idempotencyKey = payload.id // DodoPayments event ID

  // Check if already processed
  const existing = await env.DB.query(
    'SELECT id FROM payment_events WHERE idempotency_key = $1',
    [idempotencyKey]
  )
  if (existing.rows.length > 0) {
    return new Response('Already processed', { status: 200 })
  }

  // Process webhook in transaction
  await env.DB.transaction(async (tx) => {
    // Insert payment event (unique constraint on idempotency_key)
    await tx.query(
      'INSERT INTO payment_events (idempotency_key, event_type, payload, processed_at) VALUES ($1, $2, $3, NOW())',
      [idempotencyKey, payload.type, payload]
    )

    // Update subscription
    if (payload.type === 'subscription.created') {
      await tx.query(
        'INSERT INTO subscriptions (user_id, plan_id, status, dodo_subscription_id, current_period_start, current_period_end) VALUES ($1, $2, $3, $4, $5, $6)',
        [payload.user_id, payload.plan_id, 'active', payload.subscription_id, payload.period_start, payload.period_end]
      )
    }
  })

  return new Response('OK', { status: 200 })
}
```

**Database Schema**:
```sql
-- supabase/migrations/20251027000003_add_payment_events.sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE, -- DodoPayments event ID
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_idempotency ON payment_events(idempotency_key);
```

**Alternatives Considered**:
1. **Redis-based idempotency** - Rejected: Adds dependency. PostgreSQL unique constraints are sufficient and more reliable.
2. **No signature verification** - Rejected: Security risk. Anyone could send fake webhooks to manipulate subscriptions.
3. **Application-level locks** - Rejected: Database transaction + unique constraint is simpler and handles distributed workers automatically.

**References**:
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices) (DodoPayments follows similar patterns)
- [Idempotency in Distributed Systems](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

---

## R3: Sentry Configuration for Cloudflare Workers

**Question**: What is the best approach for configuring Sentry error tracking in Cloudflare Workers, given the lack of Node.js runtime?

**Decision**: Use @sentry/browser SDK (not @sentry/node) with custom integrations for Workers

**Rationale**:
- **Cloudflare Workers use V8 isolates**, not Node.js - @sentry/node will fail
- **@sentry/browser** works in V8 environments and has smaller bundle size
- **Custom transport** needed to handle Workers' non-standard fetch behavior
- **Breadcrumbs integration** captures request context (headers, body, timing)

**Implementation Pattern**:
```typescript
// apps/worker/src/lib/monitoring.ts
import * as Sentry from '@sentry/browser'

export function initSentry(env: Env) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'production',
    beforeSend(event, hint) {
      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['x-api-key']
      }
      return event
    },
    integrations: [
      new Sentry.Integrations.Breadcrumbs({ console: false }) // Disable console breadcrumbs (too noisy)
    ]
  })
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('request', context)
    }
    Sentry.captureException(error)
  })
}

// apps/worker/src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    initSentry(env)

    try {
      // Handle request
      return await handleRequest(request, env)
    } catch (error) {
      captureError(error as Error, {
        url: request.url,
        method: request.method,
        user_id: context?.user_id,
        api_key_id: context?.api_key_id
      })
      throw error
    }
  }
}
```

**Alternatives Considered**:
1. **@sentry/node** - Rejected: Does not work in Cloudflare Workers (no Node.js APIs like fs, http)
2. **Custom error logging to R2** - Rejected: No real-time alerting, no error aggregation, no issue tracking
3. **Cloudflare Workers Logpush** - Rejected: No structured error tracking, difficult to debug, no user context

**References**:
- [Sentry Cloudflare Workers Guide](https://docs.sentry.io/platforms/javascript/guides/cloudflare-workers/)
- [Cloudflare Workers Runtime API](https://developers.cloudflare.com/workers/runtime-apis/)

---

## R4: Playwright E2E Patterns for Authentication Flows

**Question**: What are the best practices for testing authentication flows with Playwright, especially email verification which requires external email access?

**Decision**: Use Playwright fixtures with test-specific Supabase users + admin API for email access

**Rationale**:
- **Test fixtures** provide isolated user context per test (no shared state)
- **Supabase Admin API** can retrieve email verification links without actual email service
- **Storage state** allows reusing authenticated sessions across tests (faster execution)
- **Parallel execution** safe when each test has its own user account

**Implementation Pattern**:
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test fixture: authenticated user
test.use({
  storageState: async ({}, use) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin API
    )

    // Create test user
    const email = `test-${Date.now()}@example.com`
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true // Auto-verify for testing
    })

    // Sign in and get session
    const { data: session } = await supabase.auth.signInWithPassword({
      email,
      password: 'TestPassword123!'
    })

    // Save storage state for this test
    await use({
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [{
          name: 'supabase.auth.token',
          value: JSON.stringify(session)
        }]
      }]
    })

    // Cleanup: delete test user
    await supabase.auth.admin.deleteUser(user!.user.id)
  }
})

test('user can access dashboard after signup', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
  await expect(page.locator('[data-testid="user-email"]')).toBeVisible()
})
```

**Email Verification Test Pattern**:
```typescript
test('user receives verification email and can verify account', async ({ page }) => {
  const supabase = createClient(/* admin creds */)
  const email = `test-${Date.now()}@example.com`

  // Step 1: Sign up
  await page.goto('/signup')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', 'TestPassword123!')
  await page.click('[type="submit"]')

  // Step 2: Retrieve verification link from Supabase (no actual email service needed)
  const { data: user } = await supabase.auth.admin.getUserByEmail(email)
  const verificationToken = user!.user.email_confirm_token
  const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`

  // Step 3: Click verification link
  await page.goto(verificationLink)
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="verification-success"]')).toBeVisible()
})
```

**Alternatives Considered**:
1. **Mailinator/TempMail** - Rejected: External dependency, flaky, slow (adds 5-10s per test)
2. **Mocked email service** - Rejected: Doesn't test actual Supabase email flow, misses bugs
3. **Shared test user** - Rejected: Tests interfere with each other, race conditions, not parallelizable

**References**:
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)

---

## R5: OKLCH Color System for WCAG AAA Compliance

**Question**: How should the OKLCH color system be configured to ensure WCAG AAA contrast compliance (7:1 for normal text, 4.5:1 for large text) while maintaining perceptual uniformity?

**Decision**: Use OKLCH lightness-based scale with contrast validation utility

**Rationale**:
- **OKLCH lightness** directly correlates to perceived brightness (unlike HSL lightness)
- **Perceptual uniformity** means equal lightness steps produce equal brightness differences
- **Contrast calculation** in OKLCH space is more accurate than RGB-based calculations
- **Automated validation** prevents accidental contrast violations during development

**Implementation Pattern**:
```typescript
// packages/shared/src/utils/oklch.ts
type OKLCH = { l: number; c: number; h: number }

// WCAG AAA contrast ratio: 7:1 for normal text, 4.5:1 for large text
export function contrastRatio(color1: OKLCH, color2: OKLCH): number {
  // Convert OKLCH lightness to relative luminance
  const l1 = relativeLuminance(color1.l)
  const l2 = relativeLuminance(color2.l)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(lightness: number): number {
  // OKLCH lightness (0-1) maps to relative luminance
  // Formula derived from WCAG 2.1 specifications
  return Math.pow(lightness, 2.2)
}

export function meetsWCAGAAA(foreground: OKLCH, background: OKLCH, largeText: boolean = false): boolean {
  const ratio = contrastRatio(foreground, background)
  return largeText ? ratio >= 4.5 : ratio >= 7.0
}

// Generate perceptually uniform gray scale
export function generateGrayScale(): Record<string, OKLCH> {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  return Object.fromEntries(
    steps.map(step => {
      const lightness = 1 - (step / 1000) // 50 = 0.95, 950 = 0.05
      return [step, { l: lightness, c: 0, h: 0 }] // Zero chroma for pure gray
    })
  )
}
```

**Tailwind Config**:
```typescript
// apps/web/tailwind.config.ts
import { generateGrayScale } from '@speedstein/shared/utils/oklch'

const oklchGrays = generateGrayScale()

export default {
  theme: {
    extend: {
      colors: {
        gray: Object.fromEntries(
          Object.entries(oklchGrays).map(([step, { l, c, h }]) => [
            step,
            `oklch(${l} ${c} ${h}deg)`
          ])
        ),
        primary: {
          DEFAULT: 'oklch(0.60 0.20 280deg)', // Blue
          foreground: 'oklch(1.00 0 0deg)'    // White (7:1 contrast)
        },
        background: 'oklch(1.00 0 0deg)',     // White
        foreground: 'oklch(0.20 0 0deg)'      // Near-black (18:1 contrast)
      }
    }
  }
}
```

**Automated Validation**:
```typescript
// tests/unit/contrast-validation.test.ts
import { test, expect } from 'vitest'
import { meetsWCAGAAA } from '@speedstein/shared/utils/oklch'
import colors from '../../tailwind.config'

test('all color combinations meet WCAG AAA contrast', () => {
  const background = { l: 1.0, c: 0, h: 0 } // White background

  Object.entries(colors.theme.extend.colors).forEach(([name, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([shade, color]) => {
        const { l, c, h } = parseOKLCH(color)
        const ratio = contrastRatio({ l, c, h }, background)
        expect(ratio).toBeGreaterThanOrEqual(7.0) // WCAG AAA
      })
    }
  })
})
```

**Alternatives Considered**:
1. **HSL color space** - Rejected: Not perceptually uniform. HSL lightness 50% produces wildly different brightnesses across hues.
2. **RGB with manual contrast checking** - Rejected: Tedious, error-prone, no tooling support for OKLCH.
3. **Design tokens without validation** - Rejected: No automated enforcement leads to accidental violations.

**References**:
- [OKLCH Color Picker](https://oklch.com/)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/#lab-colors)

---

## R6: Performance Testing for Serverless Environments

**Question**: What tools and patterns should be used for performance testing Cloudflare Workers, given the distributed, serverless nature of the platform?

**Decision**: Use k6 with Cloudflare-specific metrics and distributed load generation

**Rationale**:
- **k6** supports high concurrency (100k+ VUs) with low overhead
- **Scripting in JavaScript** matches team's skill set (TypeScript/JS project)
- **Cloud execution** via k6 Cloud enables distributed load generation from multiple regions
- **Custom metrics** can track Cloudflare-specific data (cf-cache-status, cf-ray)

**Implementation Pattern**:
```javascript
// tests/performance/load-test.k6.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const pdfGenerationTime = new Trend('pdf_generation_time')

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp-up to 50 users
    { duration: '5m', target: 100 }, // Sustain 100 users
    { duration: '2m', target: 0 }    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // P95 < 2s
    'http_req_duration': ['p(50)<1500'], // P50 < 1.5s
    'http_req_duration': ['p(99)<3000'], // P99 < 3s
    'errors': ['rate<0.05'],             // Error rate < 5%
    'pdf_generation_time': ['p(95)<2000']
  }
}

export default function() {
  const url = __ENV.API_URL || 'https://speedstein.com/api/generate'
  const apiKey = __ENV.API_KEY || 'sk_test_...'

  const payload = JSON.stringify({
    html: '<h1>Load Test PDF</h1><p>Generated at ' + new Date().toISOString() + '</p>',
    options: { format: 'A4', margin: { top: '1in' } }
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  }

  const start = Date.now()
  const res = http.post(url, payload, params)
  const duration = Date.now() - start

  pdfGenerationTime.add(duration)

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has PDF content': (r) => r.headers['Content-Type'] === 'application/pdf',
    'P95 < 2s': (r) => duration < 2000
  })

  errorRate.add(!success)

  // Extract Cloudflare metadata
  const cfRay = res.headers['cf-ray']
  const cfCacheStatus = res.headers['cf-cache-status']

  // Log slow requests
  if (duration > 2000) {
    console.log(`SLOW REQUEST: ${duration}ms (cf-ray: ${cfRay}, cache: ${cfCacheStatus})`)
  }

  sleep(1) // 1 second between requests per user
}
```

**Baseline Establishment**:
```json
// tests/performance/baseline.json
{
  "version": "1.0.0",
  "timestamp": "2025-10-27T00:00:00Z",
  "environment": "production",
  "metrics": {
    "p50_latency_ms": 1200,
    "p95_latency_ms": 1800,
    "p99_latency_ms": 2500,
    "throughput_pdfs_per_min": 120,
    "error_rate_percent": 0.5,
    "browser_reuse_rate_percent": 85
  },
  "conditions": {
    "concurrent_users": 100,
    "test_duration_minutes": 5,
    "regions": ["us-east", "eu-west", "ap-southeast"]
  }
}
```

**Monitoring Integration**:
```typescript
// apps/worker/src/lib/monitoring.ts
export function trackPerformanceMetrics(request: Request, response: Response, duration: number) {
  const metrics = {
    timestamp: Date.now(),
    url: request.url,
    method: request.method,
    status: response.status,
    duration_ms: duration,
    cache_status: response.headers.get('cf-cache-status'),
    ray_id: response.headers.get('cf-ray')
  }

  // Send to Sentry as custom measurement
  Sentry.setMeasurement('pdf_generation_time', duration, 'millisecond')

  // Log structured metric
  console.log(JSON.stringify({
    level: 'info',
    type: 'performance_metric',
    ...metrics
  }))
}
```

**Alternatives Considered**:
1. **Artillery** - Rejected: Less mature for Cloudflare Workers, weaker TypeScript support
2. **Apache JMeter** - Rejected: Java-based, heavyweight, poor developer experience
3. **Locust (Python)** - Rejected: Team uses TypeScript/JavaScript, adds language complexity

**References**:
- [k6 Documentation](https://k6.io/docs/)
- [Cloudflare Workers Performance Best Practices](https://developers.cloudflare.com/workers/platform/limits/)

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Authentication** | Supabase Auth with @supabase/ssr | Native Next.js 15 support, RLS integration, secure cookie handling |
| **Payment Webhooks** | Signature verification + idempotency keys | Prevents spoofing and duplicate processing |
| **Monitoring** | Sentry with @sentry/browser (not node) | Compatible with Cloudflare Workers V8 runtime |
| **E2E Testing** | Playwright with Supabase Admin API | Fast, parallelizable, no external email dependency |
| **Color System** | OKLCH lightness-based scale + validation | Perceptual uniformity, accurate contrast calculations, automated WCAG AAA compliance |
| **Performance Testing** | k6 with distributed load generation | High concurrency, Cloudflare-compatible, JavaScript scripting |

All decisions align with the Speedstein Constitution (performance first, security mandatory, OKLCH only, technology stack constraints) and leverage existing infrastructure where possible to minimize complexity.

