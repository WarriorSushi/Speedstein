# Speedstein - Credentials & Configuration Needed

**Created**: 2025-10-29
**For Feature**: 006-launch-readiness (Compliance Fixes & MVP Launch)
**Status**: PLACEHOLDER CREDENTIALS - Replace with real values

This document lists all external service credentials, API keys, and configuration values that need to be provided by the user to complete the implementation. All values below are **PLACEHOLDERS** and must be replaced with actual credentials.

---

## 🔐 Required Credentials (CRITICAL - P1 Blockers)

### 1. DodoPayments API Keys

**Service**: DodoPayments (payment processing)
**Required For**: Phases 4-5 (DodoPayments Integration)
**Sign Up**: https://dodopayments.com/signup (or actual URL)
**Cost**: Free sandbox + paid production

**Environment Variables Needed**:

```bash
# File: apps/web/.env.local
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_test_PLACEHOLDER_REPLACE_WITH_REAL_KEY"
DODO_SECRET_KEY="sk_test_PLACEHOLDER_REPLACE_WITH_REAL_KEY"
DODO_WEBHOOK_SECRET="whsec_PLACEHOLDER_REPLACE_WITH_REAL_SECRET"
```

**How to Obtain**:
1. Sign up at DodoPayments
2. Navigate to Dashboard → API Keys
3. Copy "Publishable Key" (starts with `pk_test_` for sandbox)
4. Copy "Secret Key" (starts with `sk_test_` for sandbox)
5. Navigate to Dashboard → Webhooks
6. Create webhook endpoint: `https://speedstein.com/api/webhooks/dodo`
7. Copy "Webhook Secret" (starts with `whsec_`)

**Sandbox vs. Production**:
- Sandbox keys: `pk_test_...` and `sk_test_...` (for development/testing)
- Production keys: `pk_live_...` and `sk_live_...` (for production deployment)

**Test Cards** (for E2E tests):
- Success: `4242 4242 4242 4242` (Visa, any future expiry, any CVC)
- Decline: `4000 0000 0000 0002` (Visa, triggers payment failure)
- Requires 3DS: `4000 0027 6000 3184` (for testing authentication flows)

---

### 2. Sentry DSN (Error Tracking)

**Service**: Sentry.io (error monitoring and alerting)
**Required For**: Phase 6 (Sentry Configuration)
**Sign Up**: https://sentry.io/signup/
**Cost**: Free tier (10K errors/month) or Team plan ($26/month)

**Environment Variables Needed**:

```bash
# File: apps/web/.env.local
NEXT_PUBLIC_SENTRY_DSN="https://PLACEHOLDER_REPLACE_WITH_REAL_DSN@o123456.ingest.sentry.io/7890123"

# File: apps/worker/.dev.vars
SENTRY_DSN="https://PLACEHOLDER_REPLACE_WITH_REAL_DSN@o123456.ingest.sentry.io/7890123"

# File: apps/worker/wrangler.toml (add to [vars] section)
SENTRY_DSN="https://PLACEHOLDER_REPLACE_WITH_REAL_DSN@o123456.ingest.sentry.io/7890123"
```

**How to Obtain**:
1. Sign up at https://sentry.io
2. Create new project "speedstein-frontend" (platform: Next.js)
3. Copy DSN from project settings (format: `https://xxx@oXXX.ingest.sentry.io/XXX`)
4. Create second project "speedstein-worker" (platform: Cloudflare Workers)
5. Copy DSN from second project settings

**Organization Settings**:
- **Organization Name**: Speedstein (or your company name)
- **Team**: Create "Engineering" team
- **Alert Rules**:
  - Alert when: Errors exceed 10/minute
  - Alert when: P95 latency exceeds 3 seconds
  - Notification channel: Email or Slack (see below)

**Optional: Slack Integration** (for alerts):
1. Navigate to Sentry Settings → Integrations → Slack
2. Click "Add Slack Workspace"
3. Authorize Sentry bot
4. Configure alert channel (e.g., `#speedstein-alerts`)

---

### 3. Uptime Monitoring (UptimeRobot or Pingdom)

**Service**: UptimeRobot (uptime monitoring and alerting)
**Required For**: Phase 10 (Final Validation & Launch)
**Sign Up**: https://uptimerobot.com/signUp
**Cost**: Free tier (50 monitors, 5-min intervals)

**Configuration**:

**Monitor 1**: API Health Check
- Monitor Type: HTTP(s)
- Friendly Name: "Speedstein API Health"
- URL: `https://api.speedstein.com/health`
- Monitoring Interval: 5 minutes
- Alert Contacts: [Your Email]
- Alert When Down For: 2 minutes (2 failed checks)

