// @ts-nocheck - Type errors expected until database is deployed
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOGCard } from '@/lib/share/og-card';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
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

    return generateOGCard(session.original_url, result.restored_url);
  } catch (error) {
    console.error('OG card generation error:', error);
    return new Response('Error generating OG card', { status: 500 });
  }
}
