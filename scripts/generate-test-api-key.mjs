#!/usr/bin/env node
/**
 * Generate Test API Key
 *
 * Creates a test API key for E2E testing by:
 * 1. Connecting to Supabase
 * 2. Creating a test user (if doesn't exist)
 * 3. Generating and storing hashed API key
 * 4. Outputting the plaintext key for testing
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJxxx \
 *   node scripts/generate-test-api-key.mjs
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('\nUsage:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co \\');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJxxx \\');
  console.error('  node scripts/generate-test-api-key.mjs');
  process.exit(1);
}

// Generate random API key
function generateApiKey() {
  const randomBytes = crypto.randomBytes(32);
  return `sk_test_${randomBytes.toString('base64url')}`;
}

// Hash API key with SHA-256
async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function main() {
  console.log('\n🔑 Generating test API key...\n');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`Connecting to: ${SUPABASE_URL}`);

  // 1. Create test user
  const testUserId = crypto.randomUUID();
  const testEmail = `test-${Date.now()}@speedstein.com`;

  console.log(`\n1. Creating test user: ${testEmail}`);

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: testUserId,
      email: testEmail,
      name: 'Test User',
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user:', userError);
    process.exit(1);
  }

  console.log(`   ✓ User created: ${user.id}`);

  // 2. Create subscription (free tier)
  console.log('\n2. Creating free tier subscription');

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      id: crypto.randomUUID(),
      user_id: testUserId,
      plan_tier: 'free',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    process.exit(1);
  }

  console.log(`   ✓ Subscription created: ${subscription.plan_tier} tier`);

  // 3. Generate API key
  console.log('\n3. Generating API key');

  const apiKey = generateApiKey();
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.substring(0, 10);

  const { data: apiKeyRecord, error: keyError } = await supabase
    .from('api_keys')
    .insert({
      id: crypto.randomUUID(),
      user_id: testUserId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: 'E2E Test Key',
      is_active: true,
    })
    .select()
    .single();

  if (keyError) {
    console.error('Error creating API key:', keyError);
    process.exit(1);
  }

  console.log(`   ✓ API key created: ${apiKeyRecord.key_prefix}...`);

  // Output results
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test API key generated successfully!');
  console.log('═'.repeat(60));
  console.log('\nTest User Details:');
  console.log(`  User ID:      ${user.id}`);
  console.log(`  Email:        ${user.email}`);
  console.log(`  Plan Tier:    ${subscription.plan_tier}`);
  console.log(`  Quota:        100 PDFs/month`);
  console.log('\nAPI Key (save this - it won\'t be shown again):');
  console.log(`\n  ${apiKey}\n`);
  console.log('Export it for testing:');
  console.log(`\n  export TEST_API_KEY="${apiKey}"\n`);
  console.log('Or use it directly:');
  console.log(`\n  node scripts/test-api-e2e.mjs --api-key "${apiKey}"\n`);
  console.log('═'.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
