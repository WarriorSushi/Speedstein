# Speedstein API Reference
## Developer Documentation v1.0

**Base URL:** `https://api.speedstein.com`  
**WebSocket URL:** `wss://api.speedstein.com/api/rpc`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Quick Start](#quick-start)
3. [REST API](#rest-api)
4. [WebSocket API (Advanced)](#websocket-api-advanced)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)
7. [Webhooks](#webhooks)
8. [Code Examples](#code-examples)

---

## Authentication

All API requests require authentication using an API key. You can generate API keys from your [dashboard](https://speedstein.com/dashboard).

### API Key Format
```
sk_live_abc123def456...  (Production)
sk_test_xyz789uvw012...  (Testing)
```

### Authentication Methods

#### Bearer Token (Recommended)
```bash
curl https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_abc123def456..."
```

#### Query Parameter (Not Recommended)
```bash
curl https://api.speedstein.com/api/generate?api_key=sk_live_abc123def456...
```

**Security Note:** Always use HTTPS. Never commit API keys to version control.

---

## Quick Start

### Install SDK (Optional)
```bash
npm install speedstein
```

### Generate Your First PDF
```javascript
import Speedstein from 'speedstein';

const client = new Speedstein('sk_live_abc123...');

const pdf = await client.generatePdf({
  html: '<html><body><h1>Hello World!</h1></body></html>',
  options: {
    format: 'A4',
    printBackground: true
  }
});

console.log(pdf.url); // https://cdn.speedstein.com/pdfs/abc123.pdf
```

### Without SDK (cURL)
```bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Hello World!</h1></body></html>",
    "options": {
      "format": "A4",
      "printBackground": true
    }
  }'
```

---

## REST API

### Generate Single PDF

**Endpoint:** `POST /api/generate`

**Request Body:**
```typescript
{
  html: string;              // HTML content (max 5MB)
  options?: {
    format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    margin?: {
      top?: string;         // e.g., '1cm', '10mm', '0.5in'
      right?: string;
      bottom?: string;
      left?: string;
    };
    scale?: number;          // 0.1 to 2.0
    landscape?: boolean;
    pageRanges?: string;     // e.g., '1-5, 8, 11-13'
    width?: string;          // Custom page width (e.g., '210mm')
    height?: string;         // Custom page height (e.g., '297mm')
    preferCSSPageSize?: boolean;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  pdf_url: string;           // Public URL to download PDF
  size: number;              // File size in bytes
  generated_at: string;      // ISO 8601 timestamp
  credits_remaining: number; // Remaining PDFs in current period
}
```

**Example:**
```javascript
const response = await fetch('https://api.speedstein.com/api/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_abc123...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #2563eb; }
          </style>
        </head>
        <body>
          <h1>Invoice #1234</h1>
          <p>Total: $99.99</p>
        </body>
      </html>
    `,
    options: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      }
    }
  })
});

const data = await response.json();
console.log(data.pdf_url);
```

---

### Generate Batch PDFs

**Endpoint:** `POST /api/batch`

Generate multiple PDFs in parallel. Maximum 100 jobs per batch.

**Request Body:**
```typescript
{
  jobs: Array<{
    html: string;
    options?: PdfOptions;
    metadata?: Record<string, any>; // Optional user data
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  results: Array<{
    pdf_url: string;
    size: number;
    metadata?: Record<string, any>;
  }>;
  credits_remaining: number;
  total_generation_time: number; // milliseconds
}
```

**Example:**
```javascript
const response = await fetch('https://api.speedstein.com/api/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_abc123...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jobs: [
      {
        html: '<html><body><h1>Invoice #1001</h1></body></html>',
        metadata: { invoice_id: '1001' }
      },
      {
        html: '<html><body><h1>Invoice #1002</h1></body></html>',
        metadata: { invoice_id: '1002' }
      },
      {
        html: '<html><body><h1>Invoice #1003</h1></body></html>',
        metadata: { invoice_id: '1003' }
      }
    ]
  })
});

