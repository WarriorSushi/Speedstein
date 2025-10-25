# Speedstein Technical Specification
## The Fastest PDF Generation API on the Market

**Version:** 1.0  
**Domain:** speedstein.com  
**Tagline:** "POST HTML → Get Beautiful PDF in <2 Seconds"

---

## Executive Summary

Speedstein is a high-performance PDF generation API leveraging Cloudflare's Cap'n Web RPC protocol and real Chrome rendering to deliver the fastest, most accurate PDF generation service available. By utilizing Cap'n Web's promise pipelining and session reuse capabilities, Speedstein can generate 100+ PDFs per minute from a single warm browser instance—5x faster than competitors like DocRaptor, PDFShift, and HTML2PDF.

### Key Differentiators
- **Real Chrome Rendering:** Perfect CSS support, modern web standards (Flexbox, Grid, CSS Variables)
- **Sub-2-Second Generation:** Cap'n Web's efficient RPC and browser session reuse
- **Superior Quality:** Far exceeds wkhtmltopdf (WebKit 2011) and other legacy engines
- **Competitive Pricing:** 5K PDFs for $29/month vs DocRaptor's $49 for 2K PDFs
- **Developer-First API:** Clean, simple REST interface with WebSocket support for batch operations

---

## Technical Architecture

### Core Technology Stack

#### Frontend (Landing Page & Dashboard)
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS with OKLCH color system
- **Deployment:** Vercel Edge Network

#### Backend API Layer
- **Runtime:** Cloudflare Workers
- **Database:** Supabase (PostgreSQL)
- **RPC Protocol:** Cap'n Web (WebSocket + HTTP Batch)
- **PDF Engine:** Puppeteer/Chrome via Cloudflare Browser Rendering API

#### Payment & Billing
- **Payment Gateway:** DodoPayments
- **Billing Model:** Usage-based with tiered plans
- **Webhooks:** Real-time payment event processing

#### Authentication & Security
- **Auth:** Supabase Auth (JWT-based)
- **API Keys:** SHA-256 hashed, rate-limited
- **Rate Limiting:** Cloudflare Rate Limiting API
- **CORS:** Configurable per API key

---

## Cap'n Web Integration Strategy

### Why Cap'n Web for PDF Generation

Cap'n Web is **perfectly suited** for PDF generation because:

1. **Session Reuse:** Keep a warm Chrome instance running, eliminating cold-start overhead
2. **Promise Pipelining:** Queue multiple PDF jobs in a single round trip
3. **Bidirectional RPC:** Server can notify clients of job completion without polling
4. **Zero-Copy Serialization:** Efficient data transfer (JSON with preprocessing)
5. **Resource Management:** Explicit disposal prevents memory leaks in long-running sessions

### Implementation Architecture

```typescript
// Server-side Cap'n Web RPC Target (Cloudflare Worker)
import { RpcTarget, newWorkersRpcResponse } from "capnweb";
import { BrowserRenderer } from "@cloudflare/puppeteer";

class PdfGeneratorApi extends RpcTarget {
  private browser: BrowserRenderer;
  
  constructor(env) {
    super();
    // Reuse browser instance across requests
    this.browser = env.BROWSER;
  }

  // Main PDF generation method
  async generatePdf(html: string, options: PdfOptions): Promise<PdfResult> {
    const page = await this.browser.newPage();
    
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      // Upload to R2 storage
      const pdfUrl = await this.uploadToR2(pdfBuffer, env);
      
      return {
        success: true,
        url: pdfUrl,
        size: pdfBuffer.length,
        generatedAt: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  }

  // Batch generation with promise pipelining
  async generateBatch(jobs: PdfJob[]): Promise<PdfResult[]> {
    // Process all jobs concurrently using Cap'n Web's pipelining
    const results = await Promise.all(
      jobs.map(job => this.generatePdf(job.html, job.options))
    );
    return results;
  }

  // Health check method
  async ping(): Promise<string> {
    return "pong";
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/rpc") {
      // Cap'n Web RPC endpoint (supports both HTTP Batch and WebSocket)
      return newWorkersRpcResponse(request, new PdfGeneratorApi(env));
    }
    
    if (url.pathname === "/api/generate") {
      // REST API endpoint (wraps Cap'n Web internally)
      return handleRestApi(request, env);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
```

