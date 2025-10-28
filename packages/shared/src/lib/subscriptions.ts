import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@speedstein/database'
import type {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  PaymentEvent,
  PaymentEventType,
} from '../types/user'

/**
 * Subscription Helper Functions
 * Provides type-safe methods for subscription operations
 */

export class SubscriptionService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }

    return this.mapToSubscription(data)
  }

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle?: BillingCycle,
    dodoSubscriptionId?: string
  ): Promise<Subscription> {
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()

    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        status: 'active',
        billing_cycle: billingCycle || null,
        dodo_subscription_id: dodoSubscriptionId || null,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return this.mapToSubscription(data)
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    userId: string,
    status: SubscriptionStatus
  ): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ status })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return this.mapToSubscription(data)
  }

  /**
   * Upgrade/downgrade subscription tier
   */
  async updateSubscriptionTier(
    userId: string,
    tier: SubscriptionTier,
    billingCycle?: BillingCycle
  ): Promise<Subscription> {
    const updateData: any = { tier }
    if (billingCycle) {
      updateData.billing_cycle = billingCycle
    }

    const { data, error } = await this.supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return this.mapToSubscription(data)
  }

  /**
   * Map database row to Subscription type
   */
  private mapToSubscription(row: any): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      tier: row.tier,
      status: row.status,
      dodoSubscriptionId: row.dodo_subscription_id,
      billingCycle: row.billing_cycle,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

/**
 * Payment Event Helper Functions
 * Provides idempotent payment event recording
 */

export class PaymentEventService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Record a payment event (idempotent using event_id)
   * Returns true if event was newly recorded, false if duplicate
   */
  async recordPaymentEvent(
    eventId: string,
    eventType: PaymentEventType,
    userId: string,
    dodoEventPayload: Record<string, unknown>,
    webhookSignature: string
  ): Promise<{ recorded: boolean; event: PaymentEvent }> {
    // Check if event already exists (idempotency)
    const { data: existing } = await this.supabase
      .from('payment_events')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (existing) {
      return {
        recorded: false,
        event: this.mapToPaymentEvent(existing),
      }
    }

    // Record new event
    const { data, error } = await this.supabase
      .from('payment_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        user_id: userId,
        dodo_event_payload: dodoEventPayload,
        webhook_signature: webhookSignature,
      })
      .select()
      .single()

    if (error) {
      // If unique constraint violation, event was already recorded
      if (error.code === '23505') {
        const { data: existingEvent } = await this.supabase
          .from('payment_events')
          .select('*')
          .eq('event_id', eventId)
          .single()

        return {
          recorded: false,
          event: this.mapToPaymentEvent(existingEvent!),
        }
      }
      throw error
    }

    return {
      recorded: true,
      event: this.mapToPaymentEvent(data),
    }
  }

  /**
   * Get payment events for a user
   */
  async getUserPaymentEvents(userId: string): Promise<PaymentEvent[]> {
    const { data, error } = await this.supabase
      .from('payment_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(this.mapToPaymentEvent)
  }

  /**
   * Map database row to PaymentEvent type
   */
  private mapToPaymentEvent(row: any): PaymentEvent {
    return {
      id: row.id,
      eventId: row.event_id,
      eventType: row.event_type,
      userId: row.user_id,
      dodoEventPayload: row.dodo_event_payload,
      webhookSignature: row.webhook_signature,
      processedAt: row.processed_at,
      createdAt: row.created_at,
    }
  }
}

/**
 * Helper function to check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false
  if (subscription.status !== 'active') return false

  const now = new Date()
  const periodEnd = new Date(subscription.currentPeriodEnd)

  return now < periodEnd
}

/**
 * Helper function to get days until subscription expires
 */
export function getDaysUntilExpiry(subscription: Subscription): number {
  const now = new Date()
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const diff = periodEnd.getTime() - now.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Quota Management Functions (T018)
 * Business logic for quota limits, tier validation, upgrade/downgrade
 */

// Quota limits per tier (must match database schema)
export const QUOTA_LIMITS: Record<SubscriptionTier, number> = {
  free: 100,
  starter: 5000,
  pro: 50000,
  enterprise: 500000,
}

/**
 * Get quota limit for a tier
 */
export function getQuotaLimit(tier: SubscriptionTier): number {
  return QUOTA_LIMITS[tier]
}

/**
 * Check if user has exceeded their quota
 */
export function hasExceededQuota(tier: SubscriptionTier, currentUsage: number): boolean {
  return currentUsage >= getQuotaLimit(tier)
}

/**
 * Calculate remaining quota
 */
export function getRemainingQuota(tier: SubscriptionTier, currentUsage: number): number {
  const limit = getQuotaLimit(tier)
  return Math.max(0, limit - currentUsage)
}

/**
 * Calculate quota usage percentage
 */
export function getQuotaPercentage(tier: SubscriptionTier, currentUsage: number): number {
  const limit = getQuotaLimit(tier)
  if (limit === 0) return 0
  return Math.min(100, (currentUsage / limit) * 100)
}

/**
 * Check if user is nearing quota (80% threshold)
 */
export function isNearingQuota(tier: SubscriptionTier, currentUsage: number): boolean {
  const limit = getQuotaLimit(tier)
  return currentUsage >= limit * 0.8
}

/**
 * Tier hierarchy for upgrade/downgrade validation
 */
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
}

/**
 * Check if upgrade is valid
 */
export function canUpgradeTo(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[targetTier] > TIER_HIERARCHY[currentTier]
}

/**
 * Check if downgrade is valid
 */
export function canDowngradeTo(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[targetTier] < TIER_HIERARCHY[currentTier]
}

/**
 * Get next higher tier (for upgrade suggestions)
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const upgradeMap: Record<SubscriptionTier, SubscriptionTier | null> = {
    free: 'starter',
    starter: 'pro',
    pro: 'enterprise',
    enterprise: null,
  }
  return upgradeMap[currentTier]
}

/**
 * Get previous lower tier (for downgrade options)
 */
export function getPreviousTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const downgradeMap: Record<SubscriptionTier, SubscriptionTier | null> = {
    free: null,
    starter: 'free',
    pro: 'starter',
    enterprise: 'pro',
  }
  return downgradeMap[currentTier]
}

/**
 * Get recommended tier based on usage
 */
export function getRecommendedTier(averageMonthlyPdfs: number): SubscriptionTier {
  if (averageMonthlyPdfs <= 100) return 'free'
  if (averageMonthlyPdfs <= 5000) return 'starter'
  if (averageMonthlyPdfs <= 50000) return 'pro'
  return 'enterprise'
}
