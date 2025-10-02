// This file will be auto-generated after database migrations
// Placeholder for now
export type Database = {
  public: {
    Tables: {
      user_quota: {
        Row: {
          fingerprint: string;
          restore_count: number;
          last_restore_at: string | null;
          created_at: string;
        };
        Insert: {
          fingerprint: string;
          restore_count?: number;
          last_restore_at?: string | null;
          created_at?: string;
        };
        Update: {
          fingerprint?: string;
          restore_count?: number;
          last_restore_at?: string | null;
          created_at?: string;
        };
      };
      upload_sessions: {
        Row: {
          id: string;
          user_fingerprint: string;
          original_url: string;
          status: 'pending' | 'processing' | 'complete' | 'failed';
          created_at: string;
          ttl_expires_at: string;
          retry_count: number;
        };
        Insert: {
          id?: string;
          user_fingerprint: string;
          original_url: string;
          status?: 'pending' | 'processing' | 'complete' | 'failed';
          created_at?: string;
          ttl_expires_at?: string;
          retry_count?: number;
        };
        Update: {
          id?: string;
          user_fingerprint?: string;
          original_url?: string;
          status?: 'pending' | 'processing' | 'complete' | 'failed';
          created_at?: string;
          ttl_expires_at?: string;
          retry_count?: number;
        };
      };
      restoration_results: {
        Row: {
          id: string;
          session_id: string;
          restored_url: string;
          og_card_url: string;
          gif_url: string;
          deep_link: string;
          watermark_applied: boolean;
          created_at: string;
          cdn_cached: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          restored_url: string;
          og_card_url: string;
          gif_url: string;
          deep_link: string;
          watermark_applied?: boolean;
          created_at?: string;
          cdn_cached?: boolean;
        };
        Update: {
          id?: string;
          session_id?: string;
          restored_url?: string;
          og_card_url?: string;
          gif_url?: string;
          deep_link?: string;
          watermark_applied?: boolean;
          created_at?: string;
          cdn_cached?: boolean;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          session_id: string | null;
          event_type: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          ttm_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          event_type: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          ttm_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          event_type?: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          ttm_seconds?: number | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_quota: {
        Args: { fingerprint: string };
        Returns: { remaining: number };
      };
    };
    Enums: {
      session_status: 'pending' | 'processing' | 'completed' | 'failed';
      event_type: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
    };
  };
};