### Client-Side Integration (Optional WebSocket Mode)

```typescript
// For high-volume users, provide WebSocket client
import { newWebSocketRpcSession, RpcStub } from "capnweb";

const api: RpcStub<PdfGeneratorApi> = newWebSocketRpcSession(
  "wss://api.speedstein.com/api/rpc"
);

// Single PDF generation
const result = await api.generatePdf("<html>...</html>", {
  format: "A4",
  margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
});

// Batch generation with pipelining (all in one round trip!)
const jobs = [
  { html: "<html>Invoice #1</html>", options: {} },
  { html: "<html>Invoice #2</html>", options: {} },
  { html: "<html>Invoice #3</html>", options: {} }
];

const results = await api.generateBatch(jobs);
```

### REST API Wrapper (For Standard HTTP Clients)

Most users will use the simple REST API, which internally uses Cap'n Web's HTTP Batch mode:

```bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Hello World</h1></body></html>",
    "options": {
      "format": "A4",
      "printBackground": true,
      "margin": {
        "top": "1cm",
        "right": "1cm",
        "bottom": "1cm",
        "left": "1cm"
      }
    }
  }'
```

Response:
```json
{
  "success": true,
  "pdf_url": "https://cdn.speedstein.com/pdfs/abc123.pdf",
  "size": 45678,
  "generated_at": "2025-10-25T10:30:00Z",
  "credits_remaining": 4850
}
```

---

## Database Schema (Supabase)

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `api_keys`
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (sk_live_abc12345...)
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
```

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- 'free', 'starter', 'pro', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  dodo_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

#### `usage_records`
```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  pdf_size INTEGER NOT NULL, -- bytes
  generation_time INTEGER NOT NULL, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_records_user_id_created_at ON usage_records(user_id, created_at DESC);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);
```

#### `pdf_cache` (Optional)
```sql
CREATE TABLE pdf_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  html_hash TEXT UNIQUE NOT NULL,
  pdf_url TEXT NOT NULL,
  options_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_pdf_cache_html_hash ON pdf_cache(html_hash);
CREATE INDEX idx_pdf_cache_expires_at ON pdf_cache(expires_at);
```

### Row Level Security (RLS) Policies

```sql
-- Users can only read their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Usage records
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Pricing Plans & Rate Limits

| Plan | Price | PDFs/Month | Rate Limit | Storage | Support |
|------|-------|------------|------------|---------|---------|
| **Free** | $0 | 100 | 10/min | 24h retention | Community |
| **Starter** | $29/mo | 5,000 | 50/min | 7d retention | Email |
| **Pro** | $149/mo | 50,000 | 200/min | 30d retention | Priority Email |
| **Enterprise** | $499/mo | 500,000 | 1000/min | 90d retention | Dedicated Slack |

### Overage Pricing
- Additional PDFs: $0.006 per PDF (after plan limit)
- Billed monthly in arrears

---

## Design System: OKLCH Color Architecture

### Why OKLCH?

OKLCH (Oklab Lightness Chroma Hue) provides **perceptually uniform** colors, critical for:
- **Accessibility:** Consistent contrast ratios across hues
- **Elevation System:** Lightness directly maps to visual hierarchy
- **Dark Mode:** Seamless color transformations without hue shifts
- **Brand Consistency:** Mathematical color relationships

### Color Palette Structure

