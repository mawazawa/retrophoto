import { NextRequest, NextResponse } from 'next/server';
import { getQuotaDetails } from '@/lib/dal';
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit';
import { withErrorBoundary } from '@/lib/api/error-boundary';
import { badRequest } from '@/lib/api/errors';

export const GET = withErrorBoundary(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const fingerprint = searchParams.get('fingerprint');

  if (!fingerprint) {
    throw badRequest('Missing fingerprint parameter.', 'MISSING_FINGERPRINT');
  }

  // Validate fingerprint format (minimum 20 characters for browser fingerprints)
  if (fingerprint.length < 20) {
    throw badRequest('Invalid fingerprint format.', 'INVALID_FINGERPRINT');
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(fingerprint, rateLimitConfigs.quota);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitedResponse(rateLimitResult), {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  }

  // Get quota details via DAL
  const quotaInfo = await getQuotaDetails(fingerprint);

  return NextResponse.json({
    remaining: quotaInfo.remaining,
    limit: quotaInfo.limit_value,
    requires_upgrade: quotaInfo.requires_upgrade,
    ...(quotaInfo.requires_upgrade && { upgrade_url: quotaInfo.upgrade_url }),
    last_restore_at: quotaInfo.last_restore_at,
  });
});
