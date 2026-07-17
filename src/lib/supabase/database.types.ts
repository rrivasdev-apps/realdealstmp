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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_contact_types: {
        Row: {
          contact_id: string
          contact_type_id: string
        }
        Insert: {
          contact_id: string
          contact_type_id: string
        }
        Update: {
          contact_id?: string
          contact_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_contact_types_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_contact_types_contact_type_id_fkey"
            columns: ["contact_type_id"]
            isOneToOne: false
            referencedRelation: "contact_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_emails: {
        Row: {
          contact_id: string
          email: string
          id: string
          type_id: string | null
        }
        Insert: {
          contact_id: string
          email: string
          id?: string
          type_id?: string | null
        }
        Update: {
          contact_id?: string
          email?: string
          id?: string
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_emails_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "email_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phone_numbers: {
        Row: {
          contact_id: string
          id: string
          phone: string
          type_id: string | null
        }
        Insert: {
          contact_id: string
          id?: string
          phone: string
          type_id?: string | null
        }
        Update: {
          contact_id?: string
          id?: string
          phone?: string
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_phone_numbers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_phone_numbers_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "phone_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          id: string
          investor_llc_id: string | null
          name: string
          notes: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          investor_llc_id?: string | null
          name: string
          notes?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          investor_llc_id?: string | null
          name?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_statuses: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      deal_types: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          ab_purchase_type_id: string | null
          actual_closing_date: string | null
          address: string
          apn: string | null
          bc_contract_closing_date: string | null
          buyer_contract_date: string | null
          buyer_contract_price: number | null
          buyer_deposit_amount: number | null
          buyer_deposit_received: boolean
          buyer_found: boolean
          buyer_inspection_deadline: string | null
          closing_date: string | null
          company_id: string
          contract_date: string | null
          contract_price: number | null
          created_at: string
          custom_fields: Json
          deal_type_id: string | null
          due_diligence_expiration: string | null
          foreclosure_date: string | null
          id: string
          in_foreclosure: boolean
          is_listed: boolean
          lead_source_id: string | null
          legal_description: string | null
          lot_size_acres: number | null
          market_id: string | null
          mortgage_company_contact_id: string | null
          mortgage_principal_balance: number | null
          mortgage_rate: number | null
          mortgage_term: number | null
          original_closing_date: string | null
          original_contract_price: number | null
          original_due_diligence_date: string | null
          original_projected_sales_price: number | null
          payoff_ordered: boolean
          poa_needed: boolean
          projected_sales_price: number | null
          property_type_id: string | null
          renegotiated_bc_price: number | null
          seller_contact_id: string | null
          status_id: string
          title_company_contact_id: string | null
          title_opened: boolean
          title_ordered: boolean
          title_ready: boolean
          total_payoff_amount: number | null
        }
        Insert: {
          ab_purchase_type_id?: string | null
          actual_closing_date?: string | null
          address: string
          apn?: string | null
          bc_contract_closing_date?: string | null
          buyer_contract_date?: string | null
          buyer_contract_price?: number | null
          buyer_deposit_amount?: number | null
          buyer_deposit_received?: boolean
          buyer_found?: boolean
          buyer_inspection_deadline?: string | null
          closing_date?: string | null
          company_id: string
          contract_date?: string | null
          contract_price?: number | null
          created_at?: string
          custom_fields?: Json
          deal_type_id?: string | null
          due_diligence_expiration?: string | null
          foreclosure_date?: string | null
          id?: string
          in_foreclosure?: boolean
          is_listed?: boolean
          lead_source_id?: string | null
          legal_description?: string | null
          lot_size_acres?: number | null
          market_id?: string | null
          mortgage_company_contact_id?: string | null
          mortgage_principal_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          original_closing_date?: string | null
          original_contract_price?: number | null
          original_due_diligence_date?: string | null
          original_projected_sales_price?: number | null
          payoff_ordered?: boolean
          poa_needed?: boolean
          projected_sales_price?: number | null
          property_type_id?: string | null
          renegotiated_bc_price?: number | null
          seller_contact_id?: string | null
          status_id: string
          title_company_contact_id?: string | null
          title_opened?: boolean
          title_ordered?: boolean
          title_ready?: boolean
          total_payoff_amount?: number | null
        }
        Update: {
          ab_purchase_type_id?: string | null
          actual_closing_date?: string | null
          address?: string
          apn?: string | null
          bc_contract_closing_date?: string | null
          buyer_contract_date?: string | null
          buyer_contract_price?: number | null
          buyer_deposit_amount?: number | null
          buyer_deposit_received?: boolean
          buyer_found?: boolean
          buyer_inspection_deadline?: string | null
          closing_date?: string | null
          company_id?: string
          contract_date?: string | null
          contract_price?: number | null
          created_at?: string
          custom_fields?: Json
          deal_type_id?: string | null
          due_diligence_expiration?: string | null
          foreclosure_date?: string | null
          id?: string
          in_foreclosure?: boolean
          is_listed?: boolean
          lead_source_id?: string | null
          legal_description?: string | null
          lot_size_acres?: number | null
          market_id?: string | null
          mortgage_company_contact_id?: string | null
          mortgage_principal_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          original_closing_date?: string | null
          original_contract_price?: number | null
          original_due_diligence_date?: string | null
          original_projected_sales_price?: number | null
          payoff_ordered?: boolean
          poa_needed?: boolean
          projected_sales_price?: number | null
          property_type_id?: string | null
          renegotiated_bc_price?: number | null
          seller_contact_id?: string | null
          status_id?: string
          title_company_contact_id?: string | null
          title_opened?: boolean
          title_ordered?: boolean
          title_ready?: boolean
          total_payoff_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_ab_purchase_type_id_fkey"
            columns: ["ab_purchase_type_id"]
            isOneToOne: false
            referencedRelation: "purchase_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_deal_type_id_fkey"
            columns: ["deal_type_id"]
            isOneToOne: false
            referencedRelation: "deal_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_mortgage_company_contact_id_fkey"
            columns: ["mortgage_company_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_contact_id_fkey"
            columns: ["seller_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "deal_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_title_company_contact_id_fkey"
            columns: ["title_company_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_statuses: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          sort_order: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      offers: {
        Row: {
          closing_deadline: string | null
          created_at: string
          deal_id: string
          emd_deadline: string | null
          id: string
          inspection_deadline: string | null
          investor_contact_id: string | null
          notes: string | null
          offer_date: string | null
          offer_price: number | null
          purchase_type_id: string | null
          realtor_contact_id: string | null
          status_id: string
        }
        Insert: {
          closing_deadline?: string | null
          created_at?: string
          deal_id: string
          emd_deadline?: string | null
          id?: string
          inspection_deadline?: string | null
          investor_contact_id?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_price?: number | null
          purchase_type_id?: string | null
          realtor_contact_id?: string | null
          status_id: string
        }
        Update: {
          closing_deadline?: string | null
          created_at?: string
          deal_id?: string
          emd_deadline?: string | null
          id?: string
          inspection_deadline?: string | null
          investor_contact_id?: string | null
          notes?: string | null
          offer_date?: string | null
          offer_price?: number | null
          purchase_type_id?: string | null
          realtor_contact_id?: string | null
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_investor_contact_id_fkey"
            columns: ["investor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_purchase_type_id_fkey"
            columns: ["purchase_type_id"]
            isOneToOne: false
            referencedRelation: "purchase_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_realtor_contact_id_fkey"
            columns: ["realtor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "offer_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      purchase_types: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_company_member: {
        Args: { target_company_id: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
