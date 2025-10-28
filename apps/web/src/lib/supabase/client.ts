/**
 * Supabase Browser Client
 * Phase 2: Foundational (T020)
 * Creates a Supabase client for use in Client Components and browser environments
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Create a Supabase client for browser/client-side usage
 * This should be used in Client Components (with "use client" directive)
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
