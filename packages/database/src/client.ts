import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Create a Supabase client with the provided URL and key
 */
export function createDatabaseClient(
  supabaseUrl: string,
  supabaseKey: string
) {
  return createClient<Database>(supabaseUrl, supabaseKey)
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 */
export function createServiceClient(
  supabaseUrl: string,
  serviceRoleKey: string
) {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