const data = await response.json();
data.results.forEach(result => {
  console.log(`PDF for invoice ${result.metadata.invoice_id}: ${result.pdf_url}`);
});
```

---

### Get Usage Stats

**Endpoint:** `GET /api/usage`

Get current billing period usage and limits.

**Response:**
```typescript
{
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  period_start: string;      // ISO 8601 timestamp
  period_end: string;        // ISO 8601 timestamp
  pdfs_generated: number;    // PDFs generated this period
  pdfs_limit: number;        // Total PDFs allowed this period
  usage_percentage: number;  // 0-100
  rate_limit: {
    requests_per_minute: number;
    burst_limit: number;
  };
}
```

**Example:**
```bash
curl https://api.speedstein.com/api/usage \
  -H "Authorization: Bearer sk_live_abc123..."
```

**Response:**
```json
{
  "plan": "starter",
  "period_start": "2025-10-01T00:00:00Z",
  "period_end": "2025-10-31T23:59:59Z",
  "pdfs_generated": 1250,
  "pdfs_limit": 5000,
  "usage_percentage": 25,
  "rate_limit": {
    "requests_per_minute": 50,
    "burst_limit": 100
  }
}
```

---

### Health Check

**Endpoint:** `GET /api/health`

Check API status and response time.

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  response_time_ms: number;
  version: string;
}
```

---

## WebSocket API (Advanced)

For high-volume applications, use our WebSocket API powered by Cap'n Web. This provides:
- **Promise Pipelining:** Chain dependent calls in one round trip
- **Persistent Connection:** Reuse browser sessions for 5x faster generation
- **Bidirectional RPC:** Server can push notifications

### Installation

```bash
npm install speedstein capnweb
```

### Connection Setup

```typescript
import { newWebSocketRpcSession, RpcStub } from 'capnweb';

interface SpeedsteinApi {
  generatePdf(html: string, options: PdfOptions): Promise<PdfResult>;
  generateBatch(jobs: PdfJob[]): Promise<PdfResult[]>;
  ping(): Promise<string>;
}

// Connect to WebSocket RPC server
const api: RpcStub<SpeedsteinApi> = newWebSocketRpcSession(
  'wss://api.speedstein.com/api/rpc',
  {
    headers: {
      'Authorization': 'Bearer sk_live_abc123...'
    }
  }
);

// Generate PDF
const result = await api.generatePdf(
  '<html><body><h1>Hello</h1></body></html>',
  { format: 'A4' }
);

console.log(result.pdf_url);

// Close connection when done
api[Symbol.dispose]();
```

### Promise Pipelining Example

```typescript
// All these calls happen in ONE round trip!
const userIdPromise = api.getUserId(); // Don't await yet

// Use the promise result in another call
const invoicePromise = api.generateInvoicePdf(userIdPromise);
const receiptPromise = api.generateReceiptPdf(userIdPromise);

// Now await everything at once
const [userId, invoice, receipt] = await Promise.all([
  userIdPromise,
  invoicePromise,
  receiptPromise
]);
```

### Batch Generation with Pipelining

```typescript
using api = newWebSocketRpcSession('wss://api.speedstein.com/api/rpc');

const jobs = [
  { html: '<html>Invoice #1</html>', options: {} },
  { html: '<html>Invoice #2</html>', options: {} },
  { html: '<html>Invoice #3</html>', options: {} }
];

// Generate all PDFs in parallel
const results = await api.generateBatch(jobs);

results.forEach((result, i) => {
  console.log(`PDF ${i + 1}: ${result.pdf_url}`);
});
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request successful |
| **400** | Bad Request | Invalid request body or parameters |
| **401** | Unauthorized | Missing or invalid API key |
| **402** | Payment Required | Usage limit exceeded, upgrade plan |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error, retry with backoff |
| **503** | Service Unavailable | Temporary downtime, retry later |

### Error Response Format

```typescript
{
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional context
  };
}
```

### Common Error Codes

#### `INVALID_HTML`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_HTML",
    "message": "HTML content is required and cannot be empty",
    "details": {
      "field": "html"
    }
  }
}
```

#### `HTML_TOO_LARGE`
```json
{
  "success": false,
  "error": {
    "code": "HTML_TOO_LARGE",
    "message": "HTML content exceeds maximum size of 5MB",
    "details": {
      "size_bytes": 6291456,
      "max_size_bytes": 5242880
    }
  }
}
```

#### `QUOTA_EXCEEDED`
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly PDF quota exceeded. Upgrade your plan or wait for next billing period.",
    "details": {
      "pdfs_generated": 5000,
      "pdfs_limit": 5000,
      "period_end": "2025-10-31T23:59:59Z"
    }
  }
}
```

#### `RATE_LIMIT_EXCEEDED`
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 50 requests per minute.",
    "details": {
      "retry_after": 45
    }
  }
}
```

