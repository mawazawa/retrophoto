export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          session_id: string | null
          ttm_seconds: number | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          session_id?: string | null
          ttm_seconds?: number | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          session_id?: string | null
          ttm_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_batches: {
        Row: {
          created_at: string | null
          credits_purchased: number
          credits_remaining: number
          expiration_date: string
          id: string
          purchase_date: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_purchased: number
          credits_remaining: number
          expiration_date: string
          id?: string
          purchase_date?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_purchased?: number
          credits_remaining?: number
          expiration_date?: string
          id?: string
          purchase_date?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_credit_batches_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_refunds: {
        Row: {
          amount_refunded: number
          created_at: string | null
          credits_deducted: number
          currency: string
          id: string
          metadata: Json | null
          reason: string | null
          refund_date: string | null
          stripe_refund_id: string
          transaction_id: string
        }
        Insert: {
          amount_refunded: number
          created_at?: string | null
          credits_deducted: number
          currency: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          refund_date?: string | null
          stripe_refund_id: string
          transaction_id: string
        }
        Update: {
          amount_refunded?: number
          created_at?: string | null
          credits_deducted?: number
          currency?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          refund_date?: string | null
          stripe_refund_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          credits_purchased: number
          currency: string
          id: string
          metadata: Json | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits_purchased: number
          currency?: string
          id?: string
          metadata?: Json | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits_purchased?: number
          currency?: string
          id?: string
          metadata?: Json | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      restoration_results: {
        Row: {
          cdn_cached: boolean
          created_at: string
          deep_link: string
          gif_url: string
          id: string
          og_card_url: string
          restored_url: string
          session_id: string
          watermark_applied: boolean
        }
        Insert: {
          cdn_cached?: boolean
          created_at?: string
          deep_link: string
          gif_url: string
          id?: string
          og_card_url: string
          restored_url: string
          session_id: string
          watermark_applied?: boolean
        }
        Update: {
          cdn_cached?: boolean
          created_at?: string
          deep_link?: string
          gif_url?: string
          id?: string
          og_card_url?: string
          restored_url?: string
          session_id?: string
          watermark_applied?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "restoration_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          retry_count: number
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status: string
          retry_count?: number
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          retry_count?: number
        }
        Relationships: []
      }
      upload_sessions: {
        Row: {
          created_at: string
          id: string
          original_url: string
          retry_count: number
          status: Database["public"]["Enums"]["session_status"]
          ttl_expires_at: string
          user_fingerprint: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_url: string
          retry_count?: number
          status?: Database["public"]["Enums"]["session_status"]
          ttl_expires_at?: string
          user_fingerprint: string
        }
        Update: {
          created_at?: string
          id?: string
          original_url?: string
          retry_count?: number
          status?: Database["public"]["Enums"]["session_status"]
          ttl_expires_at?: string
          user_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_user_fingerprint_fkey"
            columns: ["user_fingerprint"]
            isOneToOne: false
            referencedRelation: "user_quota"
            referencedColumns: ["fingerprint"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string
          available_credits: number
          credits_expired: number
          credits_purchased: number
          credits_used: number
          fingerprint: string
          id: string
          last_purchase_at: string | null
          stripe_customer_id: string | null
          total_credits_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          available_credits?: number
          credits_expired?: number
          credits_purchased?: number
          credits_used?: number
          fingerprint: string
          id?: string
          last_purchase_at?: string | null
          stripe_customer_id?: string | null
          total_credits_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          available_credits?: number
          credits_expired?: number
          credits_purchased?: number
          credits_used?: number
          fingerprint?: string
          id?: string
          last_purchase_at?: string | null
          stripe_customer_id?: string | null
          total_credits_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quota: {
        Row: {
          created_at: string
          fingerprint: string
          last_restore_at: string | null
          restore_count: number
        }
        Insert: {
          created_at?: string
          fingerprint: string
          last_restore_at?: string | null
          restore_count?: number
        }
        Update: {
          created_at?: string
          fingerprint?: string
          last_restore_at?: string | null
          restore_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args:
          | {
              p_credits_to_add: number
              p_fingerprint: string
              p_stripe_customer_id?: string
              p_user_id: string
            }
          | {
              p_credits_to_add: number
              p_transaction_id: string
              p_user_id: string
            }
        Returns: Json
      }
      check_quota: {
        Args: { user_fingerprint: string }
        Returns: {
          last_restore_at: string
          limit_value: number
          remaining: number
          requires_upgrade: boolean
          upgrade_url: string
        }[]
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          cleanup_timestamp: string
          deleted_count: number
        }[]
      }
      consume_credit: {
        Args: { p_fingerprint: string; p_user_id: string }
        Returns: {
          remaining_balance: number
          success: boolean
        }[]
      }
      deduct_credit: {
        Args: { p_user_id: string }
        Returns: Json
      }
      expire_credits: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_credit_balance: {
        Args: { p_fingerprint: string; p_user_id: string }
        Returns: number
      }
      process_refund: {
        Args: {
          p_amount_refunded: number
          p_currency: string
          p_stripe_refund_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      event_type:
        | "upload_start"
        | "restore_complete"
        | "share_click"
        | "upgrade_view"
      session_status: "pending" | "processing" | "complete" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: [
        "upload_start",
        "restore_complete",
        "share_click",
        "upgrade_view",
      ],
      session_status: ["pending", "processing", "complete", "failed"],
    },
  },
} as const