**Monitor 2**: Frontend Uptime
- Monitor Type: HTTP(s)
- Friendly Name: "Speedstein Frontend"
- URL: `https://speedstein.com`
- Monitoring Interval: 5 minutes
- Alert Contacts: [Your Email]
- Expected Status Code: 200

**Alert Contacts**:
1. Navigate to "My Settings" → "Alert Contacts"
2. Add email: [your-email@domain.com]
3. Add SMS (optional): [your-phone-number]
4. Add Slack webhook (optional):
   - Create Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
   - Add webhook URL to UptimeRobot alert contacts

**Public Status Page** (optional):
1. Navigate to "Public Status Pages"
2. Create new status page
3. Add both monitors
4. Set custom domain: `status.speedstein.com`
5. Configure DNS CNAME: `status.speedstein.com` → `stats.uptimerobot.com`

**No Credentials Needed**: UptimeRobot stores config in their dashboard, no env vars required.

---

## 🧪 Optional Credentials (P2 - Testing)

### 4. Test Email Service (Mailosaur)

**Service**: Mailosaur (test email inbox for E2E tests)
**Required For**: Phase 7 (E2E Test Suite - email verification tests)
**Sign Up**: https://mailosaur.com/signup
**Cost**: Free trial (limited) or $20/month

**Environment Variables Needed**:

```bash
# File: tests/.env.test
MAILOSAUR_API_KEY="PLACEHOLDER_REPLACE_WITH_REAL_API_KEY"
MAILOSAUR_SERVER_ID="PLACEHOLDER_REPLACE_WITH_SERVER_ID"
```

**How to Obtain**:
1. Sign up at Mailosaur
2. Create a new server (e.g., "Speedstein Testing")
3. Copy Server ID (e.g., `abcd1234`)
4. Navigate to API Settings
5. Copy API Key

**Test Email Address Format**:
```
test-user-{random}@{MAILOSAUR_SERVER_ID}.mailosaur.net
```

**Usage in Tests**:
```typescript
const email = `test-${Date.now()}@${process.env.MAILOSAUR_SERVER_ID}.mailosaur.net`;
// Signup with this email
// Fetch verification email via Mailosaur API
// Extract verification link from email
// Click link to verify account
```

**Alternative**: Use **Supabase Test Email Delivery** (free)
- Supabase local dev sends emails to console instead of real inbox
- Sufficient for local testing, but E2E tests in CI need real inbox

---

## 🔧 Configuration Values (No Signup Required)

### 5. Environment Variable Template

**File**: `apps/web/.env.local` (create from example)

```bash
# Supabase (ALREADY CONFIGURED)
NEXT_PUBLIC_SUPABASE_URL="https://czvvgfprjlkahobgncxo.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # (existing)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # (existing)

# Cloudflare Worker (ALREADY CONFIGURED)
NEXT_PUBLIC_WORKER_URL="https://speedstein-worker.your-subdomain.workers.dev"

# Sentry (TO BE ADDED - Phase 6)
NEXT_PUBLIC_SENTRY_DSN="https://PLACEHOLDER@oXXX.ingest.sentry.io/XXX"

# DodoPayments (TO BE ADDED - Phase 4)
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY="pk_test_PLACEHOLDER"
DODO_SECRET_KEY="sk_test_PLACEHOLDER"
DODO_WEBHOOK_SECRET="whsec_PLACEHOLDER"

# Test Email (OPTIONAL - Phase 7)
MAILOSAUR_API_KEY="PLACEHOLDER"
MAILOSAUR_SERVER_ID="PLACEHOLDER"

# Next.js (ALREADY CONFIGURED)
NEXT_PUBLIC_APP_URL="https://speedstein.com"
```

**File**: `apps/worker/.dev.vars` (create from example)

```bash
# Supabase (ALREADY CONFIGURED)
SUPABASE_URL="https://czvvgfprjlkahobgncxo.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # (existing)

# Sentry (TO BE ADDED - Phase 6)
SENTRY_DSN="https://PLACEHOLDER@oXXX.ingest.sentry.io/XXX"

# Cloudflare R2 (ALREADY CONFIGURED)
R2_BUCKET_NAME="speedstein-pdfs-dev"

# Cloudflare KV (ALREADY CONFIGURED)
# KV namespace bindings configured in wrangler.toml
```

**File**: `apps/worker/wrangler.toml` (update [vars] section)

