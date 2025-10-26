# R2 Lifecycle Policy Configuration

**Purpose**: Configure tier-based lifecycle policies for automatic PDF deletion in R2 storage.

**Date**: October 26, 2025

## Overview

Speedstein uses Cloudflare R2 to store generated PDFs with tier-based retention periods. PDFs are automatically deleted after their retention period expires based on the user's subscription tier.

## Retention Periods by Tier

| Tier | Retention Period | Lifecycle Rule Name |
|------|------------------|---------------------|
| Free | 1 day | `free-tier-1day-ttl` |
| Starter | 7 days | `starter-tier-7day-ttl` |
| Pro | 30 days | `pro-tier-30day-ttl` |
| Enterprise | 90 days | `enterprise-tier-90day-ttl` |

## Configuration Steps

### 1. Access Cloudflare Dashboard

1. Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Go to **R2** in the sidebar
4. Select the bucket: `speedstein-pdfs`

### 2. Create Lifecycle Rules

For each tier, create a lifecycle rule with the following settings:

#### Rule 1: Free Tier (1 Day)

- **Rule Name**: `free-tier-1day-ttl`
- **Description**: Delete free tier PDFs after 1 day
- **Scope**: Apply to objects with prefix or tag
  - **Tag Key**: `tier`
  - **Tag Value**: `free`
- **Action**: Delete objects
- **Expiration**: After 1 day(s) from object creation
- **Status**: Enabled

#### Rule 2: Starter Tier (7 Days)

- **Rule Name**: `starter-tier-7day-ttl`
- **Description**: Delete starter tier PDFs after 7 days
- **Scope**: Apply to objects with prefix or tag
  - **Tag Key**: `tier`
  - **Tag Value**: `starter`
- **Action**: Delete objects
- **Expiration**: After 7 day(s) from object creation
- **Status**: Enabled

#### Rule 3: Pro Tier (30 Days)

- **Rule Name**: `pro-tier-30day-ttl`
- **Description**: Delete pro tier PDFs after 30 days
- **Scope**: Apply to objects with prefix or tag
  - **Tag Key**: `tier`
  - **Tag Value**: `pro`
- **Action**: Delete objects
- **Expiration**: After 30 day(s) from object creation
- **Status**: Enabled

#### Rule 4: Enterprise Tier (90 Days)

- **Rule Name**: `enterprise-tier-90day-ttl`
- **Description**: Delete enterprise tier PDFs after 90 days
- **Scope**: Apply to objects with prefix or tag
  - **Tag Key**: `tier`
  - **Tag Value**: `enterprise`
- **Action**: Delete objects
- **Expiration**: After 90 day(s) from object creation
- **Status**: Enabled

### 3. Verify Configuration

After creating all 4 rules, verify:

1. All rules are **Enabled**
2. Rules are ordered correctly (order doesn't matter for different tag values)
3. No conflicts exist between rules

### 4. Test Lifecycle Policies

To test that lifecycle policies are working:

```bash
# Upload a test PDF with free tier tag
npx wrangler r2 object put speedstein-pdfs/test-free.pdf \
  --file=./test.pdf \
  --custom-metadata tier=free

# Check object metadata
npx wrangler r2 object head speedstein-pdfs/test-free.pdf

# Wait 25 hours and verify object is deleted
npx wrangler r2 object head speedstein-pdfs/test-free.pdf
# Should return: Object not found
```

## How It Works

### Object Tagging

When PDFs are uploaded to R2, they are tagged with the user's tier:

```typescript
// In apps/worker/src/lib/r2.ts
const putOptions: R2PutOptions = {
  customMetadata: {
    tier: userTier || 'free', // 'free', 'starter', 'pro', or 'enterprise'
    expiresAt: expiresAt.toISOString(),
    uploadedAt: new Date().toISOString(),
  },
};

await bucket.put(fileName, content, putOptions);
```

### Automatic Deletion

Cloudflare R2 automatically:
1. Scans objects daily for lifecycle rule matches
2. Checks if object age exceeds expiration period
3. Deletes matching objects
4. Updates storage metrics

### Monitoring

To monitor lifecycle policy executions:

1. Check R2 Storage Metrics in Cloudflare Dashboard
2. Review object count trends
3. Verify storage usage decreases as expected

## Troubleshooting

### Objects Not Being Deleted

**Symptom**: Objects remain in bucket past expiration period

**Possible Causes**:
1. Lifecycle rule not enabled
2. Tag key/value mismatch (case-sensitive)
3. R2 lifecycle scan hasn't run yet (runs every ~24 hours)

**Resolution**:
1. Verify rule is enabled in dashboard
2. Check object metadata: `npx wrangler r2 object head speedstein-pdfs/{key}`
3. Wait 24-48 hours for lifecycle scan to complete

### Incorrect Tier Tags

**Symptom**: PDFs have wrong tier tag

**Possible Causes**:
1. User subscription tier not passed correctly
2. Default tier fallback being used

**Resolution**:
1. Verify subscription tier is fetched from database
2. Check logs for PDF upload requests
3. Verify `userTier` parameter is passed to `uploadPdfToR2()`

## Security Considerations

- Lifecycle policies are applied server-side by Cloudflare
- Cannot be bypassed by API consumers
- Deleted objects are permanently removed (no soft delete)
- GDPR compliance: Users can request immediate deletion via API

## Cost Impact

Lifecycle policies **reduce storage costs** by automatically removing old PDFs:

- **Free tier**: Max 100 PDFs × 1 day = ~100 PDF-days/month
- **Starter tier**: Max 5K PDFs × 7 days = ~35K PDF-days/month
- **Pro tier**: Max 50K PDFs × 30 days = ~1.5M PDF-days/month
- **Enterprise tier**: Max 500K PDFs × 90 days = ~45M PDF-days/month

At $0.015/GB-month, typical savings:
- Average PDF size: 500KB
- Free tier: ~$0.75/month saved vs unlimited retention
- Starter tier: ~$262/month saved vs unlimited retention

## References

- [Cloudflare R2 Lifecycle Policies Documentation](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Speedstein Pricing Configuration](../apps/worker/src/lib/pricing-config.ts)

## Completion Checklist

- [ ] All 4 lifecycle rules created in Cloudflare Dashboard
- [ ] Rules are enabled and active
- [ ] Test PDF uploaded with free tier tag
- [ ] Verified test PDF deleted after 24+ hours
- [ ] Documented configuration in this file
- [ ] Updated team wiki with lifecycle policy details

---

**Status**: ✅ Configuration guide complete - Manual setup required in Cloudflare Dashboard

**Next Steps**: After configuring in dashboard, proceed with T030 (Modify BrowserPoolDO)
