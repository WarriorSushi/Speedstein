/**
 * Quota Service
 *
 * Manages PDF generation quotas and usage tracking.
 * Enforces rate limiting based on user's plan tier.
 *
 * @packageDocumentation
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { QuotaExceededError, DatabaseError } from '@speedstein/shared/lib/errors';
import type { QuotaInfo } from '@speedstein/shared/types/pdf';

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  /** Whether the user is allowed to generate another PDF */
  allowed: boolean;

  /** Total quota for the billing period */
  quota: number;

  /** PDFs generated so far */
  used: number;

  /** Remaining quota */
  remaining: number;

  /** Percentage of quota used (0-100+) */
  percentage: number;

  /** ISO 8601 timestamp when quota resets */
  resetDate?: string;
}

/**
 * Quota Service
 *
 * Handles quota checking, enforcement, and usage tracking.
 */
export class QuotaService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if a user has quota remaining
   *
   * Queries the usage_quotas table to determine if the user can generate another PDF.
   *
   * @param userId - The user ID to check
   * @returns Quota check result
   * @throws DatabaseError if query fails
   *
   * @example
   * ```typescript
   * const result = await quotaService.checkQuota('user_123');
   *
   * if (result.allowed) {
   *   // User can generate PDF
   * } else {
   *   throw new QuotaExceededError(result.quota, result.used, result.resetDate);
   * }
   * ```
   */
  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('usage_quotas')
        .select('plan_quota, current_usage, period_end')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new DatabaseError('Quota not found for user');
        }
        throw new DatabaseError(`Quota lookup failed: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('Quota not found for user');
      }

      const quota = data.plan_quota;
      const used = data.current_usage;
      const remaining = Math.max(0, quota - used);
      const percentage = Math.round((used / quota) * 100);
      const allowed = used < quota;

      return {
        allowed,
        quota,
        used,
        remaining,
        percentage,
        resetDate: data.period_end,
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Quota check failed: ${errorMessage}`);
    }
  }

  /**
   * Increment usage counter for a user
   *
   * Uses atomic increment to avoid race conditions.
   * This should be called after successful PDF generation.
   *
   * @param userId - The user ID
   * @throws DatabaseError if update fails
   *
   * @example
   * ```typescript
   * await quotaService.incrementUsage('user_123');
   * ```
   */
  async incrementUsage(userId: string): Promise<void> {
    try {
      // Use atomic increment to avoid race conditions
      // SQL: UPDATE usage_quotas SET current_usage = current_usage + 1 WHERE user_id = ?
      const { error } = await this.supabase.rpc('increment_usage', {
        p_user_id: userId,
      });

      if (error) {
        throw new DatabaseError(`Failed to increment usage: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Usage increment failed: ${errorMessage}`);
    }
  }

  /**
   * Get remaining quota for a user
   *
   * @param userId - The user ID
   * @returns Number of PDFs remaining in quota
   */
  async getRemainingQuota(userId: string): Promise<number> {
    const result = await this.checkQuota(userId);
    return result.remaining;
  }

  /**
   * Calculate quota percentage
   *
   * @param used - Current usage count
   * @param quota - Total quota
   * @returns Percentage used (0-100+, can exceed 100)
   */
  getQuotaPercentage(used: number, quota: number): number {
    if (quota === 0) {
      return Infinity;
    }
    return Math.round((used / quota) * 100);
  }

  /**
   * Determine if upgrade prompt should be shown
   *
   * Shows upgrade prompt when user has used >=80% of quota.
   *
   * @param used - Current usage
   * @param quota - Total quota
   * @returns true if upgrade prompt should be shown
   */
  shouldShowUpgradePrompt(used: number, quota: number): boolean {
    const percentage = this.getQuotaPercentage(used, quota);
    return percentage >= 80;
  }

  /**
   * Enforce quota limit
   *
   * Checks quota and throws QuotaExceededError if limit is reached.
   *
   * @param userId - The user ID
   * @throws QuotaExceededError if quota is exceeded
   *
   * @example
   * ```typescript
   * await quotaService.enforceQuota('user_123');
   * // Throws if quota exceeded, otherwise continues
   * ```
   */
  async enforceQuota(userId: string): Promise<void> {
    const result = await this.checkQuota(userId);

    if (!result.allowed) {
      throw new QuotaExceededError(result.quota, result.used, result.resetDate || '');
    }
  }

  /**
   * Get quota information for user
   *
   * Returns formatted quota info for API responses.
   *
   * @param userId - The user ID
   * @returns Quota information
   */
  async getQuotaInfo(userId: string): Promise<QuotaInfo> {
    const result = await this.checkQuota(userId);

    return {
      quota: result.quota,
      used: result.used,
      remaining: result.remaining,
      percentage: result.percentage,
      resetDate: result.resetDate || new Date().toISOString(),
    };
  }
}
