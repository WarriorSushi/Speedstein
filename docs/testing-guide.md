# Testing Guide

## End-to-End API Testing

### Prerequisites

1. **Running Worker**: Either local or deployed
   ```bash
   # Local development
   cd apps/worker
   pnpm dev  # Runs on http://localhost:8787
   ```

2. **Supabase Database**: With production readiness migration applied
   ```bash
   # Local Supabase
   supabase start

   # Or use production Supabase
   export SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Step 1: Generate Test API Key

Create a test user and API key in the database:

```bash
# For local Supabase
SUPABASE_URL=http://localhost:54321 \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
node scripts/generate-test-api-key.mjs

# For production Supabase
SUPABASE_URL=https://czvvgfprjlkahobgncxo.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_production_key \
node scripts/generate-test-api-key.mjs
```

**Output:**
```
✅ Test API key generated successfully!
═══════════════════════════════════════════════════════

Test User Details:
  User ID:      550e8400-e29b-41d4-a716-446655440000
  Email:        test-1729876543210@speedstein.com
  Plan Tier:    free
  Quota:        100 PDFs/month

API Key (save this - it won't be shown again):

  sk_test_abcd1234xyz...

Export it for testing:

  export TEST_API_KEY="sk_test_abcd1234xyz..."
```

### Step 2: Run E2E Tests

Test the complete PDF generation flow:

```bash
# Test against local worker
export TEST_API_KEY="sk_test_abcd1234xyz..."
node scripts/test-api-e2e.mjs

# Test against production
node scripts/test-api-e2e.mjs \
  --api-key "sk_test_abcd1234xyz..." \
  --url "https://api.speedstein.com"
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════╗
║         Speedstein E2E API Test Suite                   ║
╚══════════════════════════════════════════════════════════╝

Target URL: http://localhost:8787
API Key: sk_test_ab...

============================================================
Test 1: Health Check
============================================================

Calling GET http://localhost:8787/health
✓ Health check passed
Response: {
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00.000Z"
}

============================================================
Test 2: PDF Generation
============================================================

Calling POST http://localhost:8787/api/generate
API Key: sk_test_ab...
HTML size: 1234 bytes
✓ PDF generated successfully in 1523ms
✓ PDF URL: https://cdn.speedstein.com/pdfs/abc123.pdf
Expires at: 2025-10-27T12:00:00.000Z
Generation time: 1456ms
✓ Performance: 1456ms < 2s target ✓

============================================================
Test 3: Batch PDF Generation (Optional)
============================================================

⚠ Batch generation via WebSocket RPC not yet implemented
⚠ This feature requires additional setup (Cap'n Web client)

============================================================
Test Summary
============================================================

Tests passed: 3/3
✓ Health check
✓ PDF generation
✓ Batch generation (skipped)

╔══════════════════════════════════════════════════════════╗
║                  ALL TESTS PASSED ✓                      ║
╚══════════════════════════════════════════════════════════╝
```

### Test Coverage

The E2E test suite covers:

1. **Health Check** (`GET /health`)
   - Verifies worker is running
   - Checks response format

2. **PDF Generation** (`POST /api/generate`)
   - Authentication with API key
   - HTML to PDF conversion
   - R2 storage upload (pdf_url response)
   - Performance validation (< 2s target)
   - Error handling (401, 429, 500)

3. **Batch Generation** (Future)
   - WebSocket connection
   - Promise pipelining
   - Batch throughput

### Troubleshooting

#### Error: "Health check failed"

**Cause**: Worker is not running or not accessible

**Solutions**:
```bash
# Check if worker is running locally
curl http://localhost:8787/health

# Check worker logs
cd apps/worker
pnpm dev  # Check for startup errors

# Check Cloudflare Workers dashboard for production
```

#### Error: "Authentication failed - Invalid API key"

**Cause**: API key is invalid or not in database

**Solutions**:
```bash
# Generate a new test API key
node scripts/generate-test-api-key.mjs

# Verify API key exists in database
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT key_prefix, name, is_active FROM api_keys;"
```

#### Error: "Rate limit exceeded or quota exceeded"

**Cause**: User has hit their quota limit

**Solutions**:
```bash
# Check usage in database
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT * FROM usage_records ORDER BY created_at DESC LIMIT 10;"

# Reset usage count (dev only)
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "DELETE FROM usage_records WHERE user_id = 'YOUR_USER_ID';"

# Or generate a new test API key
node scripts/generate-test-api-key.mjs
```

#### Error: "PDF generation failed: Connection refused"

**Cause**: Supabase or R2 not configured

**Solutions**:
```bash
# Check environment variables
cd apps/worker
cat .dev.vars

# Should contain:
# SUPABASE_URL=http://localhost:54321
# SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Verify Supabase is running
supabase status

# Verify R2 bucket exists
npx wrangler r2 bucket list | grep speedstein-pdfs
```

## Unit Tests

Run unit tests for individual services:

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm --filter worker test

# Watch mode
pnpm --filter worker test --watch

# Coverage report
pnpm --filter worker test --coverage
```

## Integration Tests

Test database operations and middleware:

```bash
# Run integration tests
pnpm --filter worker test:integration

# Test specific integration
pnpm --filter worker test:integration -- auth
```

## Performance Testing

Validate performance targets:

```bash
# Load test with k6 (future)
k6 run tests/load/pdf-generation.js

# Expected metrics:
# - P95 latency < 2 seconds
# - Throughput > 100 PDFs/minute
# - Error rate < 1%
```

## Deployment Verification

After deploying to production, verify:

1. **Health Check**
   ```bash
   curl https://api.speedstein.com/health
   ```

2. **PDF Generation**
   ```bash
   node scripts/test-api-e2e.mjs \
     --api-key "sk_live_xxx" \
     --url "https://api.speedstein.com"
   ```

3. **Monitoring**
   - Check Cloudflare Workers analytics
   - Verify error rates in Sentry
   - Monitor R2 storage usage

## Continuous Integration

Add E2E tests to CI pipeline:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: node scripts/generate-test-api-key.mjs
      - run: node scripts/test-api-e2e.mjs
```