### Error Handling Best Practices

```javascript
async function generatePdfWithRetry(html, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.speedstein.com/api/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html, options })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit: exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (response.status === 402) {
          // Quota exceeded: don't retry
          throw new Error('Quota exceeded. Please upgrade your plan.');
        }

        if (response.status >= 500) {
          // Server error: retry with backoff
          const delay = Math.min(2000 * attempt, 10000);
          console.log(`Server error. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Client error: don't retry
        throw new Error(data.error.message);
      }

      return data;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

---

## Rate Limits

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 50           # Requests allowed per minute
X-RateLimit-Remaining: 47       # Requests remaining in current window
X-RateLimit-Reset: 1698345600   # Unix timestamp when limit resets
```

### Rate Limits by Plan

| Plan | Requests/Minute | Burst Limit |
|------|----------------|-------------|
| **Free** | 10 | 20 |
| **Starter** | 50 | 100 |
| **Pro** | 200 | 400 |
| **Enterprise** | 1000 | 2000 |

### Handling Rate Limits

```javascript
async function handleRateLimit(response) {
  if (response.status === 429) {
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));
    const now = Math.floor(Date.now() / 1000);
    const waitTime = Math.max(0, resetTime - now) * 1000;

    console.log(`Rate limited. Waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Retry request
    return fetch(response.url, {
      method: response.method,
      headers: response.headers,
      body: response.body
    });
  }

  return response;
}
```

---

## Webhooks

Register webhook URLs to receive notifications when PDF generation completes (useful for async workflows).

### Register Webhook

**Endpoint:** `POST /api/webhooks`

```json
{
  "url": "https://yourapp.com/webhooks/speedstein",
  "events": ["pdf.completed", "pdf.failed"]
}
```

### Webhook Payload

When a PDF generation completes, we'll POST to your webhook URL:

```json
{
  "event": "pdf.completed",
  "timestamp": "2025-10-25T10:30:00Z",
  "data": {
    "request_id": "req_abc123",
    "pdf_url": "https://cdn.speedstein.com/pdfs/abc123.pdf",
    "size": 45678,
    "generation_time_ms": 1234,
    "metadata": {
      "invoice_id": "1001"
    }
  },
  "signature": "sha256=..."
}
```

### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Express.js example
app.post('/webhooks/speedstein', (req, res) => {
  const signature = req.headers['x-speedstein-signature'];
  
  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;

  if (event === 'pdf.completed') {
    console.log(`PDF ready: ${data.pdf_url}`);
    // Update your database, send email, etc.
  }

  res.status(200).send('OK');
});
```

---

## Code Examples

### Node.js (JavaScript)

```javascript
const fetch = require('node-fetch');

async function generateInvoicePdf(invoiceData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          .total { font-size: 20px; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice #${invoiceData.number}</p>
          <p>Date: ${invoiceData.date}</p>
        </div>
        <div class="invoice-details">
          <p><strong>Bill To:</strong> ${invoiceData.customer}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">Total: $${invoiceData.total.toFixed(2)}</p>
      </body>
    </html>
  `;

  const response = await fetch('https://api.speedstein.com/api/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SPEEDSTEIN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html,
      options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      }
    })
  });

  const data = await response.json();
  return data.pdf_url;
}

// Usage
const invoiceData = {
  number: '1001',
  date: '2025-10-25',
  customer: 'Acme Corp',
  items: [
    { name: 'Widget A', quantity: 10, price: 29.99 },
    { name: 'Widget B', quantity: 5, price: 49.99 }
  ],
  total: 549.85
};

generateInvoicePdf(invoiceData)
  .then(url => console.log('Invoice PDF:', url))
  .catch(error => console.error('Error:', error));
```

### Python

```python
import requests
import os

def generate_pdf(html, options=None):
    api_key = os.getenv('SPEEDSTEIN_API_KEY')
    url = 'https://api.speedstein.com/api/generate'
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'html': html,
        'options': options or {}
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    return response.json()

# Usage
html = '''
<!DOCTYPE html>
<html>
  <body>
    <h1>Hello from Python!</h1>
    <p>This PDF was generated using Speedstein API.</p>
  </body>
</html>
'''

result = generate_pdf(html, {
    'format': 'A4',
    'printBackground': True
})

print(f"PDF URL: {result['pdf_url']}")
print(f"Credits remaining: {result['credits_remaining']}")
```

### PHP

```php
<?php

function generatePdf($html, $options = []) {
    $apiKey = getenv('SPEEDSTEIN_API_KEY');
    $url = 'https://api.speedstein.com/api/generate';
    
    $payload = json_encode([
        'html' => $html,
        'options' => $options
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('PDF generation failed: ' . $response);
    }
    
    return json_decode($response, true);
}

// Usage
$html = <<<HTML
<!DOCTYPE html>
<html>
  <body>
    <h1>Hello from PHP!</h1>
    <p>This PDF was generated using Speedstein API.</p>
  </body>
</html>
HTML;

$result = generatePdf($html, [
    'format' => 'A4',
    'printBackground' => true
]);

echo "PDF URL: " . $result['pdf_url'] . "\n";
?>
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

def generate_pdf(html, options = {})
  api_key = ENV['SPEEDSTEIN_API_KEY']
  uri = URI('https://api.speedstein.com/api/generate')
  
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri.path, {
    'Authorization' => "Bearer #{api_key}",
    'Content-Type' => 'application/json'
  })
  
  request.body = {
    html: html,
    options: options
  }.to_json
  
  response = http.request(request)
  JSON.parse(response.body)
end

# Usage
html = <<~HTML
  <!DOCTYPE html>
  <html>
    <body>
      <h1>Hello from Ruby!</h1>
      <p>This PDF was generated using Speedstein API.</p>
    </body>
  </html>
HTML

result = generate_pdf(html, {
  format: 'A4',
  printBackground: true
})

puts "PDF URL: #{result['pdf_url']}"
```

---

## Best Practices

### 1. Optimize HTML for PDF

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Use print-friendly CSS */
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
    }
    
    /* Prevent page breaks inside elements */
    h1, h2, h3 {
      page-break-after: avoid;
    }
    
    table {
      page-break-inside: avoid;
    }
    
    /* Hide elements in print */
    .no-print {
      display: none;
    }
  </style>
</head>
<body>
  <h1>Your Content</h1>
</body>
</html>
```

### 2. Use Batch Generation for Multiple PDFs

Instead of:
```javascript
// Slow: Sequential generation
for (const invoice of invoices) {
  const pdf = await generatePdf(invoice.html);
  await savePdf(pdf.url);
}
```

Do this:
```javascript
// Fast: Parallel batch generation
const jobs = invoices.map(inv => ({ html: inv.html }));
const response = await fetch('https://api.speedstein.com/api/batch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: JSON.stringify({ jobs })
});
const results = await response.json();
```

### 3. Cache Generated PDFs

If you generate the same PDF multiple times, cache it:

```javascript
const crypto = require('crypto');

function getHtmlHash(html) {
  return crypto.createHash('sha256').update(html).digest('hex');
}

async function generateOrGetCachedPdf(html, options) {
  const hash = getHtmlHash(html + JSON.stringify(options));
  
  // Check cache
  const cached = await db.query('SELECT url FROM pdf_cache WHERE hash = ?', [hash]);
  if (cached) {
    return cached.url;
  }
  
  // Generate new PDF
  const result = await generatePdf(html, options);
  
  // Store in cache
  await db.query('INSERT INTO pdf_cache (hash, url) VALUES (?, ?)', [hash, result.pdf_url]);
  
  return result.pdf_url;
}
```

### 4. Use WebSocket for High-Volume Applications

For applications generating >100 PDFs/minute:

```javascript
import { newWebSocketRpcSession } from 'capnweb';

// Keep connection alive
const api = newWebSocketRpcSession('wss://api.speedstein.com/api/rpc');

// Reuse connection for all PDFs
async function generateManyPdfs(htmlArray) {
  const results = await Promise.all(
    htmlArray.map(html => api.generatePdf(html, { format: 'A4' }))
  );
  return results;
}
```

---

## Support

- **Documentation:** [docs.speedstein.com](https://docs.speedstein.com)
- **API Status:** [status.speedstein.com](https://status.speedstein.com)
- **Email Support:** support@speedstein.com
- **Discord Community:** [discord.gg/speedstein](https://discord.gg/speedstein)
- **GitHub Examples:** [github.com/speedstein/examples](https://github.com/speedstein/examples)

---

**API Version:** 1.0  
**Last Updated:** October 25, 2025
