// @ts-nocheck - Type errors expected until database is deployed
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { createClient } from '@/lib/supabase/server';

export async function generateFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}

export async function checkQuota(fingerprint: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_quota')
    .select('restore_count')
    .eq('fingerprint', fingerprint)
    .single();

  if (error) {
    // If no quota record exists, user has 1 free restore
    if (error.code === 'PGRST116') {
      return true;
    }
    throw error;
  }

  // User has quota if they haven't used their free restore yet
  return (data?.restore_count || 0) < 1;
}

export async function incrementQuota(fingerprint: string): Promise<void> {
  const supabase = await createClient();

  // Try to get existing quota record
  const { data: existing } = await supabase
    .from('user_quota')
    .select('fingerprint, restore_count')
    .eq('fingerprint', fingerprint)
    .single();

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
