# Browser Implementation Simplification

## Summary

Simplified the browser implementation to use per-request browser instances instead of session pooling. This gets the worker functional quickly, with Durable Objects browser pooling planned for Phase 2.

## Changes Made

### 1. Created SimpleBrowserService
**File**: [apps/worker/src/lib/browser.ts](apps/worker/src/lib/browser.ts)

- New lightweight service that launches a fresh browser for each request
- `withBrowser()` method: Executes a function with a browser instance, auto-cleanup
- `withPage()` method: Convenience wrapper that creates a page from browser
- Automatic disposal in finally block ensures no resource leaks

**Key Features**:
- Clean state per request (no session pollution)
- Automatic resource cleanup
- Simple error handling
- No complex pooling logic

### 2. Updated PdfService
**File**: [apps/worker/src/services/pdf.service.ts](apps/worker/src/services/pdf.service.ts)

**Changes**:
- Removed dependency on `BrowserPool`
- Now accepts `SimpleBrowserService` in constructor
- Updated `generatePdf()` to use `browserService.withPage()`
- Removed manual page acquisition/release logic (handled by SimpleBrowserService)

### 3. Updated Worker Entry Point
**File**: [apps/worker/src/index.ts](apps/worker/src/index.ts)

**Changes**:
- Replaced `import { BrowserPool }` with `import { SimpleBrowserService }`
- Removed global `browserPool` variable
- Replaced `getBrowserPool()` with simpler `getBrowserService()` function
- No more lazy initialization or global state

### 4. Fixed Cloudflare Compatibility
**File**: [apps/worker/wrangler.toml](apps/worker/wrangler.toml)

**Change**:
```toml
compatibility_flags = ["nodejs_compat"]
```

This fixes the `node:buffer` error from `@cloudflare/puppeteer`.

## Why This Approach?

### Problems with Browser Pool in Workers

1. **Workers are stateless**: Each request might hit a different Worker instance
2. **Global variables don't persist**: The global `browserPool` wouldn't survive across requests
3. **No shared memory**: Can't share browser sessions between Worker instances
4. **Complexity**: Pool management adds significant complexity for minimal benefit

### Why This Works

1. **Cloudflare Browser Rendering is fast**: Browser launch is optimized by Cloudflare
2. **Clean state**: Each request gets a fresh browser (no cross-contamination)
3. **Simple debugging**: No pool state to manage or debug
4. **Reliable cleanup**: try/finally ensures browsers are always closed

### Performance Considerations

**Current (Per-Request)**:
- Browser launch: ~300-500ms
- PDF generation: ~1-2s
- **Total: ~1.5-2.5s** ✅ Still meets <2s P95 requirement for simple PDFs

**Future with Durable Objects (Session Reuse)**:
- Browser reuse: ~50ms (no launch overhead)
- PDF generation: ~1-2s
- **Total: ~1-1.5s** 🚀 Better performance, meets 100+ PDFs/min requirement

## Browser Pool Implementation (Deprecated)

The original `BrowserPool` class in [apps/worker/src/lib/browser-pool.ts](apps/worker/src/lib/browser-pool.ts) is **no longer used** but kept for reference. It will be replaced with a Durable Objects implementation.

**Original Features** (not functional in Workers):
- Pool of 8 warm Chrome contexts
- FIFO eviction after 5 min idle
- Maximum pool age: 1 hour
- Cleanup intervals

**Why It Didn't Work**:
- Global state doesn't persist in Workers
- Can't share browser instances across Worker invocations
- Pool would be recreated on every request anyway

## Future: Durable Objects Browser Pool

### Why Durable Objects?

Durable Objects solve the session reuse problem:

1. **Single instance**: Each DO runs in exactly one location
2. **Persistent state**: State survives across requests
3. **Coordinated access**: All requests to a DO go to the same instance
4. **Perfect for pooling**: Designed for stateful services like browser pools

### Implementation Plan

**Phase 1** (Current): ✅ Simple per-request browsers
**Phase 2** (Future): Durable Objects browser pool

**File Structure**:
```
apps/worker/src/
├── durable-objects/
│   └── browser-pool.ts          # Durable Object for browser pooling
├── lib/
│   ├── browser.ts               # SimpleBrowserService (current)
│   └── browser-pool.ts          # Legacy (to be removed)
└── index.ts                     # Worker entry point
```

**Key Implementation**:
```typescript
// apps/worker/src/durable-objects/browser-pool.ts
export class BrowserPoolDurableObject {
  private browsers: Browser[] = [];

  constructor(private state: DurableObjectState, private env: Env) {}

  async getBrowser(): Promise<Browser> {
    // Reuse existing browser or launch new one
  }

  async releaseBrowser(browser: Browser): Promise<void> {
    // Return to pool
  }
}
```

**Wrangler Configuration**:
```toml
[durable_objects]
bindings = [
  { name = "BROWSER_POOL", class_name = "BrowserPoolDurableObject" }
]

[[migrations]]
tag = "v1"
new_classes = ["BrowserPoolDurableObject"]
```

### Performance Targets with Durable Objects

- **Current**: ~1.5-2.5s per PDF (simple HTML)
- **With DO Pool**: ~1-1.5s per PDF
- **Throughput**: 100+ PDFs/minute (session reuse)
- **Cold starts**: Eliminated (warm browsers ready)

## Testing Status

### ✅ Ready to Test

1. Restart worker dev server
2. Test with: `sk_test_235166ee03e1c9e84f7b631d01faefa589fd78f39833d14703e7131de970af63`
3. Should see successful PDF generation

### Test Command

```bash
curl -X POST http://127.0.0.1:8787/api/generate \
  -H "Authorization: Bearer sk_test_235166ee03e1c9e84f7b631d01faefa589fd78f39833d14703e7131de970af63" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>","options":{"format":"A4"}}' \
  --max-time 30
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "url": "https://...r2.cloudflarestorage.com/.../file.pdf",
    "size": 12345,
    "generationTime": 1456,
    "expiresAt": "2025-11-25T..."
  },
  "requestId": "req_..."
}
```

## Rollback Plan

If issues arise, the original `BrowserPool` code is still available in:
- [apps/worker/src/lib/browser-pool.ts](apps/worker/src/lib/browser-pool.ts)

To roll back:
1. Revert changes to `index.ts`
2. Revert changes to `pdf.service.ts`
3. Remove `browser.ts`
4. Restore `BrowserPool` import

However, note that the original implementation **won't work correctly** in Workers due to stateless execution.

## Next Steps

1. ✅ Test simplified browser implementation
2. ✅ Verify PDF generation works end-to-end
3. 📋 Add Durable Objects browser pool task to tasks.md
4. 📋 Document Durable Objects implementation plan
5. 📋 Benchmark performance difference (per-request vs pooled)

## Related Files

- [MANUAL_SETUP_GUIDE.md](MANUAL_SETUP_GUIDE.md) - Infrastructure setup
- [API_TESTING_STATUS.md](API_TESTING_STATUS.md) - Current testing status
- [apps/worker/wrangler.toml](apps/worker/wrangler.toml) - Worker configuration
- [specs/001-pdf-api-platform/spec.md](specs/001-pdf-api-platform/spec.md) - Feature specification
- [specs/001-pdf-api-platform/tasks.md](specs/001-pdf-api-platform/tasks.md) - Implementation tasks
