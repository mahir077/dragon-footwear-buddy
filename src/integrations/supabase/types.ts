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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          article_no: string
          id: string
          is_active: boolean | null
          model_id: string | null
          pairs_per_carton: number
          series_group: string | null
        }
        Insert: {
          article_no: string
          id?: string
          is_active?: boolean | null
          model_id?: string | null
          pairs_per_carton?: number
          series_group?: string | null
        }
        Update: {
          article_no?: string
          id?: string
          is_active?: boolean | null
          model_id?: string | null
          pairs_per_carton?: number
          series_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_no: string | null
          bank_name: string
          branch: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
        }
        Insert: {
          account_no?: string | null
          bank_name: string
          branch?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
        }
        Update: {
          account_no?: string | null
          bank_name?: string
          branch?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          is_active: boolean | null
          name_bn: string
          name_en: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name_bn: string
          name_en?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name_bn?: string
          name_en?: string | null
        }
        Relationships: []
      }
      colors: {
        Row: {
          hex_code: string | null
          id: string
          is_active: boolean | null
          name_bn: string
          name_en: string | null
        }
        Insert: {
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_bn: string
          name_en?: string | null
        }
        Update: {
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_bn?: string
          name_en?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          basic_salary: number | null
          id: string
          is_active: boolean | null
          join_date: string | null
          mobile: string | null
          name: string
        }
        Insert: {
          address?: string | null
          basic_salary?: number | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          mobile?: string | null
          name: string
        }
        Update: {
          address?: string | null
          basic_salary?: number | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          mobile?: string | null
          name?: string
        }
        Relationships: []
      }
      expense_heads: {
        Row: {
          id: string
          is_active: boolean | null
          name_bn: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name_bn: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name_bn?: string
        }
        Relationships: []
      }
      financial_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          is_locked: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      income_heads: {
        Row: {
          id: string
          is_active: boolean | null
          name_bn: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name_bn: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name_bn?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          is_active: boolean | null
          name_bn: string
          name_en: string | null
          type: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name_bn: string
          name_en?: string | null
          type?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name_bn?: string
          name_en?: string | null
          type?: string | null
        }
        Relationships: []
      }
      models: {
        Row: {
          brand_id: string | null
          id: string
          is_active: boolean | null
          name_bn: string
          season: string | null
        }
        Insert: {
          brand_id?: string | null
          id?: string
          is_active?: boolean | null
          name_bn: string
          season?: string | null
        }
        Update: {
          brand_id?: string | null
          id?: string
          is_active?: boolean | null
          name_bn?: string
          season?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          address: string | null
          id: string
          is_active: boolean | null
          mobile: string | null
          name: string
          opening_balance: number | null
          type: string | null
        }
        Insert: {
          address?: string | null
          id?: string
          is_active?: boolean | null
          mobile?: string | null
          name: string
          opening_balance?: number | null
          type?: string | null
        }
        Update: {
          address?: string | null
          id?: string
          is_active?: boolean | null
          mobile?: string | null
          name?: string
          opening_balance?: number | null
          type?: string | null
        }
        Relationships: []
      }
      sizes: {
        Row: {
          id: string
          is_active: boolean | null
          size_value: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          size_value: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          size_value?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
