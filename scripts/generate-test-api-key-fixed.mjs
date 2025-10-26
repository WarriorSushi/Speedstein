#!/usr/bin/env node
/**
 * Generate Test API Key - Fixed Version
 *
 * Creates a test API key for E2E testing, handling password_hash if present
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('\nUsage:');
  console.error('  $devVars = Get-Content apps/worker/.dev.vars;');
  console.error('  foreach ($line in $devVars) {');
  console.error('    if ($line -match \'^SUPABASE_URL=(.+)$\') { $env:SUPABASE_URL = $matches[1] };');
  console.error('    if ($line -match \'^SUPABASE_SERVICE_ROLE_KEY=(.+)$\') { $env:SUPABASE_SERVICE_ROLE_KEY = $matches[1] }');
  console.error('  };');
  console.error('  node scripts/generate-test-api-key-fixed.mjs');
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

// Hash password (just a dummy hash for test users)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
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

  // Clean up any old test data first
  console.log('\n0. Cleaning up old test data...');

  // Get test user IDs
  const { data: testUsers } = await supabase
    .from('users')
    .select('id')
    .like('email', 'test-%@speedstein.com');

  if (testUsers && testUsers.length > 0) {
    const userIds = testUsers.map(u => u.id);

    // Delete in order: usage_records, api_keys, subscriptions, users
    await supabase.from('usage_records').delete().in('user_id', userIds);
    await supabase.from('api_keys').delete().in('user_id', userIds);
    await supabase.from('subscriptions').delete().in('user_id', userIds);
    await supabase.from('users').delete().in('id', userIds);

    console.log(`   ✓ Cleaned up ${testUsers.length} old test user(s)`);
  } else {
    console.log('   ✓ No old test data to clean up');
  }

  // 1. Create test user
  const testUserId = crypto.randomUUID();
  const testEmail = `test-${Date.now()}@speedstein.com`;
  const dummyPassword = 'test-password-not-used';

  console.log(`\n1. Creating test user: ${testEmail}`);

  // Try creating user with password_hash first (since DB has NOT NULL constraint)
  let user;
  let userError;

  // Attempt 1: Try with password_hash (most likely needed)
  const userDataWithPassword = {
    id: testUserId,
    email: testEmail,
    name: 'Test User',
    password_hash: await hashPassword(dummyPassword),
  };

  const result1 = await supabase
    .from('users')
    .insert(userDataWithPassword)
    .select()
    .single();

  if (result1.error && result1.error.code === '42703') {
    // Column doesn't exist, try without password_hash
    console.log('   password_hash column not found, trying without it...');
    const userDataWithoutPassword = {
      id: testUserId,
      email: testEmail,
      name: 'Test User',
    };

    const result2 = await supabase
      .from('users')
      .insert(userDataWithoutPassword)
      .select()
      .single();

    user = result2.data;
    userError = result2.error;
  } else {
    user = result1.data;
    userError = result1.error;
  }

  if (userError) {
    console.error('Error creating user:', userError);
    process.exit(1);
  }

  console.log(`   ✓ User created: ${user.id}`);

  // 2. Create subscription (free tier)
  console.log('\n2. Creating free tier subscription');

  // Safety: delete any existing subscription for this user (in case cascade failed)
  await supabase.from('subscriptions').delete().eq('user_id', testUserId);

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,  // Use user.id from the actual created user
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
  const last4 = apiKey.substring(apiKey.length - 4);

  const { data: apiKeyRecord, error: keyError } = await supabase
    .from('api_keys')
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,  // Use user.id from the actual created user
      key_hash: keyHash,
      prefix: keyPrefix,  // Column is named 'prefix' in production DB
      last4: last4,       // Last 4 characters for display
      name: 'E2E Test Key',
      is_active: true,
    })
    .select()
    .single();

  if (keyError) {
    console.error('Error creating API key:', keyError);
    process.exit(1);
  }

  console.log(`   ✓ API key created: ${keyPrefix}...`);

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
  console.log(`\n  $env:TEST_API_KEY="${apiKey}"\n`);
  console.log('Or use it directly:');
  console.log(`\n  node scripts/test-api-e2e.mjs --api-key "${apiKey}" --url "https://speedstein-worker.treasurepacks-com.workers.dev"\n`);
  console.log('═'.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
