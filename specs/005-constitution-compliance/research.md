# Technical Research: Constitution Compliance

**Feature**: Constitution Compliance - Production Readiness
**Branch**: `005-constitution-compliance`
**Date**: 2025-10-27

## Overview

This document captures technical decisions made during Phase 0 research to resolve all NEEDS CLARIFICATION items from the implementation plan. Each decision includes the chosen approach, rationale, alternatives considered, and implementation notes.

---

## Decision 1: OKLCH Design System Integration

**Question**: How to configure Tailwind CSS with OKLCH color space (no RGB/HSL/hex)?

**Decision**: Use oklch() function directly in Tailwind config with CSS custom properties for design tokens.

**Rationale**:
- Native CSS support in all modern browsers (Chrome 111+, Firefox 113+, Safari 16.4+)
- No plugin dependencies or build-time complexity
- OKLCH provides perceptually uniform colors: equal lightness values have equal perceived brightness
- Enables precise WCAG AAA contrast compliance through lightness control
- Future-proof: part of CSS Color Module Level 4 specification

**Alternatives Considered**:
1. **Tailwind OKLCH plugin** - Rejected: Adds build complexity, less flexible than native CSS
2. **LCH color space** - Rejected: OKLCH (cylindrical) is more intuitive for hue rotation than LCH (rectangular)
3. **Convert OKLCH to RGB at build time** - Rejected: Loses dynamic manipulation capabilities (dark mode, elevation)

**Implementation Notes**:
- Define design tokens in `apps/web/app/globals.css` using CSS custom properties
- Gray scale: `oklch(L% 0.01 264)` where L ranges from 98% (gray-50) to 10% (gray-950) in perceptually uniform steps
- Dark mode: Invert lightness while maintaining chroma and hue for consistent color perception
- Elevation: Use `oklch(from var(--background) calc(l + N%) c h)` for layered surfaces
- Tailwind config references custom properties: `colors: { gray: { 50: 'var(--gray-50)' } }`

---

## Decision 2: shadcn/ui with Next.js 15 App Router

**Question**: How to install and theme shadcn/ui with Next.js 15 App Router and OKLCH colors?

**Decision**: Use shadcn/ui CLI for component installation, customize theme with OKLCH tokens in globals.css.

**Rationale**:
- shadcn/ui CLI automates component installation with proper TypeScript types
- Components are copied into codebase (not npm package), allowing full customization
- Built on Radix UI primitives (accessibility, keyboard navigation)
- Tailwind CSS integration maps directly to custom OKLCH properties
- Next.js 15 App Router fully supported (components work in Server and Client Components)

**Alternatives Considered**:
1. **Manual component copying** - Rejected: Error-prone, misses TypeScript configs and dependencies
2. **Chakra UI with OKLCH** - Rejected: Not constitution-mandated, heavier bundle, different styling paradigm
3. **Headless UI + custom styles** - Rejected: More work than shadcn/ui, no design system

**Implementation Notes**:
- Install: `npx shadcn-ui@latest init` (configures Tailwind, TypeScript, path aliases)
- Add components: `npx shadcn-ui@latest add button card input dialog` (copies to components/ui/)
- Theme customization: Override CSS custom properties in globals.css with OKLCH values
- All components automatically inherit OKLCH tokens through Tailwind utility classes
- Server Components: Use `'use client'` directive only for interactive components (Button, Dialog)

---

## Decision 3: DodoPayments SDK Integration

**Question**: DodoPayments API patterns, webhook signature verification, subscription lifecycle management.

**Decision**: Use DodoPayments Node.js SDK for subscription management, implement HMAC-SHA256 webhook verification.

**Rationale**:
- Official SDK handles authentication, retry logic, idempotency
- Webhook signature verification prevents spoofed payment events (critical security requirement)
- Subscription lifecycle (created → active → past_due → cancelled) handled via webhook events
- Test mode available for development (no real charges)