```toml
[vars]
ENVIRONMENT = "production"
SENTRY_DSN = "https://PLACEHOLDER@oXXX.ingest.sentry.io/XXX"  # ADD THIS

# KV Namespaces (ALREADY CONFIGURED)
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"  # (existing)

# R2 Buckets (ALREADY CONFIGURED)
[[r2_buckets]]
binding = "PDFs"
bucket_name = "speedstein-pdfs-production"  # (existing)
```

---

## 📋 Checklist: Replace Placeholder Credentials

Use this checklist before deploying to production:

### Phase 4-5: DodoPayments Integration
- [ ] Sign up for DodoPayments account
- [ ] Create sandbox API keys (pk_test_, sk_test_)
- [ ] Add keys to `apps/web/.env.local`
- [ ] Create webhook endpoint in DodoPayments dashboard
- [ ] Copy webhook secret to `apps/web/.env.local`
- [ ] Test checkout flow with sandbox keys
- [ ] Generate production API keys (pk_live_, sk_live_) before launch
- [ ] Replace sandbox keys with production keys in Vercel environment

### Phase 6: Sentry Configuration
- [ ] Sign up for Sentry account
- [ ] Create "speedstein-frontend" project
- [ ] Create "speedstein-worker" project
- [ ] Copy frontend DSN to `apps/web/.env.local`
- [ ] Copy worker DSN to `apps/worker/.dev.vars`
- [ ] Add worker DSN to `apps/worker/wrangler.toml`
- [ ] Configure alert rules (errors >10/min, latency >3s)
- [ ] Set up notification channel (email or Slack)
- [ ] Test by triggering intentional error
- [ ] Verify error appears in Sentry dashboard

### Phase 7: E2E Testing (Optional)
- [ ] Sign up for Mailosaur (or use Supabase test emails)
- [ ] Create test server in Mailosaur
- [ ] Copy API key and Server ID to `tests/.env.test`
- [ ] Test email verification flow
- [ ] Alternative: Skip Mailosaur, use Supabase local test emails

### Phase 10: Uptime Monitoring
- [ ] Sign up for UptimeRobot
- [ ] Create API health check monitor (`https://api.speedstein.com/health`)
- [ ] Create frontend uptime monitor (`https://speedstein.com`)
- [ ] Add alert contacts (email, SMS, Slack)
- [ ] Create public status page at `status.speedstein.com` (optional)
- [ ] Configure DNS CNAME for status page
- [ ] Test alerts by temporarily stopping worker

### Production Deployment Checklist
- [ ] All placeholder credentials replaced with production values
- [ ] DodoPayments: Sandbox keys → Production keys
- [ ] Sentry: Projects created and DSNs configured
- [ ] UptimeRobot: Monitors configured and alerts tested
- [ ] Environment variables set in Vercel (frontend)
- [ ] Environment variables set in Cloudflare Workers (backend)
- [ ] Test production deployment in staging environment first
- [ ] Verify all integrations work in production
- [ ] Monitor Sentry for errors post-deployment
- [ ] Monitor UptimeRobot for uptime

---

## 🚨 Security Reminders

1. **Never commit credentials to git**
   - `.env.local` is git-ignored
   - `.dev.vars` is git-ignored
   - Always use environment variables

2. **Rotate credentials regularly**
   - Rotate API keys every 90 days
   - Rotate webhook secrets if compromised
   - Revoke unused API keys

3. **Use sandbox/test credentials in development**
   - Never use production keys in local development
   - DodoPayments: Use `pk_test_` and `sk_test_` locally
   - Switch to `pk_live_` and `sk_live_` only in production

4. **Restrict API key permissions**
   - DodoPayments: Use restricted keys if available
   - Sentry: Use project-specific DSNs, not organization admin keys
   - Supabase: Service role key only on backend, never expose to frontend

5. **Monitor for leaked credentials**
   - Use tools like GitGuardian or TruffleHog
   - Set up GitHub secret scanning
   - Immediately rotate if leaked

---

## 📞 Support Contacts

If you encounter issues obtaining credentials:

- **DodoPayments Support**: support@dodopayments.com (or check their docs)
- **Sentry Support**: https://sentry.io/support/ (check docs first)
- **UptimeRobot Support**: support@uptimerobot.com
- **Mailosaur Support**: support@mailosaur.com

For questions about this document:
- Review `PROJECT_COMPLIANCE_ANALYSIS.md` for context
- Review `specs/006-launch-readiness/plan.md` for implementation details
- Create GitHub issue if documentation is unclear

---

**Document Version**: 1.0
**Last Updated**: 2025-10-29
**Next Review**: After Phase 4, 6, 7, 10 completion
