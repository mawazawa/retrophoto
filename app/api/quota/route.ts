import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/observability/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fingerprint = searchParams.get('fingerprint');

  if (!fingerprint) {
    return NextResponse.json(
      {
        error: 'Missing fingerprint parameter.',
        error_code: 'MISSING_FINGERPRINT',
      },
      { status: 400 }
    );
  }

  // Validate fingerprint format (minimum 20 characters for browser fingerprints)
  if (fingerprint.length < 20) {
    return NextResponse.json(
      {
        error: 'Invalid fingerprint format.',
        error_code: 'INVALID_FINGERPRINT',
      },
      { status: 400 }
    );
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(fingerprint, rateLimitConfigs.quota);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitedResponse(rateLimitResult), {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    });
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
    logger.error('Quota check failed', {
      fingerprint,
      error: error instanceof Error ? error.message : String(error),
      operation: 'quota_check',
    });
    return NextResponse.json(
      {
        error: 'Failed to retrieve quota status. Please try again.',
        error_code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}
