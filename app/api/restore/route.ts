import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import {
  uploadOriginalImage,
  uploadRestoredImage,
} from '@/lib/storage/uploads';
import { restoreImage } from '@/lib/ai/restore';
import { generateOGCard } from '@/lib/share/og-card';
import { generateRevealGIF } from '@/lib/share/gif-generator';
import { generateDeepLink } from '@/lib/share/deep-link';
import { checkQuota, incrementQuota } from '@/lib/quota/tracker';
import { trackTTM } from '@/lib/metrics/analytics';
import { validateImageFile } from '@/lib/utils';
import { logger } from '@/lib/observability/logger';
import { trackTTMAlert, trackRestorationFailure, trackValidationError } from '@/lib/observability/alerts';
import { checkRateLimit, rateLimitConfigs, getRateLimitHeaders, rateLimitedResponse } from '@/lib/rate-limit';
import { validateCsrf, csrfErrorResponse } from '@/lib/security/csrf';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let fingerprint: string | undefined;

  try {
    // CSRF protection - validate request origin
    if (!validateCsrf(request)) {
      return NextResponse.json(csrfErrorResponse, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    fingerprint = formData.get('fingerprint') as string;

    if (!file || !fingerprint) {
      return NextResponse.json(
        {
          error: 'Missing file or fingerprint',
          error_code: 'MISSING_FINGERPRINT',
        },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(fingerprint, rateLimitConfigs.restore);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(rateLimitedResponse(rateLimitResult), {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      trackValidationError(validation.error || 'Invalid file', file.size, file.type);
      return NextResponse.json(
        { error: validation.error, error_code: validation.errorCode || 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Check authentication and credits
    logger.debug('Checking authentication and credits', { fingerprint });
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    let userId: string | null = null;
    let usePaidCredits = false;

    if (user) {
      // Authenticated user - check credit balance
      userId = user.id;
      const { data: userCredits, error: creditsError } = await supabaseAuth
        .from('user_credits')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (!creditsError && userCredits && userCredits.credits_balance > 0) {
        usePaidCredits = true;
        logger.debug('User has credits', { userId, credits: userCredits.credits_balance });
      } else {
        logger.debug('User has no credits, checking free quota', { userId });
      }
    }

    // If no paid credits, check free quota
    if (!usePaidCredits) {
      logger.debug('Checking free quota', { fingerprint });
      const hasQuota = await checkQuota(fingerprint);
      logger.debug('Quota check result', { fingerprint, allowed: hasQuota });
      if (!hasQuota) {
        return NextResponse.json(
          {
            error:
              'Free restore limit reached. Purchase credits for unlimited restorations.',
            error_code: 'QUOTA_EXCEEDED',
            upgrade_url: '/pricing',
          },
          { status: 429 }
        );
      }
    }

    // Upload original
    logger.uploadStart(fingerprint, file.size, file.type);
    const originalUrl = await uploadOriginalImage(file, fingerprint);
    logger.debug('Original uploaded', { fingerprint, originalUrl });

    // Deduct credit if using paid credits (before processing)
    if (usePaidCredits && userId) {
      logger.debug('Deducting credit', { userId });

      // Use cached service role client for RPC call (avoids dynamic import overhead)
      const supabaseService = getServiceRoleClient();

      const { data: deductResult, error: deductError } = await supabaseService
        .rpc('deduct_credit', { p_user_id: userId });

      if (deductError) {
        logger.error('Credit deduction failed', { userId, error: deductError.message });
        return NextResponse.json(
          {
            error: 'Failed to deduct credit. Please try again.',
            error_code: 'CREDIT_DEDUCTION_FAILED',
          },
          { status: 500 }
        );
      }

      logger.debug('Credit deducted', { userId, result: deductResult });
    }

    // Create session
    logger.debug('Creating session', { fingerprint });
    const supabase = await createClient();
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .insert({
        user_fingerprint: fingerprint,
        user_id: userId, // Track user_id if authenticated
        original_url: originalUrl,
        status: 'processing',
        retry_count: 0, // Explicitly set to 0 for clarity
      })
      .select()
      .single();

    if (sessionError) {
      logger.error('Session creation failed', { fingerprint, error: sessionError.message });
      throw sessionError;
    }
    logger.debug('Session created', { sessionId: session.id });

    // Process with AI
    logger.restorationStart(session.id);
    const restoredUrl = await restoreImage(originalUrl);
    logger.debug('AI restoration complete', { sessionId: session.id });

    // Download and validate resolution (T050a)
    const restoredResponse = await fetch(restoredUrl);
    if (!restoredResponse.ok) {
      throw new Error(`Failed to fetch restored image: ${restoredResponse.status}`);
    }
    const restoredBuffer = await restoredResponse.arrayBuffer();
    const metadata = await sharp(Buffer.from(restoredBuffer)).metadata();

    // Safely check dimensions with fallback
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (Math.max(width, height) < 2048) {
      logger.warn('Restored image below 2048px', {
        sessionId: session.id,
        width,
        height,
      });
    }

    // Upload restored image to our storage
    const finalRestoredUrl = await uploadRestoredImage(
      Buffer.from(restoredBuffer),
      session.id
    );

    // Generate share artifacts in parallel for better performance
    const deepLink = generateDeepLink(session.id);

    const [ogCardUrl, gifUrl] = await Promise.all([
      // Generate and upload OG card
      (async () => {
        try {
          const ogCardResponse = await generateOGCard(originalUrl, finalRestoredUrl);
          const ogCardBuffer = Buffer.from(await ogCardResponse.arrayBuffer());
          return await uploadRestoredImage(ogCardBuffer, `${session.id}-og`);
        } catch (error) {
          logger.warn('OG card generation failed', {
            sessionId: session.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return ''; // Continue even if OG card fails
        }
      })(),
      // Generate and upload GIF
      (async () => {
        try {
          const gifBuffer = await generateRevealGIF(originalUrl, finalRestoredUrl);
          return await uploadRestoredImage(gifBuffer, `${session.id}-gif`);
        } catch (error) {
          logger.warn('GIF generation failed', {
            sessionId: session.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return ''; // Continue even if GIF fails
        }
      })(),
    ]);

    // Batch database operations in parallel for better performance
    await Promise.all([
      // Create restoration result
      supabase.from('restoration_results').insert({
        session_id: session.id,
        restored_url: finalRestoredUrl,
        og_card_url: ogCardUrl,
        gif_url: gifUrl,
        deep_link: deepLink,
        watermark_applied: true,
      }),
      // Update session status
      supabase
        .from('upload_sessions')
        .update({ status: 'complete' })
        .eq('id', session.id),
      // Increment quota only if using free tier
      ...(usePaidCredits ? [] : [incrementQuota(fingerprint)]),
    ]);

    // Track TTM
    const ttmSeconds = (Date.now() - startTime) / 1000;
    await trackTTM(session.id, ttmSeconds);

    // Alert if TTM threshold exceeded
    trackTTMAlert({
      sessionId: session.id,
      ttmSeconds,
      p50Threshold: 6,
      p95Threshold: 12,
    });

    logger.restorationComplete(session.id, Date.now() - startTime, ttmSeconds);

    return NextResponse.json({
      session_id: session.id,
      restored_url: finalRestoredUrl,
      og_card_url: ogCardUrl,
      gif_url: gifUrl,
      deep_link: deepLink,
      ttm_seconds: ttmSeconds,
    });
  } catch (error) {
    // Extract error details for structured logging
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));

    logger.error('Restoration failed', {
      fingerprint,
      operation: 'restoration',
      error: err.message,
      errorType: error?.constructor?.name,
      stack: err.stack,
    });

    // Handle retry logic if session was created
    try {
      if (!fingerprint) {
        // fingerprint not available (early failure), just track error
        trackRestorationFailure('unknown', err, 0);
      } else {
        const supabase = await createClient();
        
        // Get current session if it exists
        const { data: existingSession } = await supabase
          .from('upload_sessions')
          .select('id, retry_count')
          .eq('user_fingerprint', fingerprint)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingSession) {
          const currentRetryCount = existingSession.retry_count || 0;
          
          // Check if we can retry (max 1 retry per constitutional SLO)
          if (currentRetryCount < 1) {
            // First failure - set to pending for retry
            const newRetryCount = Math.min(currentRetryCount + 1, 1);
            await supabase
              .from('upload_sessions')
              .update({
                status: 'pending',
                retry_count: newRetryCount,
              })
              .eq('id', existingSession.id);

            logger.error('Restoration failed, will retry', {
              sessionId: existingSession.id,
              retryCount: newRetryCount,
            });

            // Track restoration failure with retry info
            trackRestorationFailure(existingSession.id, err, newRetryCount);
          } else {
            // Already retried - mark as failed
            await supabase
              .from('upload_sessions')
              .update({
                status: 'failed',
                retry_count: Math.min(currentRetryCount, 1), // Cap at 1
              })
              .eq('id', existingSession.id);

            logger.error('Restoration failed after retry', {
              sessionId: existingSession.id,
              retryCount: currentRetryCount,
            });

            // Track final restoration failure
            trackRestorationFailure(existingSession.id, err, currentRetryCount);
          }
        } else {
          // No session found (early failure) - just track
          trackRestorationFailure('unknown', err, 0);
        }
      }
    } catch (updateError) {
      // If retry logic fails, just log it
      logger.error('Failed to update session retry status', {
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
    }

    return NextResponse.json(
      {
        error: 'Restoration failed. Please try again or contact support.',
        error_code: 'AI_MODEL_ERROR',
      },
      { status: 500 }
    );
  }
}
