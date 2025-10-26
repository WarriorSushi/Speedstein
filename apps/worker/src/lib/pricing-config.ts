/**
 * Pricing Configuration
 *
 * Defines pricing tiers, quotas, and features for Speedstein plans.
 * Central source of truth for all pricing-related logic.
 */

/**
 * Pricing tier configuration
 */
export interface PricingTierConfig {
  /** Unique tier identifier */
  id: string;

  /** Display name */
  name: string;

  /** Monthly price in USD */
  price: number;

  /** Monthly PDF generation quota */
  quota: number;

  /** PDF storage retention period in days */
  retentionDays: number;

  /** API rate limit (requests per minute) */
  rateLimit: number;

  /** Whether WebSocket RPC is available */
  websocketRpcEnabled: boolean;

  /** Whether batch operations are available */
  batchOperationsEnabled: boolean;

  /** Maximum PDFs per batch request */
  maxBatchSize: number;

  /** Priority support */
  prioritySupport: boolean;

  /** Custom branding options */
  customBranding: boolean;

  /** SLA uptime guarantee (percentage) */
  slaUptime?: number;

  /** Dedicated support channel */
  dedicatedSupport: boolean;
}

/**
 * Speedstein Pricing Tiers
 *
 * Defines the 4 pricing tiers: Free, Starter, Pro, Enterprise
 */
export const PRICING_TIERS: Record<string, PricingTierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    quota: 100, // 100 PDFs/month
    retentionDays: 1, // 24 hours
    rateLimit: 10, // 10 requests/minute
    websocketRpcEnabled: false,
    batchOperationsEnabled: false,
    maxBatchSize: 1,
    prioritySupport: false,
    customBranding: false,
    dedicatedSupport: false,
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    quota: 5000, // 5,000 PDFs/month
    retentionDays: 7, // 7 days
    rateLimit: 100, // 100 requests/minute
    websocketRpcEnabled: true,
    batchOperationsEnabled: true,
    maxBatchSize: 50,
    prioritySupport: false,
    customBranding: false,
    dedicatedSupport: false,
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149, // CORRECTED from $99 to $149 per original spec
    quota: 50000, // 50,000 PDFs/month
    retentionDays: 30, // 30 days
    rateLimit: 1000, // 1,000 requests/minute
    websocketRpcEnabled: true,
    batchOperationsEnabled: true,
    maxBatchSize: 500,
    prioritySupport: true,
    customBranding: true,
    slaUptime: 99.9,
    dedicatedSupport: false,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    quota: 500000, // 500,000 PDFs/month (CORRECTED from 200K per spec)
    retentionDays: 90, // 90 days
    rateLimit: 10000, // 10,000 requests/minute
    websocketRpcEnabled: true,
    batchOperationsEnabled: true,
    maxBatchSize: 5000,
    prioritySupport: true,
    customBranding: true,
    slaUptime: 99.95,
    dedicatedSupport: true,
  },
};

/**
 * Get pricing tier configuration by tier ID
 *
 * @param tierId - Tier ID (free, starter, pro, enterprise)
 * @returns Pricing tier configuration or null if not found
 */
export function getPricingTier(tierId: string): PricingTierConfig | null {
  return PRICING_TIERS[tierId.toLowerCase()] || null;
}

/**
 * Validate that a user's quota matches their pricing tier
 *
 * @param tierId - User's pricing tier ID
 * @param currentQuota - User's current quota
 * @returns Whether quota matches tier configuration
 */
export function validateQuotaMatchesTier(tierId: string, currentQuota: number): boolean {
  const tier = getPricingTier(tierId);
  if (!tier) return false;

  return tier.quota === currentQuota;
}

/**
 * Get all pricing tiers (for pricing page display)
 *
 * @returns Array of pricing tier configurations
 */
export function getAllPricingTiers(): PricingTierConfig[] {
  return Object.values(PRICING_TIERS);
}

/**
 * Check if a feature is available for a tier
 *
 * @param tierId - User's pricing tier ID
 * @param feature - Feature name
 * @returns Whether feature is available
 */
export function isFeatureAvailable(
  tierId: string,
  feature: keyof Omit<PricingTierConfig, 'id' | 'name' | 'price' | 'quota' | 'retentionDays'>
): boolean {
  const tier = getPricingTier(tierId);
  if (!tier) return false;

  return Boolean(tier[feature]);
}

/**
 * Get retention period for a tier
 *
 * @param tierId - User's pricing tier ID
 * @returns Retention period in days
 */
export function getRetentionDays(tierId: string): number {
  const tier = getPricingTier(tierId);
  return tier?.retentionDays || 1; // Default to 1 day if tier not found
}

/**
 * Get rate limit for a tier
 *
 * @param tierId - User's pricing tier ID
 * @returns Rate limit (requests per minute)
 */
export function getRateLimit(tierId: string): number {
  const tier = getPricingTier(tierId);
  return tier?.rateLimit || 10; // Default to 10 req/min if tier not found
}

/**
 * Pricing tier comparison helper
 *
 * Returns 1 if tierA > tierB, -1 if tierA < tierB, 0 if equal
 */
export function compareTiers(tierIdA: string, tierIdB: string): number {
  const tierOrder = ['free', 'starter', 'pro', 'enterprise'];
  const indexA = tierOrder.indexOf(tierIdA.toLowerCase());
  const indexB = tierOrder.indexOf(tierIdB.toLowerCase());

  if (indexA === -1 || indexB === -1) return 0;

  return indexA > indexB ? 1 : indexA < indexB ? -1 : 0;
}
