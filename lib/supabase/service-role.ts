/**
 * Supabase Service Role Client
 *
 * Cached singleton client for server-side operations that require
 * elevated permissions (bypassing RLS).
 *
 * Use this for:
 * - Credit deduction (deduct_credit RPC)
 * - Admin operations
 * - Operations that need to bypass RLS
 *
 * Note: This client bypasses Row Level Security - use with caution!
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Cached client instance
let serviceRoleClient: SupabaseClient<Database> | null = null

/**
 * Get the cached service role client
 *
 * This creates a singleton client that persists across requests,
 * which is more efficient than creating a new client on each request.
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  serviceRoleClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Enable connection pooling hints
    db: {
      schema: 'public',
    },
  })

  return serviceRoleClient
}

/**
 * Reset the cached client (useful for testing)
 */
export function resetServiceRoleClient(): void {
  serviceRoleClient = null
}
