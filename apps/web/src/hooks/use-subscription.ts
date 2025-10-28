/**
 * Subscription Hook
 * Phase 2: Foundational (T027)
 * Provides user subscription state, tier, quota, and usage
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import type { SubscriptionTier } from '@speedstein/shared';
import type { Database } from '@/types/database';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export interface UsageStats {
  pdfsGenerated: number;
  quotaLimit: number;
  quotaRemaining: number;
  quotaPercentageUsed: number;
  periodStart: string;
  periodEnd: string;
}

export interface UseSubscriptionReturn {
  subscription: Subscription | null;
  tier: SubscriptionTier;
  quota: number;
  usage: UsageStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to access current user's subscription information
 * Use this in Client Components to get subscription tier, quota, and usage
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  /**
   * Fetch subscription and usage data
   */
  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) {
        if (subError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Error fetching subscription:', subError);
        }
        setSubscription(null);
      } else {
        setSubscription(subData);
      }

      // Fetch usage stats for current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: usageData, error: usageError } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      if (usageError) {
        console.error('Error fetching usage:', usageError);
        setUsage(null);
      } else {
        const pdfsGenerated = usageData?.length ?? 0;
        const tier = ((subData as any)?.plan_tier || 'free') as SubscriptionTier;
        const quotaLimit = getQuotaLimit(tier);
        const quotaRemaining = Math.max(0, quotaLimit - pdfsGenerated);
        const quotaPercentageUsed = (pdfsGenerated / quotaLimit) * 100;

        setUsage({
          pdfsGenerated,
          quotaLimit,
          quotaRemaining,
          quotaPercentageUsed: Math.round(quotaPercentageUsed * 100) / 100,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSubscriptionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  /**
   * Get quota limit for a tier
   */
  function getQuotaLimit(tier: SubscriptionTier): number {
    const quotas: Record<SubscriptionTier, number> = {
      free: 100,
      starter: 5000,
      pro: 50000,
      enterprise: 500000,
    };
    return quotas[tier] ?? 100;
  }

  const currentTier = (subscription?.plan_tier || 'free') as SubscriptionTier;

  return {
    subscription,
    tier: currentTier,
    quota: getQuotaLimit(currentTier),
    usage,
    loading: authLoading || loading,
    refresh: fetchSubscriptionData,
  };
}
