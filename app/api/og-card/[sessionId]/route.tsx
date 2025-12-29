import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOGCard } from '@/lib/share/og-card';
import { logger } from '@/lib/observability/logger';
import { isValidUUID } from '@/lib/validation/uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Validate session ID format before querying database
    if (!isValidUUID(sessionId)) {
      return new Response('Invalid session ID', { status: 400 });
    }

    const supabase = await createClient();

    const { data: session } = await supabase
      .from('upload_sessions')
      .select('original_url')
      .eq('id', sessionId)
      .single();

    const { data: result } = await supabase
      .from('restoration_results')
      .select('restored_url')
      .eq('session_id', sessionId)
      .single();

    if (!session || !result) {
      return new Response('Not found', { status: 404 });
    }

    // Generate OG card and add caching headers
    const ogResponse = await generateOGCard(session.original_url, result.restored_url);

    // Add cache headers for CDN and browser caching
    // Cache for 1 hour with stale-while-revalidate of 24 hours
    const headers = new Headers(ogResponse.headers);
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

    return new Response(ogResponse.body, {
      status: ogResponse.status,
      headers,
    });
  } catch (error) {
    logger.error('OG card generation error', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'og_card_generation',
    });
    return new Response('Error generating OG card', { status: 500 });
  }
}
