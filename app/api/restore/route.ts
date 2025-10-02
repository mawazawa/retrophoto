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
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fingerprint = formData.get('fingerprint') as string;

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
      return NextResponse.json(
        { error: validation.error, error_code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Check quota
    const hasQuota = await checkQuota(fingerprint);
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
    const originalUrl = await uploadOriginalImage(file, fingerprint);

    // Create session
    const supabase = await createClient();
    const { data: session, error: sessionError } = await supabase
      .from('upload_sessions')
      .insert({
        user_fingerprint: fingerprint,
        original_url: originalUrl,
        status: 'processing',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Process with AI
    const restoredUrl = await restoreImage(originalUrl);

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

    return NextResponse.json({
      session_id: session.id,
      restored_url: finalRestoredUrl,
      og_card_url: ogCardUrl,
      gif_url: gifUrl,
      deep_link: deepLink,
      ttm_seconds: ttmSeconds,
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      {
        error: 'Restoration failed. Please try again or contact support.',
        error_code: 'AI_MODEL_ERROR',
      },
      { status: 500 }
    );
  }
}