```css
/* Base Colors (OKLCH) */
:root {
  /* Neutral Gray Scale - Zero chroma for pure grays */
  --color-gray-50: oklch(0.98 0 0);
  --color-gray-100: oklch(0.95 0 0);
  --color-gray-200: oklch(0.88 0 0);
  --color-gray-300: oklch(0.78 0 0);
  --color-gray-400: oklch(0.65 0 0);
  --color-gray-500: oklch(0.50 0 0);
  --color-gray-600: oklch(0.40 0 0);
  --color-gray-700: oklch(0.30 0 0);
  --color-gray-800: oklch(0.20 0 0);
  --color-gray-900: oklch(0.12 0 0);
  --color-gray-950: oklch(0.08 0 0);

  /* Primary Brand Color - Electric Blue */
  /* L: 0.60 (60% lightness), C: 0.22 (high chroma), H: 250 (blue hue) */
  --color-primary-50: oklch(0.95 0.05 250);
  --color-primary-100: oklch(0.90 0.08 250);
  --color-primary-200: oklch(0.82 0.12 250);
  --color-primary-300: oklch(0.74 0.16 250);
  --color-primary-400: oklch(0.67 0.20 250);
  --color-primary-500: oklch(0.60 0.22 250); /* Base */
  --color-primary-600: oklch(0.52 0.22 250);
  --color-primary-700: oklch(0.44 0.20 250);
  --color-primary-800: oklch(0.36 0.16 250);
  --color-primary-900: oklch(0.28 0.12 250);
  
  /* Success - Green */
  --color-success-500: oklch(0.68 0.18 142);
  --color-success-600: oklch(0.58 0.18 142);
  
  /* Warning - Amber */
  --color-warning-500: oklch(0.75 0.16 75);
  --color-warning-600: oklch(0.65 0.16 75);
  
  /* Error - Red */
  --color-error-500: oklch(0.60 0.24 25);
  --color-error-600: oklch(0.50 0.24 25);
}

/* Dark Mode - Invert lightness, maintain chroma/hue */
[data-theme="dark"] {
  --color-gray-50: oklch(0.08 0 0);
  --color-gray-100: oklch(0.12 0 0);
  --color-gray-200: oklch(0.20 0 0);
  --color-gray-300: oklch(0.30 0 0);
  --color-gray-400: oklch(0.40 0 0);
  --color-gray-500: oklch(0.50 0 0);
  --color-gray-600: oklch(0.65 0 0);
  --color-gray-700: oklch(0.78 0 0);
  --color-gray-800: oklch(0.88 0 0);
  --color-gray-900: oklch(0.95 0 0);
  --color-gray-950: oklch(0.98 0 0);
  
  /* Primary in dark mode - increase lightness for contrast */
  --color-primary-500: oklch(0.70 0.22 250);
  --color-primary-600: oklch(0.78 0.22 250);
}
```

### Elevation System Using Lightness

```css
/* Component elevation through lightness manipulation */
.surface-base {
  background: oklch(from var(--color-gray-50) l c h);
}

.surface-raised {
  /* Increase lightness by 2% for subtle elevation */
  background: oklch(from var(--color-gray-50) calc(l + 0.02) c h);
  box-shadow: 0 1px 3px oklch(from var(--color-gray-900) l c h / 0.1);
}

.surface-overlay {
  /* Increase lightness by 4% for modal/popover elevation */
  background: oklch(from var(--color-gray-50) calc(l + 0.04) c h);
  box-shadow: 0 10px 25px oklch(from var(--color-gray-900) l c h / 0.15);
}

/* Interactive states - darken on hover, lighten on active */
.button-primary {
  background: var(--color-primary-500);
}

.button-primary:hover {
  background: oklch(from var(--color-primary-500) calc(l + 0.05) c h);
}

.button-primary:active {
  background: oklch(from var(--color-primary-500) calc(l - 0.05) c h);
}
```

### Typography Hierarchy

```css
/* Text colors with OKLCH for consistent contrast */
:root {
  --text-primary: oklch(0.15 0 0);
  --text-secondary: oklch(0.45 0 0);
  --text-tertiary: oklch(0.65 0 0);
  --text-disabled: oklch(0.75 0 0);
}

[data-theme="dark"] {
  --text-primary: oklch(0.95 0 0);
  --text-secondary: oklch(0.70 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-disabled: oklch(0.40 0 0);
}
```

