import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/observability/logger';

export async function trackTTM(
  sessionId: string,
  ttmSeconds: number
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('analytics_events').insert({
      event_type: 'restore_complete',
      session_id: sessionId,
      ttm_seconds: ttmSeconds,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to track TTM event', {
        sessionId,
        error: error.message,
        operation: 'analytics',
      });
    }
  } catch (err) {
    // Don't throw - analytics should never break the main flow
    logger.error('TTM tracking exception', {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
      operation: 'analytics',
    });
  }
}

export async function trackNSM(
  sessionId: string | null,
  nsmSeconds: number
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('analytics_events').insert({
      event_type: 'upload_start',
      session_id: sessionId,
      ttm_seconds: nsmSeconds,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to track NSM event', {
        sessionId: sessionId ?? undefined,
        error: error.message,
        operation: 'analytics',
      });
    }
  } catch (err) {
    // Don't throw - analytics should never break the main flow
    logger.error('NSM tracking exception', {
      sessionId: sessionId ?? undefined,
      error: err instanceof Error ? err.message : String(err),
      operation: 'analytics',
    });
  }
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
