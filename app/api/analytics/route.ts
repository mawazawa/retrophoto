import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit';
import { analyticsEventSchema, parseBody, validationErrorResponse } from '@/lib/validation/schemas';
import { validateCsrf, csrfErrorResponse } from '@/lib/security/csrf';
import { logger } from '@/lib/observability/logger';
import { Database } from '@/lib/supabase/types';
import { withErrorBoundary } from '@/lib/api/error-boundary';
import { forbidden } from '@/lib/api/errors';

// Extended event types that include database enum + additional types
type ExtendedEventType = Database["public"]["Enums"]["event_type"] | string;

export const POST = withErrorBoundary(async (request: NextRequest) => {
  // CSRF protection - validate request origin
  if (!validateCsrf(request)) {
    throw forbidden('CSRF validation failed', 'CSRF_VALIDATION_FAILED');
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
  const rateLimitResult = await checkRateLimit(identifier, rateLimitConfigs.analytics);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(rateLimitedResponse(rateLimitResult), {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  }

  const supabase = await createClient();

  // event_type can be extended beyond database enum (e.g., web_vital)
  // Use unknown as intermediate type to allow extended event types while maintaining type safety
  await supabase.from('analytics_events').insert({
    event_type: event_type as unknown as Database["public"]["Enums"]["event_type"],
    session_id: session_id || null,
    ttm_seconds: ttm_seconds || nsm_seconds || null,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
});