### Component Design Tokens

```typescript
// Tailwind config with OKLCH
const config = {
  theme: {
    extend: {
      colors: {
        gray: {
          50: 'oklch(0.98 0 0)',
          100: 'oklch(0.95 0 0)',
          // ... rest of scale
        },
        primary: {
          500: 'oklch(0.60 0.22 250)',
          // ... rest of scale
        }
      },
      boxShadow: {
        'sm': '0 1px 2px oklch(0.12 0 0 / 0.05)',
        'md': '0 4px 6px oklch(0.12 0 0 / 0.1)',
        'lg': '0 10px 15px oklch(0.12 0 0 / 0.1)',
        'xl': '0 20px 25px oklch(0.12 0 0 / 0.15)',
      }
    }
  }
};
```

---

## API Reference Summary

### Endpoints

#### `POST /api/generate`
Generate a single PDF from HTML.

**Request:**
```json
{
  "html": "<html>...</html>",
  "options": {
    "format": "A4",
    "printBackground": true,
    "margin": { "top": "1cm", "right": "1cm", "bottom": "1cm", "left": "1cm" },
    "displayHeaderFooter": false,
    "headerTemplate": "",
    "footerTemplate": "",
    "scale": 1,
    "landscape": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "pdf_url": "https://cdn.speedstein.com/pdfs/abc123.pdf",
  "size": 45678,
  "generated_at": "2025-10-25T10:30:00Z",
  "credits_remaining": 4850
}
```

#### `POST /api/batch`
Generate multiple PDFs in parallel.

**Request:**
```json
{
  "jobs": [
    { "html": "<html>...</html>", "options": {} },
    { "html": "<html>...</html>", "options": {} }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "pdf_url": "...", "size": 45678 },
    { "pdf_url": "...", "size": 56789 }
  ],
  "credits_remaining": 4848
}
```

#### `GET /api/usage`
Get current billing period usage.

**Response:**
```json
{
  "plan": "starter",
  "period_start": "2025-10-01T00:00:00Z",
  "period_end": "2025-10-31T23:59:59Z",
  "pdfs_generated": 1150,
  "pdfs_limit": 5000,
  "usage_percentage": 23
}
```

---

## Security Considerations

### API Key Management
- **Generation:** Cryptographically secure random tokens (32 bytes, base64-encoded)
- **Storage:** SHA-256 hashed, salted
- **Prefix Display:** Show `sk_live_abc12345...` for identification
- **Rotation:** Users can generate new keys and revoke old ones instantly

### Rate Limiting
- **Per API Key:** Enforced via Cloudflare Rate Limiting API
- **Sliding Window:** 1-minute buckets
- **Response Headers:**
  ```
  X-RateLimit-Limit: 50
  X-RateLimit-Remaining: 47
  X-RateLimit-Reset: 1698345600
  ```

### Input Validation
- **HTML Size:** Max 5MB per request
- **Batch Jobs:** Max 100 jobs per batch
- **Options Validation:** Zod schema validation
- **XSS Prevention:** HTML sanitization (DOMPurify) for live preview only (not in API)

### CORS Configuration
- **Allowed Origins:** User-configurable per API key
- **Methods:** POST, GET, OPTIONS
- **Headers:** Authorization, Content-Type, X-API-Version

---

## Deployment Architecture

### Cloudflare Workers (API)
- **Regions:** Global edge deployment
- **CPU Limit:** 30s per request
- **Memory:** 128MB
- **KV Store:** API key cache, rate limit counters

### Cloudflare R2 (PDF Storage)
- **Bucket:** `speedstein-pdfs`
- **Lifecycle:** Auto-delete based on plan tier
- **CDN:** Public URL with Cloudflare caching

