// @ts-nocheck - Type errors expected until database is deployed
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let fingerprint: string | undefined;

  try {
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

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      trackValidationError(validation.error || 'Invalid file', file.size, file.type);
      return NextResponse.json(
        { error: validation.error, error_code: validation.errorCode || 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Check quota
    console.log('[RESTORE] Step 1: Checking quota for', fingerprint);
    const hasQuota = await checkQuota(fingerprint);
    console.log('[RESTORE] Quota check result:', hasQuota);
    if (!hasQuota) {
      return NextResponse.json(
        {
          error:
            'Free restore limit reached. Upgrade for unlimited restorations.',
          error_code: 'QUOTA_EXCEEDED',
          upgrade_url: '/upgrade',
        },
        { status: 429 }
      );
    }

    // Upload original
    console.log('[RESTORE] Step 2: Uploading original image');
    logger.uploadStart(fingerprint, file.size, file.type);
    const originalUrl = await uploadOriginalImage(file, fingerprint);
    console.log('[RESTORE] Original uploaded to:', originalUrl);

    // Create session
    console.log('[RESTORE] Step 3: Creating session');
    const supabase = await createClient();
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .insert({
        user_fingerprint: fingerprint,
        original_url: originalUrl,
        status: 'processing',
        retry_count: 0, // Explicitly set to 0 for clarity
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[RESTORE] Session creation error:', sessionError);
      throw sessionError;
    }
    console.log('[RESTORE] Session created:', session.id);

    // Process with AI
    console.log('[RESTORE] Step 4: Starting AI restoration');
    logger.restorationStart(session.id);
    const restoredUrl = await restoreImage(originalUrl);
    console.log('[RESTORE] AI restoration complete:', restoredUrl);

    // Download and validate resolution (T050a)
    const restoredBuffer = await fetch(restoredUrl).then((r) =>
      r.arrayBuffer()
    );
    const metadata = await sharp(Buffer.from(restoredBuffer)).metadata();

    if (Math.max(metadata.width!, metadata.height!) < 2048) {
      console.warn(
        `Restored image below 2048px: ${metadata.width}x${metadata.height}`
      );
    }

    // Upload restored image to our storage
    const finalRestoredUrl = await uploadRestoredImage(
      Buffer.from(restoredBuffer),
      session.id
    );

    // Generate share artifacts
    const ogCardResponse = await generateOGCard(originalUrl, finalRestoredUrl);
    const ogCardBuffer = Buffer.from(await ogCardResponse.arrayBuffer());
    const ogCardUrl = await uploadRestoredImage(
      ogCardBuffer,
      `${session.id}-og`
    );

    const gifBuffer = await generateRevealGIF(originalUrl, finalRestoredUrl);
    const gifUrl = await uploadRestoredImage(gifBuffer, `${session.id}-gif`);

    // Generate deep link (uses NEXT_PUBLIC_BASE_URL or fallback to retrophotoai.com)
    const deepLink = generateDeepLink(session.id);

    // Create restoration result
    await supabase.from('restoration_results').insert({
      session_id: session.id,
      restored_url: finalRestoredUrl,
      og_card_url: ogCardUrl,
      gif_url: gifUrl,
      deep_link: deepLink,
      watermark_applied: true,
    });

    // Update session status
    await supabase
      .from('upload_sessions')
      .update({ status: 'complete' })
      .eq('id', session.id);

    // Increment quota
    await incrementQuota(fingerprint);

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
    // Comprehensive error logging
    console.error('RESTORE API ERROR - Raw:', error);
    console.error('RESTORE API ERROR - Type:', typeof error);
    console.error('RESTORE API ERROR - Constructor:', error?.constructor?.name);
    
    // Try to extract meaningful error information
    let errorDetails: any = {};
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = {
        ...error,
        stringified: JSON.stringify(error, null, 2),
      };
    } else {
      errorDetails = {
        value: String(error),
      };
    }
    
    console.error('RESTORE API ERROR - Parsed:', JSON.stringify(errorDetails, null, 2));
    
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    
    logger.error('Restoration failed', {
      error: err.message,
      operation: 'restoration',
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
