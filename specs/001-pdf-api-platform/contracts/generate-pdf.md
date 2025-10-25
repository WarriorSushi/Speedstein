# API Contract: Generate PDF

**Endpoint**: `POST /api/generate`
**Purpose**: Generate a PDF from HTML content
**Authentication**: API Key (Bearer token or query parameter)
**Rate Limiting**: Subject to user's plan quota (Free: 100/mo, Starter: 5K/mo, Pro: 50K/mo)

## Request

### Headers
```
Authorization: Bearer sk_live_abc123def456...
Content-Type: application/json
```

### Body Schema
```typescript
{
  html: string;              // HTML content (max 10MB)
  options?: {
    format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';  // Default: 'A4'
    orientation?: 'portrait' | 'landscape';                   // Default: 'portrait'
    printBackground?: boolean;                                // Default: true
    margin?: {
      top?: string;          // e.g., '1cm', '10mm', '0.5in'
      right?: string;
      bottom?: string;
      left?: string;
    };
    scale?: number;          // Scale factor 0.1-2.0, default: 1.0
    displayHeaderFooter?: boolean;                            // Default: false
    headerTemplate?: string; // HTML for header
    footerTemplate?: string; // HTML for footer
    preferCSSPageSize?: boolean;                              // Default: false
  };
}
```

### Validation Rules
- `html`: Required, non-empty string, max 10MB (10,485,760 bytes)
- `options.format`: Optional, must be one of supported formats
- `options.orientation`: Optional, must be 'portrait' or 'landscape'
- `options.margin.*`: Optional, must be valid CSS length (e.g., '1cm', '10px')
- `options.scale`: Optional, number between 0.1 and 2.0
- `options.headerTemplate` and `options.footerTemplate`: Must be valid HTML if provided

### Example Request (cURL)
```bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Invoice #12345</h1><p>Amount: $100.00</p></body></html>",
    "options": {
      "format": "A4",
      "orientation": "portrait",
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

## Response

### Success Response (200 OK)
```typescript
{
  success: true;
  url: string;             // Cloudflare R2 URL (e.g., "https://cdn.speedstein.com/pdfs/abc123.pdf")
  generationTime: number;  // Milliseconds taken to generate
  size: number;            // PDF file size in bytes
  expiresAt: string;       // ISO 8601 timestamp (PDFs expire after 30 days)
}
```

### Example Success Response
```json
{
  "success": true,
  "url": "https://cdn.speedstein.com/pdfs/7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d.pdf",
  "generationTime": 1247,
  "size": 245678,
  "expiresAt": "2025-11-24T10:30:00.000Z"
}
```

## Error Responses

### 400 Bad Request - Invalid HTML
```json
{
  "success": false,
  "error": {
    "code": "INVALID_HTML",
    "message": "HTML content is required and must be a non-empty string",
    "details": {
      "field": "html",
      "issue": "missing or empty"
    }
  }
}
```

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid options provided",
    "details": {
      "field": "options.scale",
      "issue": "must be a number between 0.1 and 2.0",
      "provided": 5.0
    }
  }
}
```

### 401 Unauthorized - Invalid API Key
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or revoked API key",
    "details": {
      "hint": "Check your API key in the dashboard at https://speedstein.com/dashboard/api-keys"
    }
  }
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "HTML content exceeds maximum size of 10MB",
    "details": {
      "maxSize": 10485760,
      "providedSize": 15000000
    }
  }
}
```

### 429 Too Many Requests - Quota Exceeded
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "You have exceeded your plan quota of 5,000 PDFs per month",
    "details": {
      "quota": 5000,
      "used": 5000,
      "resetDate": "2025-11-01T00:00:00.000Z",
      "upgradeUrl": "https://speedstein.com/pricing"
    }
  }
}
```

### 504 Gateway Timeout - Generation Timeout
```json
{
  "success": false,
  "error": {
    "code": "GENERATION_TIMEOUT",
    "message": "PDF generation exceeded 10 second timeout",
    "details": {
      "hint": "Try simplifying your HTML or reducing external resources",
      "timeout": 10000
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred during PDF generation",
    "details": {
      "requestId": "req_abc123",
      "hint": "If this persists, contact support@speedstein.com with the request ID"
    }
  }
}
```

