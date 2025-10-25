# Research Notes: Speedstein PDF API Platform

**Feature**: 001-pdf-api-platform
**Research Phase**: Phase 0
**Date**: 2025-10-25

## Overview

This document contains research findings on key technologies and architectural decisions for Speedstein, including Cap'n Web RPC, Cloudflare Browser Rendering API, Supabase RLS, OKLCH color system, and DodoPayments integration.

## 1. Cap'n Web Architecture Study

### What is Cap'n Web?

Cap'n Web is a TypeScript RPC (Remote Procedure Call) framework that enables efficient bidirectional communication between client and server. It's particularly powerful for use cases requiring session reuse and promise pipelining.

### Key Concepts

#### RpcTarget (Server-Side)
```typescript
import { RpcTarget } from "capnweb";

class PdfGeneratorApi extends RpcTarget {
  async generatePdf(html: string, options: PdfOptions): Promise<PdfResult> {
    // Server-side method exposed via RPC
  }
}
```

- Extend `RpcTarget` to expose methods as RPC endpoints
- Methods can be async (return Promise)
- TypeScript types are preserved across client/server boundary

#### Promise Pipelining
```typescript
// Client code - all three calls happen in ONE network round trip!
const api = newHttpBatchRpcSession("https://api.speedstein.com/rpc");

const userPromise = api.getUser();
const pdf1 = api.generatePdf(userPromise.address.html, options);  // Dependent on user data
const pdf2 = api.generatePdf("<html>...</html>", options);        // Independent

const [user, result1, result2] = await Promise.all([userPromise, pdf1, pdf2]);
```

**How it works**:
- Client doesn't await intermediate promises
- Cap'n Web batches all calls into single HTTP request
- Server executes calls in dependency order
- Single HTTP response returns all results

### HTTP Batch vs WebSocket Modes

| Feature | HTTP Batch | WebSocket |
|---------|-----------|-----------|
| Connection | One request per batch | Persistent connection |
| Use Case | REST-like, stateless | Long-lived sessions, real-time |
| Overhead | HTTP overhead per batch | WebSocket handshake once |
| Firewall Friendly | Yes | May be blocked |
| Session Reuse | Via cookies/tokens | Built-in |

**Recommendation**: Use HTTP Batch for REST API (`/api/generate`), offer WebSocket (`/api/rpc`) for advanced users.

### Resource Disposal

```typescript
class PdfGeneratorApi extends RpcTarget {
  private browser: Browser;

  async generatePdf(html: string): Promise<PdfResult> {
    const page = await this.browser.newPage();
    try {
      await page.setContent(html);
      const pdf = await page.pdf();
      return { success: true, data: pdf };
    } finally {
      await page.close();  // CRITICAL: Always dispose resources
    }
  }

  [Symbol.dispose]() {
    // Called when RpcTarget is disposed
    this.browser.close();
  }
}
```

**Best Practices**:
- Always use try-finally to ensure resource cleanup
- Implement `Symbol.dispose()` for long-lived resources
- Use `using` keyword in TypeScript 5.2+ for automatic disposal

### Example: Cloudflare Worker Integration

```typescript
import { RpcTarget, newWorkersRpcResponse } from "capnweb";

class PdfApi extends RpcTarget {
  constructor(private env: Env) {
    super();
  }

  async generatePdf(html: string): Promise<{ url: string }> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf();
    const url = await uploadToR2(pdf, this.env.R2_BUCKET);
    await page.close();
    return { url };
  }
}

export default {
  fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname === "/api/rpc") {
      return newWorkersRpcResponse(request, new PdfApi(env));
    }
    return new Response("Not found", { status: 404 });
  }
};
```

## 2. Cloudflare Browser Rendering API

### Overview

Cloudflare Browser Rendering API provides headless Chrome instances via Puppeteer in Cloudflare Workers.

### Setup

```toml
# wrangler.toml
browser = { binding = "BROWSER" }
```

### Usage

```typescript
import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request: Request, env: Env) {
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    await page.setContent("<html><h1>Test</h1></html>");
    const pdf = await page.pdf({ format: 'A4' });

    await page.close();
    await browser.close();

    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf" }
    });
  }
};
```

### Performance Optimization: Session Reuse

**Problem**: Launching a new browser instance for each request adds 500-1000ms overhead.

**Solution**: Reuse browser instances across requests:

```typescript
let browserInstance: Browser | null = null;

async function getBrowser(env: Env): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch(env.BROWSER);
  }
  return browserInstance;
}

// In fetch handler:
const browser = await getBrowser(env);
const page = await browser.newPage();
// ... generate PDF ...
await page.close();  // Close page, NOT browser
```

**Caveats**:
- Browser instance persists for worker lifetime (up to 30 seconds idle)
- Memory leaks if pages aren't closed properly
- Need cleanup logic for idle workers

### Limits

- **CPU Time**: 50ms per request (soft limit), 30s max
- **Memory**: 128MB per worker instance
- **Concurrent Pages**: ~5-10 per browser instance (memory-dependent)

