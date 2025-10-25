import { createClient } from '@supabase/supabase-js'
import type { Database } from '@speedstein/database'

/**
 * Create a Supabase client for client-side usage (browser/Next.js)
 * Uses anon key and respects RLS policies
 */
export function createBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Create a Supabase client for server-side usage (API routes/middleware)
 * Uses anon key but with request context for auth
 */
export function createServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Create a Supabase admin client (bypasses RLS)
 * Should only be used for trusted backend operations
 */
export function createAdminClient(
  supabaseUrl: string,
  serviceRoleKey: string
) {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
