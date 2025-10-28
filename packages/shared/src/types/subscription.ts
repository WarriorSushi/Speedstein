/**
 * Subscription Types
 * Phase 2: Foundational (T016)
 * Defines subscription plans, statuses, and related types
 */

export const PlanId = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanId = (typeof PlanId)[keyof typeof PlanId];

export const SubscriptionStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  TRIALING: 'trialing',
  PAUSED: 'paused',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  quota: {
    pdfs_per_month: number;
    max_pdf_size_mb: number;
    concurrent_requests: number;
    batch_operations: boolean;
  };
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  dodo_subscription_id: string | null;
  dodo_customer_id: string | null;
  current_period_start: string | null; // ISO 8601
  current_period_end: string | null; // ISO 8601
  cancel_at_period_end: boolean;
  canceled_at: string | null; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface UsageSummary {
  pdfs_generated: number;
  quota_limit: number;
  quota_remaining: number;
  quota_percentage_used: number;
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
}

export interface PaymentEvent {
  id: string;
  idempotency_key: string;
  event_type: string;
  dodo_subscription_id: string | null;
  dodo_customer_id: string | null;
  payload: Record<string, unknown>;
  processed_at: string; // ISO 8601
  created_at: string; // ISO 8601
}

// Subscription plan definitions
export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  [PlanId.FREE]: {
    id: PlanId.FREE,
    name: 'Free',
    description: 'Perfect for trying out Speedstein',
    price: 0,
    currency: 'usd',
    interval: 'month',
    quota: {
      pdfs_per_month: 100,
      max_pdf_size_mb: 5,
      concurrent_requests: 1,
      batch_operations: false,
    },
    features: [
      '100 PDFs per month',
      '5 MB max PDF size',
      'Standard processing speed',
      'Community support',
    ],
  },
  [PlanId.STARTER]: {
    id: PlanId.STARTER,
    name: 'Starter',
    description: 'For small teams and growing businesses',
    price: 2900, // $29.00
    currency: 'usd',
    interval: 'month',
    quota: {
      pdfs_per_month: 5000,
      max_pdf_size_mb: 25,
      concurrent_requests: 5,
      batch_operations: true,
    },
    features: [
      '5,000 PDFs per month',
      '25 MB max PDF size',
      'Priority processing',
      'Batch operations',
      'Email support',
    ],
  },
  [PlanId.PRO]: {
    id: PlanId.PRO,
    name: 'Pro',
    description: 'For professional teams with high volume',
    price: 14900, // $149.00
    currency: 'usd',
    interval: 'month',
    quota: {
      pdfs_per_month: 50000,
      max_pdf_size_mb: 100,
      concurrent_requests: 20,
      batch_operations: true,
    },
    features: [
      '50,000 PDFs per month',
      '100 MB max PDF size',
      'Fastest processing',
      'Batch operations',
      'Priority support',
      'Custom templates',
    ],
  },
  [PlanId.ENTERPRISE]: {
    id: PlanId.ENTERPRISE,
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 99900, // $999.00
    currency: 'usd',
    interval: 'month',
    quota: {
      pdfs_per_month: 500000,
      max_pdf_size_mb: 500,
      concurrent_requests: 100,
      batch_operations: true,
    },
    features: [
      '500,000 PDFs per month',
      '500 MB max PDF size',
      'Dedicated infrastructure',
      'Batch operations',
      '24/7 premium support',
      'Custom SLA',
      'Dedicated account manager',
      'Custom integrations',
    ],
  },
};

// Type guards
export function isValidPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PlanId;
}

export function isValidSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return typeof value === 'string' && value in SubscriptionStatus;
}