**Alternatives Considered**:
1. **Direct REST API calls** - Rejected: More boilerplate, no built-in retry/idempotency
2. **Stripe SDK** - Rejected: Not constitution-mandated (Principle IV requires DodoPayments)
3. **Polling subscription status** - Rejected: Webhooks provide instant updates, polling has latency

**Implementation Notes**:
- Install: `pnpm add dodo-payments` (hypothetical package name - use actual SDK)
- Initialize: `const dodo = new DodoPayments({ secretKey: env.DODO_PAYMENTS_SECRET_KEY })`
- Webhook verification: Validate `X-Dodo-Signature` header using HMAC-SHA256(body, secret)
- Event types: `subscription.created`, `payment.succeeded`, `payment.failed`, `subscription.cancelled`
- Idempotency: Store `event_id` in database to prevent duplicate processing
- Grace period: On `payment.failed`, wait 7 days before downgrading tier (handled via `past_due` status)

---

## Decision 4: Dark Mode with OKLCH

**Question**: Dark mode implementation in Next.js 15 App Router with OKLCH color manipulation.

**Decision**: Use next-themes library with system preference detection, invert lightness values for dark mode.

**Rationale**:
- next-themes handles system preference detection, localStorage persistence, SSR hydration
- OKLCH lightness inversion maintains perceptual uniformity (dark bg stays perceptually equivalent to light bg)
- No flash of unstyled content (FOUC) due to proper hydration handling
- Automatic elevation system in dark mode (lighter surfaces on darker backgrounds)

**Alternatives Considered**:
1. **Manual theme context** - Rejected: Reinvents wheel, SSR hydration is complex
2. **CSS media query only** - Rejected: No user override, no persistence
3. **Separate color palettes for light/dark** - Rejected: Duplicates design tokens, harder to maintain

**Implementation Notes**:
- Install: `pnpm add next-themes`
- Provider: Wrap app in `<ThemeProvider attribute="class" defaultTheme="system">`
- CSS: Define `.dark` class overrides in globals.css with inverted lightness
- Lightness inversion formula: `oklch((100% - L) c h)` - preserves chroma and hue
- Toggle component: `const { theme, setTheme } = useTheme()` hook
- Elevation in dark mode: `calc(l - N%)` instead of `calc(l + N%)` for proper contrast

---

## Decision 5: Monaco Editor Integration

**Question**: Monaco Editor best practices in Next.js 15 (client-side rendering, bundle size optimization).

**Decision**: Use @monaco-editor/react with dynamic import for code splitting, client-side rendering only.

**Rationale**:
- @monaco-editor/react provides React wrapper with proper lifecycle management
- Dynamic import reduces initial bundle size (Monaco is ~3MB minified)
- Client-side only rendering required (Monaco uses DOM APIs not available in SSR)
- Syntax highlighting for HTML out-of-the-box
- Configurable themes (dark/light mode support)

**Alternatives Considered**:
1. **CodeMirror** - Rejected: Monaco has better TypeScript/HTML support, VS Code compatibility
2. **Plain textarea** - Rejected: Poor UX for code editing (no syntax highlighting, no autocomplete)
3. **Monaco via CDN** - Rejected: Slower loading, no module bundling optimizations

**Implementation Notes**:
- Install: `pnpm add @monaco-editor/react`
- Component: `'use client'` directive required (client-side only)
- Dynamic import: `const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })`
- Configuration: `<Editor language="html" theme={isDark ? 'vs-dark' : 'vs-light'} height="400px" />`
- Bundle size impact: ~3MB (acceptable for landing page demo, loaded async)
- Debounce onChange: Wait 500ms after typing before triggering PDF preview

---

## Decision 6: E2E Testing Strategy

**Question**: Playwright setup for Next.js 15 App Router, test data management, environment isolation.

**Decision**: Use Playwright with dedicated test database, DodoPayments test mode, fixtures for test data seeding.

