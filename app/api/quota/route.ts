// @ts-nocheck - Type errors expected until database is deployed
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fingerprint = searchParams.get('fingerprint');

  if (!fingerprint) {
    return NextResponse.json(
      {
        error: 'Invalid or missing fingerprint parameter.',
        error_code: 'INVALID_FINGERPRINT',
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_quota')
      .select('restore_count, last_restore_at')
      .eq('fingerprint', fingerprint)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found is ok
      throw error;
    }

    const restoreCount = data?.restore_count || 0;
    const remaining = Math.max(0, 1 - restoreCount);
    const requiresUpgrade = remaining === 0;

    return NextResponse.json({
      remaining,
      limit: 1,
      requires_upgrade: requiresUpgrade,
      ...(requiresUpgrade && { upgrade_url: '/upgrade' }),
      last_restore_at: data?.last_restore_at || null,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve quota status. Please try again.',
        error_code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}