### Cloudflare Browser Rendering API
- **Instances:** Auto-scaling
- **Session Reuse:** Via Cap'n Web persistent connections
- **Timeout:** 60s per PDF generation

### Vercel (Frontend)
- **Region:** Global edge (Vercel Edge Network)
- **Caching:** ISR for landing page, no cache for dashboard
- **Analytics:** Vercel Analytics + Web Vitals

### Supabase (Database & Auth)
- **Region:** US East (primary)
- **Connection Pooling:** PgBouncer (transaction mode)
- **Backups:** Daily automated backups

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **P50 Generation Time** | <1.5s | Time to PDF URL |
| **P95 Generation Time** | <2.0s | Time to PDF URL |
| **P99 Generation Time** | <3.0s | Time to PDF URL |
| **API Availability** | 99.9% | Uptime monitoring |
| **Cold Start** | <500ms | Worker initialization |
| **Throughput** | 100 PDFs/min | Per browser instance |

### Monitoring & Observability
- **Logging:** Cloudflare Workers Analytics
- **APM:** Sentry for error tracking
- **Metrics:** Custom dashboards for:
  - Generation time distribution
  - Error rates
  - Rate limit hits
  - Browser instance health
  - Storage costs

---

## Future Enhancements (Roadmap)

### Phase 2 (Q1 2026)
- **Webhook Support:** POST PDF URL to user-specified endpoint on completion
- **Template Library:** Pre-built invoice, receipt, report templates
- **Custom Fonts:** Upload custom TTF/WOFF fonts
- **Watermarks:** Add text/image watermarks

### Phase 3 (Q2 2026)
- **HTML to Image:** PNG/JPEG output support
- **Multi-page Splitting:** Split PDFs into separate files
- **PDF Merging:** Combine multiple PDFs into one
- **Signed URLs:** Temporary access tokens for PDF downloads

### Phase 4 (Q3 2026)
- **AI-Powered Templates:** Generate templates from natural language
- **Form Filling:** Populate PDF forms programmatically
- **OCR Extraction:** Extract text from image-based PDFs
- **PDF Compression:** Optimize file sizes

---

## Competitive Analysis

| Feature | Speedstein | DocRaptor | PDFShift | HTML2PDF |
|---------|-----------|-----------|----------|----------|
| **Rendering Engine** | Chrome (latest) | Prince XML | Chrome | wkhtmltopdf |
| **Generation Speed** | <2s | 3-5s | 4-6s | 5-8s |
| **Pricing (5K PDFs)** | $29/mo | $49/mo | $39/mo | $29/mo |
| **CSS Support** | Excellent | Good | Excellent | Poor |
| **WebSocket API** | Yes (Cap'n Web) | No | No | No |
| **Promise Pipelining** | Yes | No | No | No |
| **Session Reuse** | Yes | No | Partial | No |

---

## Success Metrics

### Business KPIs
- **MRR (Monthly Recurring Revenue):** Target $50K by Month 6
- **Churn Rate:** <5% monthly
- **API Call Volume:** 1M+ PDFs/month by Month 6
- **Customer Acquisition Cost:** <$50
- **Customer Lifetime Value:** >$500

### Technical KPIs
- **API Uptime:** 99.9%+
- **P95 Latency:** <2s
- **Error Rate:** <0.1%
- **Browser Instance Utilization:** >80%

---

## Conclusion

Speedstein leverages cutting-edge technology (Cap'n Web, Cloudflare Workers, Chrome rendering) to deliver a PDF generation API that is demonstrably faster, more accurate, and more cost-effective than existing solutions. The combination of Cap'n Web's promise pipelining, browser session reuse, and modern design practices (OKLCH color system, shadcn/ui) positions Speedstein as the premium choice for developers who need high-quality PDFs at scale.

**Next Steps:**
1. Review technical specification
2. Review API reference documentation
3. Review implementation plan
4. Begin development with Claude Code CLI

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Author:** Technical Architecture Team