## Rate Limiting

### Response Headers
All responses include rate limiting headers:

```
X-RateLimit-Limit: 5000          # Total quota for billing period
X-RateLimit-Remaining: 4750      # Remaining quota
X-RateLimit-Reset: 1730419200    # Unix timestamp when quota resets
X-RateLimit-Used: 250            # PDFs generated so far
```

### Rate Limit Algorithm
- **Quota Type**: Per billing period (monthly)
- **Enforcement**: Checked before PDF generation
- **Quota Tracking**: Stored in `usage_quotas` table, cached in Cloudflare KV (60s TTL)
- **Quota Reset**: Automatic on billing period end via scheduled job

## Performance Targets

- **P95 Latency**: <2 seconds (from request to PDF URL response)
- **P99 Latency**: <3 seconds
- **Throughput**: 100+ PDFs/minute per user (via WebSocket API with promise pipelining)
- **Uptime**: 99.9% (max 43 minutes downtime per month)

## Implementation Notes

### Request Flow
1. **Authentication**: Validate API key via SHA-256 hash lookup in `api_keys` table
2. **Quota Check**: Check `usage_quotas.current_usage < plan_quota` (KV cache, fallback to DB)
3. **HTML Validation**: Validate payload size and structure with Zod schema
4. **PDF Generation**:
   - Get warm browser instance from pool (Cloudflare Browser Rendering API)
   - Load HTML content with `page.setContent()`
   - Generate PDF with `page.pdf(options)`
   - Close page (browser instance returns to pool)
5. **Upload to R2**: Upload PDF to Cloudflare R2 bucket with 30-day TTL
6. **Usage Tracking**:
   - Insert record in `usage_records` table
   - Increment `usage_quotas.current_usage`
   - Update `api_keys.last_used_at`
7. **Response**: Return PDF URL and metadata

### Caching Strategy
- **HTML Content Deduplication**: Hash HTML content with SHA-256, check if PDF already generated for same HTML
- **Cache Hit**: Return existing PDF URL without regenerating (saves compute)
- **Cache Miss**: Generate new PDF and store hash in `usage_records.html_hash`
- **TTL**: 24 hours (configurable)

### Browser Session Pooling
- Maintain pool of 5-10 warm Chrome instances per Cloudflare Worker
- Lazy initialization: Create browser on first request
- Reuse across requests: Same browser instance serves multiple PDFs
- Cleanup: Close browser after 5 minutes of inactivity
- Resource disposal: Always close page in `finally` block to prevent leaks

## Security Considerations

1. **HTML Sanitization**: Do NOT sanitize user HTML (Chrome renders it as-is). User is responsible for content.
2. **SSRF Protection**: Disable network requests in Puppeteer to prevent Server-Side Request Forgery (SSRF) attacks.
3. **Resource Limits**: Set CPU and memory limits on browser instances to prevent abuse.
4. **API Key Validation**: Always validate API key hash, check revoked status, verify user quota.
5. **Rate Limiting**: Enforce quota limits to prevent abuse and ensure fair usage.

## Testing Checklist

- [ ] Valid HTML generates PDF successfully
- [ ] Custom options (page size, margins, orientation) are respected
- [ ] Modern CSS (Flexbox, Grid, CSS variables) render correctly
- [ ] Custom web fonts are embedded
- [ ] Invalid HTML returns 400 Bad Request with clear error message
- [ ] Revoked API key returns 401 Unauthorized
- [ ] Quota exceeded returns 429 with upgrade link
- [ ] HTML >10MB returns 413 Payload Too Large
- [ ] Generation timeout (>10s) returns 504 Gateway Timeout
- [ ] P95 latency <2 seconds under normal load
- [ ] Rate limiting headers are present and accurate
- [ ] Usage quota is incremented after successful generation
- [ ] PDF URL is accessible and downloads correctly
- [ ] PDF expires after 30 days (TTL enforcement)
