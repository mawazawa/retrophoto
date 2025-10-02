import { createClient } from '@/lib/supabase/server';

export async function trackTTM(
  sessionId: string,
  ttmSeconds: number
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('analytics_events').insert({
    event_type: 'restore_complete',
    session_id: sessionId,
    metadata: {
      ttm_seconds: ttmSeconds,
    },
    created_at: new Date().toISOString(),
  });
}

export async function trackNSM(
  sessionId: string | null,
  nsmSeconds: number
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('analytics_events').insert({
    event_type: 'upload',
    session_id: sessionId,
    metadata: {
      nsm_seconds: nsmSeconds,
    },
    created_at: new Date().toISOString(),
  });
}

// Client-side NSM tracking
export function setupNSMTracking() {
  if (typeof window === 'undefined') return;

  performance.mark('page-load');

  return {
    markPreviewVisible: () => {
      performance.mark('preview-visible');
      const measure = performance.measure(
        'nsm',
        'page-load',
        'preview-visible'
      );

      // Beacon to analytics endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics',
          JSON.stringify({
            event_type: 'upload',
            nsm_seconds: measure.duration / 1000,
          })
        );
      }
    },
  };
}
