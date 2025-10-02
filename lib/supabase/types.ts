/**
 * Supabase Database Types
 *
 * These types match the schema defined in supabase/migrations/
 * After database deployment, regenerate with:
 * npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_quota: {
        Row: {
          fingerprint: string
          restore_count: number
          last_restore_at: string | null
          created_at: string
        }
        Insert: {
          fingerprint: string
          restore_count?: number
          last_restore_at?: string | null
          created_at?: string
        }
        Update: {
          fingerprint?: string
          restore_count?: number
          last_restore_at?: string | null
          created_at?: string
        }
      }
      upload_sessions: {
        Row: {
          id: string
          user_fingerprint: string
          original_url: string
          status: 'pending' | 'processing' | 'complete' | 'failed'
          created_at: string
          ttl_expires_at: string
          retry_count: number
        }
        Insert: {
          id?: string
          user_fingerprint: string
          original_url: string
          status?: 'pending' | 'processing' | 'complete' | 'failed'
          created_at?: string
          ttl_expires_at?: string
          retry_count?: number
        }
        Update: {
          id?: string
          user_fingerprint?: string
          original_url?: string
          status?: 'pending' | 'processing' | 'complete' | 'failed'
          created_at?: string
          ttl_expires_at?: string
          retry_count?: number
        }
      }
      restoration_results: {
        Row: {
          id: string
          session_id: string
          restored_url: string
          og_card_url: string
          gif_url: string
          deep_link: string
          watermark_applied: boolean
          created_at: string
          cdn_cached: boolean
        }
        Insert: {
          id?: string
          session_id: string
          restored_url: string
          og_card_url: string
          gif_url: string
          deep_link: string
          watermark_applied?: boolean
          created_at?: string
          cdn_cached?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          restored_url?: string
          og_card_url?: string
          gif_url?: string
          deep_link?: string
          watermark_applied?: boolean
          created_at?: string
          cdn_cached?: boolean
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: 'upload_start' | 'restore_complete' | 'share_click' | 'upgrade_view'
          session_id: string | null
          ttm_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'upload_start' | 'restore_complete' | 'share_click' | 'upgrade_view'
          session_id?: string | null
          ttm_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: 'upload_start' | 'restore_complete' | 'share_click' | 'upgrade_view'
          session_id?: string | null
          ttm_seconds?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_quota: {
        Args: {
          user_fingerprint: string
        }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {
      session_status: 'pending' | 'processing' | 'complete' | 'failed'
      event_type: 'upload_start' | 'restore_complete' | 'share_click' | 'upgrade_view'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