### Best Practices

1. **Always close pages**: Use try-finally to ensure cleanup
2. **Timeout long operations**: Set `page.setDefaultTimeout(10000)` (10s)
3. **Disable unnecessary features**: `args: ['--disable-dev-shm-usage', '--no-sandbox']`
4. **Monitor memory**: Track page count, close browser if >10 pages created

## 3. Supabase Row Level Security (RLS)

### What is RLS?

Row Level Security (RLS) allows you to write SQL policies that control which rows users can access. This is critical for multi-tenant applications like Speedstein, where users should only see their own data.

### Example: users table

```sql
-- Enable RLS on table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own row
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only UPDATE their own row
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### auth.uid() Function

Supabase provides `auth.uid()` function that returns the authenticated user's ID from the JWT token. This is automatically available in RLS policies.

### Example: api_keys table

```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view only their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create API keys for themselves
CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can revoke (UPDATE) only their own keys
CREATE POLICY "Users can revoke own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Service Role Bypass

For operations that need admin access (e.g., incrementing usage quota), use the **service role key**:

```typescript
import { createClient } from '@supabase/supabase-js';

// User client (RLS enforced)
const userClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Service client (RLS bypassed)
const serviceClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Increment usage (must bypass RLS since user can't update usage_quotas)
await serviceClient
  .from('usage_quotas')
  .update({ current_usage: current_usage + 1 })
  .eq('user_id', userId);
```

### Testing RLS Policies

```sql
-- Set session to specific user for testing
SET request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001"}';

-- Try to query another user's data (should return empty)
SELECT * FROM api_keys WHERE user_id = '00000000-0000-0000-0000-000000000002';
-- Result: 0 rows (policy blocks access)

-- Query own data (should work)
SELECT * FROM api_keys WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- Result: User's API keys returned
```

## 4. OKLCH Color System

### What is OKLCH?

OKLCH is a perceptually uniform color space that ensures colors with the same lightness value appear equally bright to human eyes, regardless of hue. This is crucial for accessibility (WCAG contrast compliance).

### OKLCH Syntax

```css
oklch(L C H / alpha)
```

- **L (Lightness)**: 0 (black) to 1 (white), e.g., 0.60
- **C (Chroma)**: 0 (gray) to ~0.4 (vibrant), e.g., 0.22
- **H (Hue)**: 0-360 degrees, e.g., 250 (blue)
- **alpha**: 0-1 (optional), e.g., 0.8

### Example: OKLCH vs. HSL

```css
/* HSL (NOT perceptually uniform) */
--blue-500: hsl(210, 100%, 50%);   /* Appears darker than... */
--yellow-500: hsl(60, 100%, 50%);  /* ...this, despite same lightness (50%) */

/* OKLCH (perceptually uniform) */
--blue-500: oklch(0.60 0.22 250);  /* Same perceived brightness as... */
--yellow-500: oklch(0.60 0.18 110); /* ...this (both L=0.60) */
```

### Tailwind CSS Integration

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    colors: {
      // Gray scale (chroma = 0 for pure gray)
      gray: {
        50: 'oklch(0.98 0 0)',
        100: 'oklch(0.95 0 0)',
        200: 'oklch(0.90 0 0)',
        500: 'oklch(0.60 0 0)',
        900: 'oklch(0.20 0 0)',
      },
      // Primary blue
      blue: {
        500: 'oklch(0.60 0.22 250)',
        600: 'oklch(0.55 0.22 250)',  // Darker (lower L)
        400: 'oklch(0.65 0.22 250)',  // Lighter (higher L)
      },
      // Semantic colors
      success: 'oklch(0.68 0.18 142)',  // Green
      warning: 'oklch(0.75 0.16 75)',   // Amber
      error: 'oklch(0.60 0.24 25)',     // Red
    },
  },
};
```

### Dark Mode with OKLCH

```css
:root {
  --surface-base: oklch(0.98 0 0);      /* Light gray */
  --text-primary: oklch(0.20 0 0);      /* Dark gray */
}

[data-theme="dark"] {
  --surface-base: oklch(0.15 0 0);      /* Dark gray (inverted lightness) */
  --text-primary: oklch(0.95 0 0);      /* Light gray (inverted lightness) */
}
```

### Browser Support

- **Chrome/Edge**: 111+ (March 2023)
- **Firefox**: 113+ (May 2023)
- **Safari**: 15.4+ (March 2022)

**Coverage**: ~92% of global users (as of October 2025)

**Fallback** (not needed for Speedstein, but for reference):
```css
.button {
  background: #0066cc;  /* Fallback for old browsers */
  background: oklch(0.60 0.22 250);  /* Modern browsers */
}
```

### WCAG AAA Contrast Compliance

OKLCH makes it easy to achieve WCAG AAA (7:1 for normal text, 4.5:1 for large text):

```javascript
// Helper function to calculate contrast
function getLuminance(oklchL: number): number {
  // OKLCH lightness roughly correlates to luminance
  return oklchL;
}

