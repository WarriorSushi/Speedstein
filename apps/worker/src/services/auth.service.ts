/**
 * Authentication Service
 *
 * Handles API key authentication and validation.
 * Uses SHA-256 hash lookup for secure API key verification.
 *
 * @packageDocumentation
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { hashApiKey, verifyApiKey } from '../lib/crypto';
import { UnauthorizedError, DatabaseError } from '@speedstein/shared/lib/errors';

/**
 * Authenticated user context
 * Contains user information retrieved during API key validation
 */
export interface AuthContext {
  /** User ID */
  userId: string;

  /** API key ID that was used for authentication */
  apiKeyId: string;

  /** API key name (for logging) */
  apiKeyName: string;

  /** User's email */
  userEmail: string;

  /** User's current plan tier */
  planTier: 'free' | 'starter' | 'pro' | 'enterprise';

  /** User's plan quota */
  planQuota: number;

  /** Current usage count */
  currentUsage: number;
}

/**
 * Authentication Service
 *
 * Validates API keys and retrieves user context for authenticated requests.
 */
export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    // Use service role key for bypassing RLS when validating API keys
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Validate an API key and return user context
   *
   * Performs SHA-256 hash lookup to verify the API key.
   * Also checks if the key has been revoked.
   *
   * @param apiKey - The API key from the Authorization header
   * @returns Authenticated user context
   * @throws UnauthorizedError if API key is invalid or revoked
   * @throws DatabaseError if database query fails
   *
   * @example
   * ```typescript
   * const authService = new AuthService(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
   * const context = await authService.validateApiKey('sk_live_abc123...');
   *
   * console.log(context.userId); // user_123
   * console.log(context.planTier); // 'starter'
   * ```
   */
  async validateApiKey(apiKey: string): Promise<AuthContext> {
    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }

    // Hash the API key for lookup
    const keyHash = await hashApiKey(apiKey);

    try {
      // Query database for API key with user and subscription data
      const { data, error } = await this.supabase
        .from('api_keys')
        .select(
          `
          id,
          user_id,
          name,
          revoked,
          users!inner (
            id,
            email
          ),
          subscriptions!inner (
            plan_tier,
            status
          ),
          usage_quotas!inner (
            plan_quota,
            current_usage
          )
        `
        )
        .eq('key_hash', keyHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          throw new UnauthorizedError('Invalid API key');
        }
        throw new DatabaseError(`API key lookup failed: ${error.message}`);
      }

      if (!data) {
        throw new UnauthorizedError('Invalid API key');
      }

      // Check if key is revoked
      if (data.revoked) {
        throw new UnauthorizedError('API key has been revoked', {
          hint: 'Create a new API key in your dashboard',
        });
      }

      // Update last_used_at timestamp (fire-and-forget, don't await)
      this.updateLastUsedAt(data.id).catch((err) => {
        console.error('Failed to update last_used_at:', err);
      });

      // Return auth context
      return {
        userId: data.user_id,
        apiKeyId: data.id,
        apiKeyName: data.name,
        userEmail: (data.users as any).email,
        planTier: (data.subscriptions as any).plan_tier,
        planQuota: (data.usage_quotas as any).plan_quota,
        currentUsage: (data.usage_quotas as any).current_usage,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof DatabaseError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`API key validation failed: ${errorMessage}`);
    }
  }

  /**
   * Extract API key from Authorization header
   *
   * Supports both "Bearer <key>" and direct key formats.
   *
   * @param authHeader - The Authorization header value
   * @returns The extracted API key
   * @throws UnauthorizedError if header is missing or malformed
   *
   * @example
   * ```typescript
   * const apiKey = authService.extractApiKey('Bearer sk_live_abc123...');
   * // Returns: 'sk_live_abc123...'
   * ```
   */
  extractApiKey(authHeader: string | null): string {
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required');
    }

    // Support both "Bearer <key>" and direct key
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Direct key format
    return authHeader;
  }

  /**
   * Update the last_used_at timestamp for an API key
   * @private
   */
  private async updateLastUsedAt(apiKeyId: string): Promise<void> {
    await this.supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);
  }

  /**
   * Verify that a user has access to a specific resource
   *
   * Used for additional authorization checks beyond API key validation.
   *
   * @param userId - The authenticated user ID
   * @param resourceUserId - The user ID that owns the resource
   * @returns true if user has access
   * @throws UnauthorizedError if user doesn't have access
   */
  verifyResourceAccess(userId: string, resourceUserId: string): void {
    if (userId !== resourceUserId) {
      throw new UnauthorizedError('You do not have access to this resource');
    }
  }
}
