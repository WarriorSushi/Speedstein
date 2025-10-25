// Supabase Database Types
// These will be auto-generated from migrations later

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          prefix: string
          last4: string
          name: string
          revoked: boolean
          created_at: string
          last_used_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['api_keys']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: 'free' | 'starter' | 'pro' | 'enterprise'
          status: 'active' | 'past_due' | 'canceled'
          dodo_customer_id: string | null
          dodo_subscription_id: string | null
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      usage_quotas: {
        Row: {
          id: string
          user_id: string
          plan_quota: number
          current_usage: number
          period_start: string
          period_end: string
        }
        Insert: Omit<Database['public']['Tables']['usage_quotas']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['usage_quotas']['Insert']>
      }
      usage_records: {
        Row: {
          id: string
          user_id: string
          api_key_id: string
          pdf_url: string
          generation_time_ms: number
          html_hash: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['usage_records']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['usage_records']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          billing_period_start: string
          billing_period_end: string
          payment_status: 'pending' | 'paid' | 'failed'
          dodo_transaction_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