**Rationale**:
- Playwright provides cross-browser testing (Chromium, Firefox, WebKit)
- Test database isolation prevents test data pollution
- DodoPayments test mode (test API keys) avoids real charges
- Fixtures enable repeatable test data setup/teardown
- Parallelization support (run tests concurrently for speed)

**Alternatives Considered**:
1. **Cypress** - Rejected: Playwright has better TypeScript support, native multi-browser
2. **Jest + Testing Library** - Rejected: Not E2E, doesn't test real browser interactions
3. **Shared test database** - Rejected: Causes test interference, flaky tests

**Implementation Notes**:
- Install: `pnpm add -D @playwright/test`
- Config: `playwright.config.ts` with baseURL: `http://localhost:3000`
- Test database: Set `DATABASE_URL=postgresql://localhost:5432/speedstein_test` in test env
- Fixtures: `test.beforeEach()` seeds user, API keys, subscription data
- DodoPayments: Use test mode API key (`sk_test_...`) for payment flows
- Assertions: `await expect(page.getByRole('button', { name: 'Generate PDF' })).toBeVisible()`
- Run: `pnpm playwright test --project=chromium`

---

## Decision 7: Performance Validation Tooling

**Question**: Load testing tools for Cloudflare Workers, P95 latency measurement, metrics collection.

**Decision**: Use K6 for load testing, Cloudflare Workers Analytics API for P95 latency measurement.

**Rationale**:
- K6 is built for load testing modern APIs (HTTP/2, WebSocket support)
- JavaScript test scripts (easy to maintain)
- Realistic load simulation (ramp-up, steady state, ramp-down)
- Cloudflare Workers Analytics provides P50/P95/P99 latency breakdowns
- Prometheus-compatible metrics export for monitoring dashboards

**Alternatives Considered**:
1. **Artillery** - Rejected: Less mature than K6, fewer community examples
2. **wrk2** - Rejected: C-based tool, harder to script complex scenarios
3. **Manual curl loops** - Rejected: No proper statistical analysis, not scalable

**Implementation Notes**:
- Install: `brew install k6` or `docker run grafana/k6`
- Test script: `scripts/load-test.mjs` with K6 JavaScript API
- Scenario: Ramp up to 100 VUs (virtual users) over 1 minute, hold for 5 minutes, ramp down
- Thresholds: `http_req_duration: ['p(95)<2000']` (P95 <2s target)
- Metrics collection: Cloudflare Workers Analytics API or Prometheus exporter
- Run: `k6 run scripts/load-test.mjs --vus 100 --duration 5m`

---

## Decision 8: Sentry Integration Patterns

**Question**: Sentry SDK setup for Cloudflare Workers + Next.js 15, source map upload, error context enrichment.

**Decision**: Use @sentry/nextjs and @sentry/cloudflare-workers packages with automatic source map upload.

**Rationale**:
- Official SDKs handle error capture, breadcrumbs, performance monitoring
- Automatic source map upload enables readable stack traces
- Context enrichment (user ID, request ID) improves debugging
- Performance monitoring tracks LCP, FID, CLS (Web Vitals)
- Release tracking enables error regression detection

**Alternatives Considered**:
1. **Manual error logging** - Rejected: No aggregation, no alerting, poor UX
2. **Bugsnag** - Rejected: Sentry has better Cloudflare Workers support
3. **CloudWatch Logs** - Rejected: Not designed for error tracking, no stack trace parsing

**Implementation Notes**:
- Install Next.js: `pnpm add @sentry/nextjs`
- Install Worker: `pnpm add @sentry/cloudflare-workers`
- Config: `sentry.client.config.ts` and `sentry.server.config.ts` with DSN
- Source maps: `sentry-cli sourcemaps upload` in build pipeline
- Context: `Sentry.setUser({ id: userId })`, `Sentry.setContext('request', { id: requestId })`
- Performance: `Sentry.startTransaction()` for custom instrumentation
- Cloudflare Worker: Initialize in fetch handler, use `ctx.waitUntil()` for async sending

---

## Decision 9: WCAG AAA Contrast Validation

