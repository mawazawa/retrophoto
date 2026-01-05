import { createClient } from '@/lib/supabase/server';

/**
 * Server-side quota tracking utilities
 *
 * Note: Do NOT import generateFingerprint from this file.
 * Use '@/lib/quota/client-tracker' for client-side fingerprint generation.
 * Fingerprints should always be generated on the client and passed to the server.
 */

export async function checkQuota(fingerprint: string): Promise<boolean> {
  const supabase = await createClient();

  // Use the check_quota database function for server-side enforcement
  const { data, error } = await supabase.rpc('check_quota', {
    user_fingerprint: fingerprint,
  });

  if (error) throw error;

  // Function returns array with one result
  const result = data?.[0];

  // Fail closed: deny access if no quota data returned (security)
  // This prevents bypassing quota limits when DB fails or returns unexpected data
  if (!result) {
    throw new Error('Quota data not available - denying access for security');
  }

  return result.remaining > 0;
}

export async function incrementQuota(fingerprint: string): Promise<void> {
  const supabase = await createClient();

  // Get existing quota or create new one, then increment
  const { data: existing, error: fetchError } = await supabase
    .from('user_quota')
    .select('fingerprint, restore_count')
    .eq('fingerprint', fingerprint)
    .single();

  // PGRST116 = "no rows returned" which is expected for new users
  // Any other error is a real database error that should be thrown
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('user_quota')
      .update({
        restore_count: existing.restore_count + 1,
        last_restore_at: new Date().toISOString(),
      })
      .eq('fingerprint', fingerprint);

    if (error) throw error;
  } else {
    // Create new record
    const { error } = await supabase.from('user_quota').insert({
      fingerprint,
      restore_count: 1,
      last_restore_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
}
