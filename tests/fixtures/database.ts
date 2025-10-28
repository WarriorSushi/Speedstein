/**
 * Test Database Fixtures and Seeding Utilities
 *
 * Provides helper functions for seeding test data and creating fixtures
 * for E2E and integration tests.
 *
 * @packageDocumentation
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@speedstein/database'
import type {
  User,
  Subscription,
  SubscriptionTier,
  ApiKey,
} from '@speedstein/shared/types/user'
import { hashApiKey } from '@speedstein/shared/lib/crypto'

/**
 * Test user fixture
 */
export interface TestUser {
  id: string
  email: string
  name: string
  password: string
  emailVerified: boolean
}

/**
 * Test API key fixture
 */
export interface TestApiKey {
  id: string
  userId: string
  key: string // Raw API key (only available in tests)
  prefix: string
  last4: string
  name: string
}

/**
 * Database seeder for tests
 */
export class TestDatabaseSeeder {
  private supabase: SupabaseClient<Database>

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  /**
   * Clean all test data from database
   */
  async cleanup(): Promise<void> {
    // Delete in correct order to respect foreign key constraints
    await this.supabase.from('payment_events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('api_keys').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('usage_quotas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await this.supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  /**
   * Create a test user with subscription
   */
  async createTestUser(options?: {
    email?: string
    name?: string
    tier?: SubscriptionTier
    emailVerified?: boolean
  }): Promise<TestUser> {
    const email = options?.email || `test-${Date.now()}@speedstein.test`
    const name = options?.name || 'Test User'
    const tier = options?.tier || 'free'
    const emailVerified = options?.emailVerified ?? true

    // Create user
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .insert({
        email,
        name,
        email_verified: emailVerified,
      })
      .select()
      .single()

    if (userError) throw new Error(`Failed to create test user: ${userError.message}`)

    // Create subscription
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    const { error: subError } = await this.supabase.from('subscriptions').insert({
      user_id: user.id,
      tier,
      status: 'active',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
    })

    if (subError) throw new Error(`Failed to create subscription: ${subError.message}`)

    // Create usage quota
    const { error: quotaError } = await this.supabase.from('usage_quotas').insert({
      user_id: user.id,
      plan_quota: tier === 'free' ? 100 : tier === 'starter' ? 1000 : tier === 'pro' ? 10000 : 100000,
      current_usage: 0,
      period_start: currentPeriodStart.toISOString(),
      period_end: currentPeriodEnd.toISOString(),
    })

    if (quotaError) throw new Error(`Failed to create usage quota: ${quotaError.message}`)

    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Test User',
      password: 'TestPassword123', // Not actually stored
      emailVerified,
    }
  }

  /**
   * Create a test API key for a user
   */
  async createTestApiKey(
    userId: string,
    options?: {
      name?: string
    }
  ): Promise<TestApiKey> {
    const name = options?.name || 'Test API Key'

    // Generate API key
    const key = `sk_test_${this.generateRandomString(40)}`
    const { hash, prefix, last4 } = await hashApiKey(key)

    // Store in database
    const { data: apiKey, error } = await this.supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        key_hash: hash,
        prefix,
        last4,
        name,
        revoked: false,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create API key: ${error.message}`)

    return {
      id: apiKey.id,
      userId: apiKey.user_id,
      key, // Raw key only available in tests
      prefix: apiKey.prefix,
      last4: apiKey.last4,
      name: apiKey.name,
    }
  }

  /**
   * Update user subscription tier
   */
  async updateUserTier(userId: string, tier: SubscriptionTier): Promise<void> {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({ tier })
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to update subscription tier: ${error.message}`)

    // Update quota
    const planQuota = tier === 'free' ? 100 : tier === 'starter' ? 1000 : tier === 'pro' ? 10000 : 100000

    const { error: quotaError } = await this.supabase
      .from('usage_quotas')
      .update({ plan_quota })
      .eq('user_id', userId)

    if (quotaError) throw new Error(`Failed to update usage quota: ${quotaError.message}`)
  }

  /**
   * Increment user's usage count
   */
  async incrementUsage(userId: string, count = 1): Promise<void> {
    const { data: quota, error: fetchError } = await this.supabase
      .from('usage_quotas')
      .select('current_usage')
      .eq('user_id', userId)
      .single()

    if (fetchError) throw new Error(`Failed to fetch usage quota: ${fetchError.message}`)

    const { error } = await this.supabase
      .from('usage_quotas')
      .update({ current_usage: quota.current_usage + count })
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to increment usage: ${error.message}`)
  }

  /**
   * Generate random string for API keys
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

/**
 * Predefined test fixtures
 */
export const TEST_FIXTURES = {
  users: {
    free: {
      email: 'free@speedstein.test',
      name: 'Free User',
      tier: 'free' as SubscriptionTier,
    },
    starter: {
      email: 'starter@speedstein.test',
      name: 'Starter User',
      tier: 'starter' as SubscriptionTier,
    },
    pro: {
      email: 'pro@speedstein.test',
      name: 'Pro User',
      tier: 'pro' as SubscriptionTier,
    },
    enterprise: {
      email: 'enterprise@speedstein.test',
      name: 'Enterprise User',
      tier: 'enterprise' as SubscriptionTier,
    },
  },
  html: {
    simple: '<h1>Hello World</h1>',
    withStyles: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 2rem; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Styled PDF</h1>
          <p>This is a test PDF with styles.</p>
        </body>
      </html>
    `,
    multiPage: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          <h1>Page 1</h1>
          <p>Content for page 1</p>
          <div class="page-break"></div>
          <h1>Page 2</h1>
          <p>Content for page 2</p>
        </body>
      </html>
    `,
  },
}

/**
 * Get test Supabase client (admin)
 */
export function getTestSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Test Supabase credentials not configured')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Setup test database before tests
 */
export async function setupTestDatabase(): Promise<TestDatabaseSeeder> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Test Supabase credentials not configured')
  }

  const seeder = new TestDatabaseSeeder(supabaseUrl, serviceRoleKey)

  // Clean existing test data
  await seeder.cleanup()

  return seeder
}

/**
 * Teardown test database after tests
 */
export async function teardownTestDatabase(seeder: TestDatabaseSeeder): Promise<void> {
  await seeder.cleanup()
}
