import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, session_id, nsm_seconds } = body;

    const supabase = await createClient();

    await supabase.from('analytics_events').insert({
      event_type,
      session_id: session_id || null,
      metadata: {
        ...(nsm_seconds && { nsm_seconds }),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
