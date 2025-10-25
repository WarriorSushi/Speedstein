// User Types
export interface User {
  id: string
  email: string
  name?: string
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

// Subscription Types
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface Subscription {
  id: string
  userId: string
  planTier: PlanTier
  status: 'active' | 'past_due' | 'canceled'
  dodoCustomerId?: string
  dodoSubscriptionId?: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
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
