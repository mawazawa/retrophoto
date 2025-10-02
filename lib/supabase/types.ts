// This file will be auto-generated after database migrations
// Placeholder for now
export type Database = {
  public: {
    Tables: {
      user_quota: {
        Row: {
          id: string;
          fingerprint: string;
          restore_count: number;
          last_restore_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fingerprint: string;
          restore_count?: number;
          last_restore_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fingerprint?: string;
          restore_count?: number;
          last_restore_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      upload_sessions: {
        Row: {
          id: string;
          fingerprint: string;
          original_url: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          fingerprint: string;
          original_url: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          fingerprint?: string;
          original_url?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          expires_at?: string;
        };
      };
      restoration_results: {
        Row: {
          id: string;
          session_id: string;
          restored_url: string;
          og_card_url: string | null;
          gif_url: string | null;
          deep_link: string | null;
          watermark_applied: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          restored_url: string;
          og_card_url?: string | null;
          gif_url?: string | null;
          deep_link?: string | null;
          watermark_applied?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          restored_url?: string;
          og_card_url?: string | null;
          gif_url?: string | null;
          deep_link?: string | null;
          watermark_applied?: boolean;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          session_id: string;
          event_type: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_type: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_type?: 'upload' | 'restore_start' | 'restore_complete' | 'share' | 'upgrade_shown';
          metadata?: Record<string, unknown> | null;
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
