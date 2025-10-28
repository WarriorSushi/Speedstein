/**
 * API Keys Management Endpoints
 * Phase 4: User Story 2 (T056, T059)
 * POST: Create new API key
 * GET: List user's API keys
 * PATCH: Revoke API key
 */

// @ts-nocheck - Supabase generated types have issues with insert/update operations
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '@/lib/api-keys';
import { CreateApiKeySchema, SubscriptionTier } from '@speedstein/shared';
import * as Sentry from '@sentry/nextjs';
import type { Database } from '@/types/database';

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's API keys (RLS will automatically filter by user_id)
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, name, prefix, is_active, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      Sentry.captureException(keysError, {
        tags: { operation: 'api_keys_list' },
        extra: { userId: user.id },
      });
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Unexpected error in GET /api/api-keys:', error);
    Sentry.captureException(error, {
      tags: { operation: 'api_keys_list', critical: true },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/api-keys
 * Create a new API key for the authenticated user
 * Enforces 10 key limit per user (FR-015)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const { data: subscription} = await supabase
      .from('subscriptions')
      .select('plan_tier')
      .eq('user_id', user.id)
      .maybeSingle();

    // Type assertion since plan_tier can be a string union type
    const tier = ((subscription as any)?.plan_tier || 'free') as SubscriptionTier;

    // Check key count limit (10 keys per user - FR-015)
    const { count, error: countError } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting API keys:', countError);
      Sentry.captureException(countError, {
        tags: { operation: 'api_keys_count' },
        extra: { userId: user.id },
      });
      return NextResponse.json({ error: 'Failed to check key limit' }, { status: 500 });
    }

    if (count !== null && count >= 10) {
      Sentry.captureMessage('API key limit reached', {
        level: 'warning',
        tags: { operation: 'api_keys_limit_reached' },
        extra: { userId: user.id, keyCount: count },
      });
      return NextResponse.json(
        { error: 'Maximum of 10 API keys per user. Please revoke unused keys.' },
        { status: 400 }
      );
    }

    // Generate new API key
    const apiKey = generateApiKey(tier);
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = getApiKeyPrefix(apiKey);
    const last4 = apiKey.slice(-4);

    // Store in database
    const insertData = {
      user_id: user.id,
      name: validation.data.name,
      key_hash: keyHash,
      prefix: keyPrefix,
      last4: last4,
      is_active: true,
    };

    const { data: newKey, error: insertError } = (await supabase
      .from('api_keys')
      .insert(insertData as any)
      .select('id, name, prefix, is_active, created_at')
      .single()) as any;

    if (insertError) {
      console.error('Error creating API key:', insertError);
      Sentry.captureException(insertError, {
        tags: { operation: 'api_keys_create' },
        extra: { userId: user.id, keyName: validation.data.name },
      });
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Track successful API key creation
    Sentry.captureMessage('API key created', {
      level: 'info',
      tags: { operation: 'api_keys_create_success' },
      extra: { userId: user.id, keyId: (newKey as any)?.id, keyName: (newKey as any)?.name },
    });

    // Return the full key ONLY on creation (it won't be shown again)
    return NextResponse.json(
      {
        key: newKey,
        apiKey, // Full key for user to copy
        message: 'API key created successfully. Save it now - you won\'t see it again!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/api-keys:', error);
    Sentry.captureException(error, {
      tags: { operation: 'api_keys_create', critical: true },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/api-keys
 * Revoke an API key (soft delete - sets is_active to false)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
    }

    // Revoke the key (RLS will ensure user owns this key)
    const { data: revokedKey, error: revokeError } = (await supabase
      .from('api_keys')
      .update({ is_active: false } as any)
      .eq('id', keyId)
      .eq('user_id', user.id)
      .select()
      .single()) as any;

    if (revokeError) {
      console.error('Error revoking API key:', revokeError);
      Sentry.captureException(revokeError, {
        tags: { operation: 'api_keys_revoke' },
        extra: { userId: user.id, keyId },
      });
      return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }

    if (!revokedKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Track successful API key revocation
    Sentry.captureMessage('API key revoked', {
      level: 'info',
      tags: { operation: 'api_keys_revoke_success' },
      extra: { userId: user.id, keyId: (revokedKey as any)?.id, keyName: (revokedKey as any)?.name },
    });

    return NextResponse.json({ message: 'API key revoked successfully', key: revokedKey });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/api-keys:', error);
    Sentry.captureException(error, {
      tags: { operation: 'api_keys_revoke', critical: true },
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
