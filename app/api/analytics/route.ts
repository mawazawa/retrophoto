import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit';
import { analyticsEventSchema, parseBody, validationErrorResponse } from '@/lib/validation/schemas';
import { validateCsrf, csrfErrorResponse } from '@/lib/security/csrf';
import { logger } from '@/lib/observability/logger';

export async function POST(request: NextRequest) {
  try {
    // CSRF protection - validate request origin
    if (!validateCsrf(request)) {
      return NextResponse.json(csrfErrorResponse, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = parseBody(analyticsEventSchema, body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error), { status: 400 });
    }

    const { event_type, session_id, nsm_seconds, ttm_seconds, fingerprint } = validation.data;

    // Check rate limit (use session_id or fingerprint as identifier)
    const identifier = fingerprint || session_id || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = checkRateLimit(identifier, rateLimitConfigs.analytics);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(rateLimitedResponse(rateLimitResult), {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const supabase = await createClient();

    await supabase.from('analytics_events').insert({
      event_type,
      session_id: session_id || null,
      ttm_seconds: ttm_seconds || nsm_seconds || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Analytics tracking error', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'analytics',
    });
    return NextResponse.json({ success: false, error_code: 'ANALYTICS_ERROR' }, { status: 500 });
  }
}
