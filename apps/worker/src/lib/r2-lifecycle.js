/**
 * R2 Lifecycle Configuration
 *
 * Defines lifecycle rules for automatic PDF deletion based on plan tier.
 * Prevents unbounded storage costs by enforcing retention periods.
 */
import { getRetentionDays } from './pricing-config';
/**
 * R2 Lifecycle Configuration for Speedstein
 *
 * Defines expiration rules for each pricing tier:
 * - Free: 24 hours (1 day)
 * - Starter: 7 days
 * - Pro: 30 days
 * - Enterprise: 90 days
 */
export const R2_LIFECYCLE_RULES = [
    {
        id: 'free-tier-expiration',
        description: 'Delete Free tier PDFs after 24 hours',
        tags: { tier: 'free' },
        expirationDays: 1,
        enabled: true,
    },
    {
        id: 'starter-tier-expiration',
        description: 'Delete Starter tier PDFs after 7 days',
        tags: { tier: 'starter' },
        expirationDays: 7,
        enabled: true,
    },
    {
        id: 'pro-tier-expiration',
        description: 'Delete Pro tier PDFs after 30 days',
        tags: { tier: 'pro' },
        expirationDays: 30,
        enabled: true,
    },
    {
        id: 'enterprise-tier-expiration',
        description: 'Delete Enterprise tier PDFs after 90 days',
        tags: { tier: 'enterprise' },
        expirationDays: 90,
        enabled: true,
    },
];
/**
 * Get lifecycle rule for a pricing tier
 *
 * @param tierId - Pricing tier ID
 * @returns Lifecycle rule or null if not found
 */
export function getLifecycleRuleForTier(tierId) {
    return (R2_LIFECYCLE_RULES.find((rule) => rule.tags?.tier === tierId.toLowerCase()) || null);
}
/**
 * Generate R2 lifecycle configuration JSON
 *
 * This JSON can be used to configure R2 bucket lifecycle via Cloudflare API:
 * PUT /accounts/{account_id}/r2/buckets/{bucket_name}/lifecycle
 *
 * @returns R2 lifecycle configuration object
 */
export function generateR2LifecycleConfig() {
    return {
        rules: R2_LIFECYCLE_RULES.filter((rule) => rule.enabled).map((rule) => ({
            action: {
                type: 'Delete',
            },
            filter: {
                tag: rule.tags ? Object.entries(rule.tags).map(([key, value]) => ({ key, value })) : undefined,
                prefix: rule.prefix,
            },
            expiration: {
                days: rule.expirationDays,
            },
            id: rule.id,
            status: 'Enabled',
        })),
    };
}
/**
 * Calculate PDF expiration date based on tier
 *
 * @param tierId - User's pricing tier
 * @param uploadDate - PDF upload date
 * @returns Expiration date
 */
export function calculateExpirationDate(tierId, uploadDate = new Date()) {
    const retentionDays = getRetentionDays(tierId);
    const expirationDate = new Date(uploadDate);
    expirationDate.setDate(expirationDate.getDate() + retentionDays);
    return expirationDate;
}
/**
 * Check if a PDF has expired
 *
 * @param tierId - User's pricing tier
 * @param uploadDate - PDF upload date
 * @returns Whether PDF has expired
 */
export function isPdfExpired(tierId, uploadDate) {
    const expirationDate = calculateExpirationDate(tierId, uploadDate);
    return new Date() > expirationDate;
}
/**
 * Get user-friendly expiration message
 *
 * @param tierId - User's pricing tier
 * @returns Expiration message for 404 responses
 */
export function getExpirationMessage(tierId) {
    const retentionDays = getRetentionDays(tierId);
    if (retentionDays === 1) {
        return `This PDF has expired per Free plan retention policy (24 hours). Upgrade to a paid plan for longer retention.`;
    }
    const tierNames = {
        free: 'Free',
        starter: 'Starter',
        pro: 'Pro',
        enterprise: 'Enterprise',
    };
    const tierName = tierNames[tierId.toLowerCase()] || tierId;
    return `This PDF has expired per ${tierName} plan retention policy (${retentionDays} days). PDFs are automatically deleted after ${retentionDays} days.`;
}
/**
 * Instructions for applying R2 lifecycle rules via Cloudflare API
 *
 * @example
 * ```bash
 * # Get the lifecycle configuration JSON
 * const config = generateR2LifecycleConfig();
 *
 * # Apply via Cloudflare API
 * curl -X PUT \
 *   "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/speedstein-pdfs/lifecycle" \
 *   -H "Authorization: Bearer {api_token}" \
 *   -H "Content-Type: application/json" \
 *   -d '<config>'
 * ```
 */
export const R2_LIFECYCLE_SETUP_INSTRUCTIONS = `
# Applying R2 Lifecycle Policies for Speedstein

## Option 1: Cloudflare Dashboard (Recommended)

1. Navigate to R2 > PDF_STORAGE bucket
2. Go to "Settings" tab > "Lifecycle Rules"
3. Click "Add Rule" for each tier:

   **Free Tier Rule:**
   - Name: free-tier-expiration
   - Filter: Tag tier = free
   - Action: Delete after 1 day

   **Starter Tier Rule:**
   - Name: starter-tier-expiration
   - Filter: Tag tier = starter
   - Action: Delete after 7 days

   **Pro Tier Rule:**
   - Name: pro-tier-expiration
   - Filter: Tag tier = pro
   - Action: Delete after 30 days

   **Enterprise Tier Rule:**
   - Name: enterprise-tier-expiration
   - Filter: Tag tier = enterprise
   - Action: Delete after 90 days

4. Save all rules

## Option 2: Cloudflare API

\`\`\`bash
# Get account ID and API token from dashboard
ACCOUNT_ID="your-account-id"
API_TOKEN="your-api-token"
BUCKET_NAME="speedstein-pdfs"

# Apply lifecycle configuration
curl -X PUT \\
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets/$BUCKET_NAME/lifecycle" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rules": [
      {
        "id": "free-tier-expiration",
        "action": { "type": "Delete" },
        "filter": { "tag": [{ "key": "tier", "value": "free" }] },
        "expiration": { "days": 1 },
        "status": "Enabled"
      },
      {
        "id": "starter-tier-expiration",
        "action": { "type": "Delete" },
        "filter": { "tag": [{ "key": "tier", "value": "starter" }] },
        "expiration": { "days": 7 },
        "status": "Enabled"
      },
      {
        "id": "pro-tier-expiration",
        "action": { "type": "Delete" },
        "filter": { "tag": [{ "key": "tier", "value": "pro" }] },
        "expiration": { "days": 30 },
        "status": "Enabled"
      },
      {
        "id": "enterprise-tier-expiration",
        "action": { "type": "Delete" },
        "filter": { "tag": [{ "key": "tier", "value": "enterprise" }] },
        "expiration": { "days": 90 },
        "status": "Enabled"
      }
    ]
  }'
\`\`\`

## Verification

1. Upload test PDFs with different tier tags
2. Wait for expiration period to elapse
3. Verify PDFs are deleted automatically
4. Check R2 metrics for lifecycle deletion events

## Important Notes

- Lifecycle rules apply to objects uploaded AFTER the rules are created
- Existing objects won't be retroactively affected unless re-tagged
- Deletion happens once per day (not immediate after expiration)
- Deleted objects cannot be recovered
`;