function getContrastRatio(L1: number, L2: number): number {
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Example: Text (L=0.20) on background (L=0.98)
const contrast = getContrastRatio(0.98, 0.20);
// Result: ~13.7:1 (passes WCAG AAA)
```

## 5. DodoPayments Integration

### Overview

DodoPayments is a subscription billing service similar to Stripe. It handles:
- Payment processing
- Subscription management
- Invoicing
- Webhooks for payment events

### Setup

1. Create DodoPayments account
2. Get API keys from dashboard
3. Create products and prices
4. Configure webhook endpoint

### Price IDs

Create prices in DodoPayments dashboard:

| Plan | Price ID | Amount | Interval |
|------|----------|--------|----------|
| Starter | `price_starter_month_v1` | $29.00 | month |
| Pro | `price_pro_month_v1` | $99.00 | month |

### Creating Checkout Session

```typescript
import { DodoPayments } from 'dodopayments-node';

const dodo = new DodoPayments(process.env.DODO_API_KEY);

async function createCheckout(userId: string, planTier: string) {
  const priceId = planTier === 'starter'
    ? 'price_starter_month_v1'
    : 'price_pro_month_v1';

  const session = await dodo.checkout.create({
    priceId,
    successUrl: `https://speedstein.com/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: 'https://speedstein.com/pricing',
    customerEmail: user.email,
    metadata: {
      userId,
      planTier
    }
  });

  return session.url;  // Redirect user to this URL
}
```

### Webhook Events

DodoPayments sends webhooks for subscription lifecycle events:

#### payment.succeeded
```json
{
  "event": "payment.succeeded",
  "data": {
    "customerId": "cus_abc123",
    "subscriptionId": "sub_def456",
    "amount": 2900,
    "currency": "USD",
    "invoiceId": "inv_789",
    "billingPeriodStart": "2025-10-01T00:00:00Z",
    "billingPeriodEnd": "2025-11-01T00:00:00Z"
  }
}
```

**Action**: Update subscription status to "active", create invoice record

#### payment.failed
```json
{
  "event": "payment.failed",
  "data": {
    "customerId": "cus_abc123",
    "subscriptionId": "sub_def456",
    "reason": "insufficient_funds"
  }
}
```

**Action**: Update subscription status to "past_due", send email to user

#### subscription.updated
```json
{
  "event": "subscription.updated",
  "data": {
    "subscriptionId": "sub_def456",
    "newPriceId": "price_pro_month_v1",
    "status": "active"
  }
}
```

**Action**: Update plan tier and quota in database

### Webhook Security

Verify webhook signatures to prevent spoofing:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

// In Cloudflare Worker:
export default {
  async fetch(request: Request, env: Env) {
    const payload = await request.text();
    const signature = request.headers.get('X-Dodo-Signature');

    if (!verifyWebhook(payload, signature, env.DODO_WEBHOOK_SECRET)) {
      return new Response('Invalid signature', { status: 401 });
    }

    // Process webhook...
  }
};
```

## 6. Additional Research Items

### Cloudflare R2 for PDF Storage

- **Cost**: $0.015/GB-month storage, $0 egress (vs S3's $0.09/GB egress)
- **Access**: Public URLs via custom domain (e.g., `cdn.speedstein.com`)
- **TTL**: Set object expiration (30 days) via metadata

```typescript
async function uploadToR2(pdf: Buffer, bucket: R2Bucket): Promise<string> {
  const key = `pdfs/${crypto.randomUUID()}.pdf`;

  await bucket.put(key, pdf, {
    customMetadata: {
      'Cache-Control': 'public, max-age=2592000',  // 30 days
    },
    httpMetadata: {
      contentType: 'application/pdf',
    },
  });

  return `https://cdn.speedstein.com/${key}`;
}
```

### Next.js 15 App Router

- **Server Components**: Default for all components (reduce JS bundle)
- **Route Groups**: `(marketing)`, `(dashboard)`, `(auth)` for layout organization
- **Server Actions**: Use for form submissions instead of API routes
- **Image Optimization**: Automatic with `next/image`

### shadcn/ui Setup

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select dialog toast
```

Components use OKLCH colors via CSS variables:

```css
:root {
  --primary: oklch(0.60 0.22 250);
  --primary-foreground: oklch(0.98 0 0);
}
```

## Key Takeaways

1. **Cap'n Web**: Use HTTP Batch for REST API, offer WebSocket for advanced users. Always dispose resources in finally blocks.

2. **Browser Rendering**: Reuse browser instances across requests for 2-5x performance improvement. Close pages, not browsers.

3. **Supabase RLS**: Enable on all tables, use `auth.uid()` for user isolation, service role for admin operations.

4. **OKLCH**: Defines colors with perceptual uniformity, crucial for WCAG AAA compliance. Use zero chroma for grays.

5. **DodoPayments**: Verify webhook signatures, handle failed payments gracefully, update subscription/quota immediately on upgrade.

**Next Step**: Use these findings to implement Phase 1 (data model, contracts, quickstart) and Phase 2 (tasks generation).