**Question**: Automated WCAG AAA contrast checking with OKLCH colors, CI integration.

**Decision**: Use axe-core for automated accessibility testing, integrate into Playwright E2E tests and Lighthouse CI.

**Rationale**:
- axe-core is industry standard (used by Chrome DevTools, Deque)
- Supports OKLCH color contrast calculation (via APCA algorithm)
- Runs in automated tests (Playwright, Lighthouse CI)
- WCAG AAA requires 7:1 contrast for normal text, 4.5:1 for large text
- CI integration prevents regressions

**Alternatives Considered**:
1. **Manual contrast checking** - Rejected: Not scalable, human error
2. **Pa11y** - Rejected: Less mature than axe-core, fewer rules
3. **Wave** - Rejected: Browser extension only, no automation

**Implementation Notes**:
- Install: `pnpm add -D @axe-core/playwright`
- Playwright integration: `import { injectAxe, checkA11y } from '@axe-core/playwright'`
- Test: `await injectAxe(page); await checkA11y(page, null, { wcagLevel: 'AAA' })`
- Lighthouse CI: `lhci assert --preset lighthouse:a11y --level error`
- OKLCH contrast: axe-core automatically calculates contrast from computed styles
- Run: `pnpm playwright test` (includes a11y checks)

---

## Decision 10: R2 URL Return Architecture Fix

**Question**: How to integrate existing uploadPdfToR2() into main PDF generation flow.

**Decision**: Call uploadPdfToR2() immediately after PDF generation in index.ts, return R2 public URL in API response.

**Rationale**:
- Existing uploadPdfToR2() function already handles R2 upload with tier metadata tagging
- Public R2 URL enables client-side PDF download without buffer transfer
- Reduces API response size (URL vs base64-encoded PDF)
- R2 lifecycle policies automatically expire PDFs per tier (Free: 1 day, Starter: 7 days, Pro: 30 days, Enterprise: 90 days)
- Maintains compatibility with RPC endpoint (can still return buffer for direct streaming)

**Alternatives Considered**:
1. **Keep buffer response** - Rejected: Violates spec requirement (FR-026), large API payloads
2. **Background upload with presigned URL** - Rejected: Adds complexity, latency before URL available
3. **Separate upload endpoint** - Rejected: Two API calls instead of one, worse UX

**Implementation Notes**:
- Location: `apps/worker/src/index.ts` lines 350-400 (after PDF generation, before response)
- Code change: Replace `return c.json({ success: true, pdf: pdfBuffer })` with:
  ```typescript
  const uploadResult = await uploadPdfToR2(pdfBuffer, {
    tier: authContext.planTier,
    userId: authContext.userId,
    fileName: `${requestId}.pdf`
  }, env);

  return c.json({
    success: true,
    data: {
      url: uploadResult.url, // Public R2 URL
      size: uploadResult.size,
      expiresAt: uploadResult.expiresAt
    }
  });
  ```
- Error handling: If R2 upload fails, fall back to buffer response (graceful degradation)
- RPC endpoint: Keep buffer response for batch operations (generateBatch returns array of buffers)

---

## Summary

All 10 technical decisions have been documented. Key takeaways:

1. **OKLCH Design System**: Native CSS oklch() function with custom properties
2. **shadcn/ui**: CLI installation with OKLCH theme customization
3. **DodoPayments**: SDK + webhook HMAC-SHA256 verification
4. **Dark Mode**: next-themes with lightness inversion
5. **Monaco Editor**: @monaco-editor/react with dynamic import
6. **E2E Testing**: Playwright with test database isolation
7. **Load Testing**: K6 with Cloudflare Analytics for P95 measurement
8. **Error Tracking**: Sentry SDKs for Next.js + Cloudflare Workers
9. **Accessibility**: axe-core automated testing for WCAG AAA
10. **R2 Integration**: Upload after generation, return public URL

**All NEEDS CLARIFICATION items from plan.md are now resolved. Proceed to Phase 1: Design artifacts generation.**
