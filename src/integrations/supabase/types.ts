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
      assets: {
        Row: {
          code: string | null
          depreciation_pct: number | null
          id: string
          location: string | null
          name_bn: string
          note: string | null
          original_price: number | null
          purchase_date: string | null
          status: string | null
          type: string | null
          yearly_maintenance: number | null
        }
        Insert: {
          code?: string | null
          depreciation_pct?: number | null
          id?: string
          location?: string | null
          name_bn: string
          note?: string | null
          original_price?: number | null
          purchase_date?: string | null
          status?: string | null
          type?: string | null
          yearly_maintenance?: number | null
        }
        Update: {
          code?: string | null
          depreciation_pct?: number | null
          id?: string
          location?: string | null
          name_bn?: string
          note?: string | null
          original_price?: number | null
          purchase_date?: string | null
          status?: string | null
          type?: string | null
          yearly_maintenance?: number | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          date: string
          employee_id: string | null
          id: string
          late_minutes: number | null
          note: string | null
          overtime_hours: number | null
          status: string | null
        }
        Insert: {
          date: string
          employee_id?: string | null
          id?: string
          late_minutes?: number | null
          note?: string | null
          overtime_hours?: number | null
          status?: string | null
        }
        Update: {
          date?: string
          employee_id?: string | null
          id?: string
          late_minutes?: number | null
          note?: string | null
          overtime_hours?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      capital_statements: {
        Row: {
          deposit: number | null
          id: string
          month: number | null
          opening: number | null
          party_id: string | null
          withdrawal: number | null
          year_id: string | null
        }
        Insert: {
          deposit?: number | null
          id?: string
          month?: number | null
          opening?: number | null
          party_id?: string | null
          withdrawal?: number | null
          year_id?: string | null
        }
        Update: {
          deposit?: number | null
          id?: string
          month?: number | null
          opening?: number | null
          party_id?: string | null
          withdrawal?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_statements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_statements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "capital_statements_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
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
      commission_ledgers: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          id: string
          month: number | null
          paid_amount: number | null
          party_id: string | null
          total_sale_pairs: number | null
          year_id: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          id?: string
          month?: number | null
          paid_amount?: number | null
          party_id?: string | null
          total_sale_pairs?: number | null
          year_id?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          id?: string
          month?: number | null
          paid_amount?: number | null
          party_id?: string | null
          total_sale_pairs?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledgers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_ledgers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "commission_ledgers_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      company_deposits: {
        Row: {
          advance_paid: number | null
          advance_taken: number | null
          id: string
          month: number | null
          occupation: string | null
          opening: number | null
          party_id: string | null
          year_id: string | null
        }
        Insert: {
          advance_paid?: number | null
          advance_taken?: number | null
          id?: string
          month?: number | null
          occupation?: string | null
          opening?: number | null
          party_id?: string | null
          year_id?: string | null
        }
        Update: {
          advance_paid?: number | null
          advance_taken?: number | null
          id?: string
          month?: number | null
          occupation?: string | null
          opening?: number | null
          party_id?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_deposits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_deposits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "company_deposits_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_transactions: {
        Row: {
          amount: number
          bank_id: string | null
          created_at: string | null
          date: string
          expense_head_id: string | null
          id: string
          income_head_id: string | null
          note: string | null
          party_id: string | null
          posting_id: string | null
          type: string | null
          year_id: string | null
        }
        Insert: {
          amount: number
          bank_id?: string | null
          created_at?: string | null
          date: string
          expense_head_id?: string | null
          id?: string
          income_head_id?: string | null
          note?: string | null
          party_id?: string | null
          posting_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Update: {
          amount?: number
          bank_id?: string | null
          created_at?: string | null
          date?: string
          expense_head_id?: string | null
          id?: string
          income_head_id?: string | null
          note?: string | null
          party_id?: string | null
          posting_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_transactions_expense_head_id_fkey"
            columns: ["expense_head_id"]
            isOneToOne: false
            referencedRelation: "expense_heads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_transactions_income_head_id_fkey"
            columns: ["income_head_id"]
            isOneToOne: false
            referencedRelation: "income_heads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "daily_transactions_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "year_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_transactions_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_items: {
        Row: {
          article_id: string | null
          cartons: number | null
          color_id: string | null
          date: string
          id: string
          location_id: string | null
          pairs: number | null
          reason: string | null
          season: string | null
          year_id: string | null
        }
        Insert: {
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          date: string
          id?: string
          location_id?: string | null
          pairs?: number | null
          reason?: string | null
          season?: string | null
          year_id?: string | null
        }
        Update: {
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          date?: string
          id?: string
          location_id?: string | null
          pairs?: number | null
          reason?: string | null
          season?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_items_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
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
      excel_imports: {
        Row: {
          error_rows: number | null
          filename: string | null
          id: string
          imported_at: string | null
          module: string
          success_rows: number | null
          total_rows: number | null
        }
        Insert: {
          error_rows?: number | null
          filename?: string | null
          id?: string
          imported_at?: string | null
          module: string
          success_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          error_rows?: number | null
          filename?: string | null
          id?: string
          imported_at?: string | null
          module?: string
          success_rows?: number | null
          total_rows?: number | null
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
      fdr_transactions: {
        Row: {
          amount: number
          date: string
          fdr_id: string | null
          id: string
          note: string | null
          type: string | null
        }
        Insert: {
          amount: number
          date: string
          fdr_id?: string | null
          id?: string
          note?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          date?: string
          fdr_id?: string | null
          id?: string
          note?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fdr_transactions_fdr_id_fkey"
            columns: ["fdr_id"]
            isOneToOne: false
            referencedRelation: "fixed_deposits"
            referencedColumns: ["id"]
          },
        ]
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
      fixed_deposits: {
        Row: {
          account_no: string | null
          bank_id: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          start_date: string | null
        }
        Insert: {
          account_no?: string | null
          bank_id?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          start_date?: string | null
        }
        Update: {
          account_no?: string | null
          bank_id?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_deposits_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      insurance_ledgers: {
        Row: {
          address: string | null
          deposit: number | null
          id: string
          month: number | null
          name: string
          opening: number | null
          type: string | null
          withdrawal: number | null
          year_id: string | null
        }
        Insert: {
          address?: string | null
          deposit?: number | null
          id?: string
          month?: number | null
          name: string
          opening?: number | null
          type?: string | null
          withdrawal?: number | null
          year_id?: string | null
        }
        Update: {
          address?: string | null
          deposit?: number | null
          id?: string
          month?: number | null
          name?: string
          opening?: number | null
          type?: string | null
          withdrawal?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_ledgers_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          brand_id: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_default: boolean | null
          name: string
          show_commission: boolean | null
          show_prev_balance: boolean | null
          show_transport: boolean | null
        }
        Insert: {
          brand_id?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          show_commission?: boolean | null
          show_prev_balance?: boolean | null
          show_transport?: boolean | null
        }
        Update: {
          brand_id?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          show_commission?: boolean | null
          show_prev_balance?: boolean | null
          show_transport?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_transactions: {
        Row: {
          amount: number
          date: string
          id: string
          loan_id: string | null
          note: string | null
          type: string | null
        }
        Insert: {
          amount: number
          date: string
          id?: string
          loan_id?: string | null
          note?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          loan_id?: string | null
          note?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_transactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          address: string | null
          direction: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          loan_type: string | null
          mobile: string | null
          opening_balance: number | null
          party_name: string
          start_date: string | null
          year_id: string | null
        }
        Insert: {
          address?: string | null
          direction?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          loan_type?: string | null
          mobile?: string | null
          opening_balance?: number | null
          party_name: string
          start_date?: string | null
          year_id?: string | null
        }
        Update: {
          address?: string | null
          direction?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          loan_type?: string | null
          mobile?: string | null
          opening_balance?: number | null
          party_name?: string
          start_date?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
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
      party_advances: {
        Row: {
          amount: number
          date: string
          id: string
          note: string | null
          party_id: string | null
          type: string | null
          year_id: string | null
        }
        Insert: {
          amount: number
          date: string
          id?: string
          note?: string | null
          party_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          note?: string | null
          party_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "party_advances_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_advances_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "party_advances_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          article_id: string | null
          brand_id: string | null
          color_id: string | null
          created_at: string | null
          date: string
          extra_cartons: number | null
          full_cartons: number | null
          id: string
          location_id: string | null
          model_id: string | null
          note: string | null
          pairs_count: number | null
          season: string | null
          short_cartons: number | null
          year_id: string | null
        }
        Insert: {
          article_id?: string | null
          brand_id?: string | null
          color_id?: string | null
          created_at?: string | null
          date: string
          extra_cartons?: number | null
          full_cartons?: number | null
          id?: string
          location_id?: string | null
          model_id?: string | null
          note?: string | null
          pairs_count?: number | null
          season?: string | null
          short_cartons?: number | null
          year_id?: string | null
        }
        Update: {
          article_id?: string | null
          brand_id?: string | null
          color_id?: string | null
          created_at?: string | null
          date?: string
          extra_cartons?: number | null
          full_cartons?: number | null
          id?: string
          location_id?: string | null
          model_id?: string | null
          note?: string | null
          pairs_count?: number | null
          season?: string | null
          short_cartons?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          amount: number
          id: string
          material_id: string | null
          purchase_id: string | null
          quantity: number
          rate: number
          unit: string
        }
        Insert: {
          amount: number
          id?: string
          material_id?: string | null
          purchase_id?: string | null
          quantity: number
          rate: number
          unit: string
        }
        Update: {
          amount?: number
          id?: string
          material_id?: string | null
          purchase_id?: string | null
          quantity?: number
          rate?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          material_id: string | null
          purchase_id: string | null
          quantity: number
          reason: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          material_id?: string | null
          purchase_id?: string | null
          quantity: number
          reason?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          material_id?: string | null
          purchase_id?: string | null
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          bank_id: string | null
          created_at: string | null
          date: string
          discount: number | null
          id: string
          memo_no: string | null
          note: string | null
          paid_amount: number | null
          payment_mode: string | null
          subtotal: number | null
          supplier_id: string | null
          total: number | null
          transport: number | null
          year_id: string | null
        }
        Insert: {
          bank_id?: string | null
          created_at?: string | null
          date: string
          discount?: number | null
          id?: string
          memo_no?: string | null
          note?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          transport?: number | null
          year_id?: string | null
        }
        Update: {
          bank_id?: string | null
          created_at?: string | null
          date?: string
          discount?: number | null
          id?: string
          memo_no?: string | null
          note?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          total?: number | null
          transport?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "purchases_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          id: string
          is_active: boolean | null
          name_bn: string
          opening_stock: number | null
          unit: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          name_bn: string
          opening_stock?: number | null
          unit: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name_bn?: string
          opening_stock?: number | null
          unit?: string
        }
        Relationships: []
      }
      rent_ledgers: {
        Row: {
          id: string
          monthly_amount: number | null
          opening_balance: number | null
          party_id: string | null
          rent_type: string | null
          start_date: string | null
        }
        Insert: {
          id?: string
          monthly_amount?: number | null
          opening_balance?: number | null
          party_id?: string | null
          rent_type?: string | null
          start_date?: string | null
        }
        Update: {
          id?: string
          monthly_amount?: number | null
          opening_balance?: number | null
          party_id?: string | null
          rent_type?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_ledgers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_ledgers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
        ]
      }
      rent_transactions: {
        Row: {
          amount: number
          date: string
          id: string
          note: string | null
          rent_ledger_id: string | null
          type: string | null
          year_id: string | null
        }
        Insert: {
          amount: number
          date: string
          id?: string
          note?: string | null
          rent_ledger_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          note?: string | null
          rent_ledger_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_transactions_rent_ledger_id_fkey"
            columns: ["rent_ledger_id"]
            isOneToOne: false
            referencedRelation: "rent_ledgers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_transactions_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_advances: {
        Row: {
          amount: number
          date: string
          employee_id: string | null
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          date: string
          employee_id?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          date?: string
          employee_id?: string | null
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_sheets: {
        Row: {
          advance_deduction: number | null
          basic: number | null
          employee_id: string | null
          id: string
          month: number
          net_pay: number | null
          note: string | null
          overtime_pay: number | null
          paid_date: string | null
          year_id: string | null
        }
        Insert: {
          advance_deduction?: number | null
          basic?: number | null
          employee_id?: string | null
          id?: string
          month: number
          net_pay?: number | null
          note?: string | null
          overtime_pay?: number | null
          paid_date?: string | null
          year_id?: string | null
        }
        Update: {
          advance_deduction?: number | null
          basic?: number | null
          employee_id?: string | null
          id?: string
          month?: number
          net_pay?: number | null
          note?: string | null
          overtime_pay?: number | null
          paid_date?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_sheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_sheets_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          amount: number
          article_id: string | null
          cartons: number | null
          color_id: string | null
          id: string
          pairs: number | null
          rate: number
          sale_id: string | null
          season: string | null
        }
        Insert: {
          amount: number
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          id?: string
          pairs?: number | null
          rate: number
          sale_id?: string | null
          season?: string | null
        }
        Update: {
          amount?: number
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          id?: string
          pairs?: number | null
          rate?: number
          sale_id?: string | null
          season?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          bank_id: string | null
          brand_id: string | null
          channel: string | null
          commission: number | null
          created_at: string | null
          date: string
          deduction: number | null
          id: string
          location_id: string | null
          memo_no: string | null
          note: string | null
          paid_amount: number | null
          party_id: string | null
          payment_mode: string | null
          sale_type: string | null
          season: string | null
          subtotal: number | null
          total_bill: number | null
          transport: number | null
          year_id: string | null
        }
        Insert: {
          bank_id?: string | null
          brand_id?: string | null
          channel?: string | null
          commission?: number | null
          created_at?: string | null
          date: string
          deduction?: number | null
          id?: string
          location_id?: string | null
          memo_no?: string | null
          note?: string | null
          paid_amount?: number | null
          party_id?: string | null
          payment_mode?: string | null
          sale_type?: string | null
          season?: string | null
          subtotal?: number | null
          total_bill?: number | null
          transport?: number | null
          year_id?: string | null
        }
        Update: {
          bank_id?: string | null
          brand_id?: string | null
          channel?: string | null
          commission?: number | null
          created_at?: string | null
          date?: string
          deduction?: number | null
          id?: string
          location_id?: string | null
          memo_no?: string | null
          note?: string | null
          paid_amount?: number | null
          party_id?: string | null
          payment_mode?: string | null
          sale_type?: string | null
          season?: string | null
          subtotal?: number | null
          total_bill?: number | null
          transport?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "sales_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
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
      stock_movements: {
        Row: {
          article_id: string | null
          cartons: number | null
          color_id: string | null
          date: string
          from_location_id: string | null
          id: string
          note: string | null
          pairs: number | null
          reference_id: string | null
          season: string | null
          to_location_id: string | null
          type: string | null
        }
        Insert: {
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          date: string
          from_location_id?: string | null
          id?: string
          note?: string | null
          pairs?: number | null
          reference_id?: string | null
          season?: string | null
          to_location_id?: string | null
          type?: string | null
        }
        Update: {
          article_id?: string | null
          cartons?: number | null
          color_id?: string | null
          date?: string
          from_location_id?: string | null
          id?: string
          note?: string | null
          pairs?: number | null
          reference_id?: string | null
          season?: string | null
          to_location_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_advances: {
        Row: {
          amount: number
          date: string
          id: string
          note: string | null
          supplier_id: string | null
          type: string | null
          year_id: string | null
        }
        Insert: {
          amount: number
          date: string
          id?: string
          note?: string | null
          supplier_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          note?: string | null
          supplier_id?: string | null
          type?: string | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_advances_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_advances_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_party_balance"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "supplier_advances_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_sales: {
        Row: {
          date: string
          id: string
          item_name: string
          note: string | null
          quantity: number | null
          rate: number | null
          total: number | null
          year_id: string | null
        }
        Insert: {
          date: string
          id?: string
          item_name: string
          note?: string | null
          quantity?: number | null
          rate?: number | null
          total?: number | null
          year_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          item_name?: string
          note?: string | null
          quantity?: number | null
          rate?: number | null
          total?: number | null
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_sales_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      year_postings: {
        Row: {
          created_at: string | null
          id: string
          is_locked: boolean | null
          month: number
          note: string | null
          posting_date: string
          year_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          month: number
          note?: string | null
          posting_date: string
          year_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          month?: number
          note?: string | null
          posting_date?: string
          year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "year_postings_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_party_balance: {
        Row: {
          current_balance: number | null
          name: string | null
          opening_balance: number | null
          party_id: string | null
          total_paid: number | null
          total_sales: number | null
        }
        Relationships: []
      }
      v_shoe_stock: {
        Row: {
          article_id: string | null
          color_id: string | null
          current_cartons: number | null
          current_pairs: number | null
          location_id: string | null
          season: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
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
