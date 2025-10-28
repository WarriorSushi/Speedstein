#!/usr/bin/env node

/**
 * Configure R2 Lifecycle Policies
 *
 * Sets up automatic deletion policies for PDFs based on pricing tier tags.
 * This script creates lifecycle rules in the R2 bucket to automatically
 * delete PDFs after their retention period (1, 7, 30, or 90 days).
 *
 * Usage:
 *   node scripts/configure-r2-lifecycle.mjs
 *
 * Prerequisites:
 *   - Cloudflare account with R2 access
 *   - Wrangler CLI configured (`npx wrangler login`)
 *   - R2 bucket created (`npx wrangler r2 bucket create speedstein-pdfs`)
 *
 * Reference:
 *   https://developers.cloudflare.com/r2/buckets/object-lifecycles/
 */

console.log('🪣 R2 Lifecycle Policy Configuration\n');

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'speedstein-pdfs';

console.log(`Bucket: ${BUCKET_NAME}\n`);

/**
 * Lifecycle policy configuration for Speedstein PDF storage
 *
 * This configuration creates 4 separate lifecycle rules - one for each tier.
 * R2 will automatically delete objects based on their 'tier' custom metadata tag.
 */
const lifecycleConfig = {
  rules: [
    {
      id: 'delete-free-tier-pdfs',
      status: 'Enabled',
      filter: {
        tag: {
          key: 'tier',
          value: 'free',
        },
      },
      expiration: {
        days: 1, // Free tier: 24 hours
      },
      description: 'Auto-delete free tier PDFs after 1 day',
    },
    {
      id: 'delete-starter-tier-pdfs',
      status: 'Enabled',
      filter: {
        tag: {
          key: 'tier',
          value: 'starter',
        },
      },
      expiration: {
        days: 7, // Starter tier: 7 days
      },
      description: 'Auto-delete starter tier PDFs after 7 days',
    },
    {
      id: 'delete-pro-tier-pdfs',
      status: 'Enabled',
      filter: {
        tag: {
          key: 'tier',
          value: 'pro',
        },
      },
      expiration: {
        days: 30, // Pro tier: 30 days
      },
      description: 'Auto-delete pro tier PDFs after 30 days',
    },
    {
      id: 'delete-enterprise-tier-pdfs',
      status: 'Enabled',
      filter: {
        tag: {
          key: 'tier',
          value: 'enterprise',
        },
      },
      expiration: {
        days: 90, // Enterprise tier: 90 days
      },
      description: 'Auto-delete enterprise tier PDFs after 90 days',
    },
  ],
};

console.log('📋 Lifecycle Rules to Configure:\n');

lifecycleConfig.rules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.description}`);
  console.log(`   ID: ${rule.id}`);
  console.log(`   Filter: tier=${rule.filter.tag.value}`);
  console.log(`   Expiration: ${rule.expiration.days} days`);
  console.log('');
});

console.log('⚠️  IMPORTANT: R2 Lifecycle Configuration Requirements\n');
console.log('R2 lifecycle policies must be configured via Cloudflare Dashboard or API.');
console.log('Wrangler CLI does not yet support lifecycle policy management.\n');

console.log('📝 Configuration Steps:\n');
console.log('1. Navigate to Cloudflare Dashboard → R2 → Your Bucket');
console.log('2. Go to Settings → Lifecycle Rules');
console.log('3. Click "Add lifecycle rule" for each tier:\n');

lifecycleConfig.rules.forEach((rule, index) => {
  console.log(`   Rule ${index + 1}: ${rule.description}`);
  console.log(`      - Rule name: ${rule.id}`);
  console.log(`      - Action: Delete objects`);
  console.log(`      - Days after object creation: ${rule.expiration.days}`);
  console.log(`      - Filter by tag: tier = ${rule.filter.tag.value}`);
  console.log('');
});

console.log('🔧 Alternative: Use Cloudflare API\n');
console.log('If you prefer to automate this via API, use the following curl command:\n');

const apiExample = `
# Get your Cloudflare Account ID
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

# Configure lifecycle policy via API
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/\${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/lifecycle" \\
  -H "Authorization: Bearer \${CLOUDFLARE_API_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(lifecycleConfig, null, 2)}'
`;

console.log(apiExample);

console.log('\n💡 Testing Lifecycle Policies:\n');
console.log('After configuration, test with the following script:');
console.log('   node scripts/test-r2-lifecycle.mjs\n');

console.log('📚 Additional Information:\n');
console.log('- R2 lifecycle policies run once per day');
console.log('- Objects are deleted based on their creation date');
console.log('- Custom metadata (tier tag) is set during upload in uploadPdfToR2()');
console.log('- Lifecycle rules are non-reversible - deleted objects cannot be recovered\n');

console.log('📁 Code References:\n');
console.log('- Upload logic: apps/worker/src/lib/r2.ts:uploadPdfToR2()');
console.log('- Tier tagging: apps/worker/src/lib/r2.ts:118 (tier metadata)');
console.log('- Retention periods: apps/worker/src/lib/r2.ts:getRetentionDaysForTier()');
console.log('');

console.log('✅ Configuration guide complete!\n');
