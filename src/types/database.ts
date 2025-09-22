export interface Database {
  public: {
    Tables: {
      budget_periods: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          start_date: string
          end_date: string
          total_budget: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          start_date: string
          end_date: string
          total_budget?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          month?: number
          start_date?: string
          end_date?: string
          total_budget?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      budget_categories: {
        Row: {
          id: string
          period_id: string
          category: string
          allocated: number
          spent: number
          color: string | null
          icon: string | null
          is_custom: boolean
        }
        Insert: {
          id?: string
          period_id: string
          category: string
          allocated?: number
          spent?: number
          color?: string | null
          icon?: string | null
          is_custom?: boolean
        }
        Update: {
          id?: string
          period_id?: string
          category?: string
          allocated?: number
          spent?: number
          color?: string | null
          icon?: string | null
          is_custom?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          period_id: string | null
          category: string | null
          amount: number
          description: string | null
          merchant: string | null
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_id?: string | null
          category?: string | null
          amount: number
          description?: string | null
          merchant?: string | null
          transaction_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period_id?: string | null
          category?: string | null
          amount?: number
          description?: string | null
          merchant?: string | null
          transaction_date?: string
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          user_id: string
          tier: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          tier?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          tier?: string
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for our application
export type BudgetPeriod = Database['public']['Tables']['budget_periods']['Row']
export type BudgetCategory = Database['public']['Tables']['budget_categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']

export type InsertBudgetPeriod = Database['public']['Tables']['budget_periods']['Insert']
export type InsertBudgetCategory = Database['public']['Tables']['budget_categories']['Insert']
export type InsertTransaction = Database['public']['Tables']['transactions']['Insert']
export type InsertUserSubscription = Database['public']['Tables']['user_subscriptions']['Insert']

export type UpdateBudgetPeriod = Database['public']['Tables']['budget_periods']['Update']
export type UpdateBudgetCategory = Database['public']['Tables']['budget_categories']['Update']
export type UpdateTransaction = Database['public']['Tables']['transactions']['Update']
export type UpdateUserSubscription = Database['public']['Tables']['user_subscriptions']['Update']