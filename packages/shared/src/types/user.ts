// User Types
export interface User {
  id: string
  email: string
  name?: string
  emailVerified: boolean
  verificationToken?: string
  verificationTokenExpiresAt?: string
  resetToken?: string
  resetTokenExpiresAt?: string
  darkModePreference?: boolean
  createdAt: string
  updatedAt: string
}

// API Key Types
export interface ApiKey {
  id: string
  userId: string
  keyHash: string
  prefix: string
  last4: string
  name: string
  revoked: boolean
  createdAt: string
  lastUsedAt?: string
}

// Subscription Types (aligned with database schema)
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly'

export interface Subscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  dodoSubscriptionId?: string
  billingCycle?: BillingCycle
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  updatedAt: string
}

// Payment Event Types
export type PaymentEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.cancelled'

export interface PaymentEvent {
  id: string
  eventId: string // Idempotency key from payment provider
  eventType: PaymentEventType
  userId: string
  dodoEventPayload: Record<string, unknown>
  webhookSignature: string
  processedAt: string
  createdAt: string
}

// Usage Quota Types
export interface UsageQuota {
  id: string
  userId: string
  planQuota: number
  currentUsage: number
  periodStart: string
  periodEnd: string
}

// Tier Quota Configuration
export interface TierQuota {
  tier: SubscriptionTier
  requestsPerMonth: number
  maxConcurrentRequests: number
  maxPageCount: number
  retentionDays: number
  priority: number
}

export const TIER_QUOTAS: Record<SubscriptionTier, Omit<TierQuota, 'tier'>> = {
  free: {
    requestsPerMonth: 100,
    maxConcurrentRequests: 1,
    maxPageCount: 10,
    retentionDays: 7,
    priority: 1,
  },
  starter: {
    requestsPerMonth: 1000,
    maxConcurrentRequests: 3,
    maxPageCount: 50,
    retentionDays: 30,
    priority: 2,
  },
  pro: {
    requestsPerMonth: 10000,
    maxConcurrentRequests: 10,
    maxPageCount: 200,
    retentionDays: 90,
    priority: 3,
  },
  enterprise: {
    requestsPerMonth: 100000,
    maxConcurrentRequests: 50,
    maxPageCount: 1000,
    retentionDays: 365,
    priority: 4,
  },
}
