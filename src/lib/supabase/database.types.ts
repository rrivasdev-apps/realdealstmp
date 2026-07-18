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
      cancelled_ab_reasons: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancelled_ab_reasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cancelled_bc_ac_reasons: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancelled_bc_ac_reasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_types: {
        Row: {
          basis: string | null
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          value: number
        }
        Insert: {
          basis?: string | null
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          value: number
        }
        Update: {
          basis?: string | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      deal_cancelled_ab_reasons: {
        Row: {
          cancelled_ab_reason_id: string
          deal_id: string
        }
        Insert: {
          cancelled_ab_reason_id: string
          deal_id: string
        }
        Update: {
          cancelled_ab_reason_id?: string
          deal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_cancelled_ab_reasons_cancelled_ab_reason_id_fkey"
            columns: ["cancelled_ab_reason_id"]
            isOneToOne: false
            referencedRelation: "cancelled_ab_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_cancelled_ab_reasons_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_cancelled_bc_ac_reasons: {
        Row: {
          cancelled_bc_ac_reason_id: string
          deal_id: string
        }
        Insert: {
          cancelled_bc_ac_reason_id: string
          deal_id: string
        }
        Update: {
          cancelled_bc_ac_reason_id?: string
          deal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_cancelled_bc_ac_reasons_cancelled_bc_ac_reason_id_fkey"
            columns: ["cancelled_bc_ac_reason_id"]
            isOneToOne: false
            referencedRelation: "cancelled_bc_ac_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_cancelled_bc_ac_reasons_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_checklist_items: {
        Row: {
          checklist_item_id: string
          deal_id: string
        }
        Insert: {
          checklist_item_id: string
          deal_id: string
        }
        Update: {
          checklist_item_id?: string
          deal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_checklist_items_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_checklist_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_employees: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_employees_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_on_hold_reasons: {
        Row: {
          deal_id: string
          on_hold_reason_id: string
        }
        Insert: {
          deal_id: string
          on_hold_reason_id: string
        }
        Update: {
          deal_id?: string
          on_hold_reason_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_on_hold_reasons_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_on_hold_reasons_on_hold_reason_id_fkey"
            columns: ["on_hold_reason_id"]
            isOneToOne: false
            referencedRelation: "on_hold_reasons"
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
          ab_emd_amount: number | null
          ab_emd_deposit_received: boolean
          ab_emd_refund: boolean
          ab_purchase_type_id: string | null
          actual_closing_date: string | null
          address: string
          apn: string | null
          bc_contract_closing_date: string | null
          bc_emd_refund: boolean
          buyer_contract_date: string | null
          buyer_contract_price: number | null
          buyer_deposit_amount: number | null
          buyer_deposit_received: boolean
          buyer_found: boolean
          buyer_inspection_deadline: string | null
          cancelled_ab: boolean
          cancelled_ab_date: string | null
          cancelled_ab_party: string | null
          cancelled_bc_ac: boolean
          cancelled_bc_ac_date: string | null
          cancelled_bc_ac_party: string | null
          checklist_closing_extension: boolean
          checklist_due_diligence_extension: boolean
          checklist_initial_photos_needed: boolean
          checklist_memo: boolean
          checklist_on_hold: boolean
          checklist_post_occupancy: boolean
          checklist_seller_info_sheet_needed: boolean
          checklist_survey_needed: boolean
          closing_date: string | null
          closing_extension_date: string | null
          company_id: string
          contract_date: string | null
          contract_price: number | null
          contract_price_renegotiated_date: string | null
          created_at: string
          custom_fields: Json
          deal_type_id: string | null
          due_diligence_expiration: string | null
          due_diligence_extension_date: string | null
          foreclosure_date: string | null
          id: string
          in_foreclosure: boolean
          initial_photos_ordered_date: string | null
          initial_photos_received_date: string | null
          is_jv_deal: boolean
          is_listed: boolean
          jv_partner_company_id: string | null
          jv_split_percent: number | null
          jv_split_type_id: string | null
          lead_source_id: string | null
          legal_description: string | null
          lot_size_acres: number | null
          market_id: string | null
          mortgage_company_contact_id: string | null
          mortgage_principal_balance: number | null
          mortgage_rate: number | null
          mortgage_term: number | null
          on_hold_date: string | null
          original_closing_date: string | null
          original_contract_price: number | null
          original_due_diligence_date: string | null
          original_projected_sales_price: number | null
          payoff_ordered: boolean
          poa_needed: boolean
          post_occupancy_hold_back_amount: number | null
          post_occupancy_move_out_date: string | null
          projected_sales_price: number | null
          property_type_id: string | null
          renegotiated_bc_date: string | null
          renegotiated_bc_price: number | null
          seller_contact_id: string | null
          seller_info_sheet_sent: boolean
          seller_info_sheet_signed: boolean
          split_amount: number | null
          status_id: string
          survey_ordered_date: string | null
          title_company_contact_id: string | null
          title_opened: boolean
          title_ordered: boolean
          title_ready: boolean
          total_commissions: number | null
          total_expenses: number | null
          total_payoff_amount: number | null
        }
        Insert: {
          ab_emd_amount?: number | null
          ab_emd_deposit_received?: boolean
          ab_emd_refund?: boolean
          ab_purchase_type_id?: string | null
          actual_closing_date?: string | null
          address: string
          apn?: string | null
          bc_contract_closing_date?: string | null
          bc_emd_refund?: boolean
          buyer_contract_date?: string | null
          buyer_contract_price?: number | null
          buyer_deposit_amount?: number | null
          buyer_deposit_received?: boolean
          buyer_found?: boolean
          buyer_inspection_deadline?: string | null
          cancelled_ab?: boolean
          cancelled_ab_date?: string | null
          cancelled_ab_party?: string | null
          cancelled_bc_ac?: boolean
          cancelled_bc_ac_date?: string | null
          cancelled_bc_ac_party?: string | null
          checklist_closing_extension?: boolean
          checklist_due_diligence_extension?: boolean
          checklist_initial_photos_needed?: boolean
          checklist_memo?: boolean
          checklist_on_hold?: boolean
          checklist_post_occupancy?: boolean
          checklist_seller_info_sheet_needed?: boolean
          checklist_survey_needed?: boolean
          closing_date?: string | null
          closing_extension_date?: string | null
          company_id: string
          contract_date?: string | null
          contract_price?: number | null
          contract_price_renegotiated_date?: string | null
          created_at?: string
          custom_fields?: Json
          deal_type_id?: string | null
          due_diligence_expiration?: string | null
          due_diligence_extension_date?: string | null
          foreclosure_date?: string | null
          id?: string
          in_foreclosure?: boolean
          initial_photos_ordered_date?: string | null
          initial_photos_received_date?: string | null
          is_jv_deal?: boolean
          is_listed?: boolean
          jv_partner_company_id?: string | null
          jv_split_percent?: number | null
          jv_split_type_id?: string | null
          lead_source_id?: string | null
          legal_description?: string | null
          lot_size_acres?: number | null
          market_id?: string | null
          mortgage_company_contact_id?: string | null
          mortgage_principal_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          on_hold_date?: string | null
          original_closing_date?: string | null
          original_contract_price?: number | null
          original_due_diligence_date?: string | null
          original_projected_sales_price?: number | null
          payoff_ordered?: boolean
          poa_needed?: boolean
          post_occupancy_hold_back_amount?: number | null
          post_occupancy_move_out_date?: string | null
          projected_sales_price?: number | null
          property_type_id?: string | null
          renegotiated_bc_date?: string | null
          renegotiated_bc_price?: number | null
          seller_contact_id?: string | null
          seller_info_sheet_sent?: boolean
          seller_info_sheet_signed?: boolean
          split_amount?: number | null
          status_id: string
          survey_ordered_date?: string | null
          title_company_contact_id?: string | null
          title_opened?: boolean
          title_ordered?: boolean
          title_ready?: boolean
          total_commissions?: number | null
          total_expenses?: number | null
          total_payoff_amount?: number | null
        }
        Update: {
          ab_emd_amount?: number | null
          ab_emd_deposit_received?: boolean
          ab_emd_refund?: boolean
          ab_purchase_type_id?: string | null
          actual_closing_date?: string | null
          address?: string
          apn?: string | null
          bc_contract_closing_date?: string | null
          bc_emd_refund?: boolean
          buyer_contract_date?: string | null
          buyer_contract_price?: number | null
          buyer_deposit_amount?: number | null
          buyer_deposit_received?: boolean
          buyer_found?: boolean
          buyer_inspection_deadline?: string | null
          cancelled_ab?: boolean
          cancelled_ab_date?: string | null
          cancelled_ab_party?: string | null
          cancelled_bc_ac?: boolean
          cancelled_bc_ac_date?: string | null
          cancelled_bc_ac_party?: string | null
          checklist_closing_extension?: boolean
          checklist_due_diligence_extension?: boolean
          checklist_initial_photos_needed?: boolean
          checklist_memo?: boolean
          checklist_on_hold?: boolean
          checklist_post_occupancy?: boolean
          checklist_seller_info_sheet_needed?: boolean
          checklist_survey_needed?: boolean
          closing_date?: string | null
          closing_extension_date?: string | null
          company_id?: string
          contract_date?: string | null
          contract_price?: number | null
          contract_price_renegotiated_date?: string | null
          created_at?: string
          custom_fields?: Json
          deal_type_id?: string | null
          due_diligence_expiration?: string | null
          due_diligence_extension_date?: string | null
          foreclosure_date?: string | null
          id?: string
          in_foreclosure?: boolean
          initial_photos_ordered_date?: string | null
          initial_photos_received_date?: string | null
          is_jv_deal?: boolean
          is_listed?: boolean
          jv_partner_company_id?: string | null
          jv_split_percent?: number | null
          jv_split_type_id?: string | null
          lead_source_id?: string | null
          legal_description?: string | null
          lot_size_acres?: number | null
          market_id?: string | null
          mortgage_company_contact_id?: string | null
          mortgage_principal_balance?: number | null
          mortgage_rate?: number | null
          mortgage_term?: number | null
          on_hold_date?: string | null
          original_closing_date?: string | null
          original_contract_price?: number | null
          original_due_diligence_date?: string | null
          original_projected_sales_price?: number | null
          payoff_ordered?: boolean
          poa_needed?: boolean
          post_occupancy_hold_back_amount?: number | null
          post_occupancy_move_out_date?: string | null
          projected_sales_price?: number | null
          property_type_id?: string | null
          renegotiated_bc_date?: string | null
          renegotiated_bc_price?: number | null
          seller_contact_id?: string | null
          seller_info_sheet_sent?: boolean
          seller_info_sheet_signed?: boolean
          split_amount?: number | null
          status_id?: string
          survey_ordered_date?: string | null
          title_company_contact_id?: string | null
          title_opened?: boolean
          title_ordered?: boolean
          title_ready?: boolean
          total_commissions?: number | null
          total_expenses?: number | null
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
            foreignKeyName: "deals_jv_partner_company_id_fkey"
            columns: ["jv_partner_company_id"]
            isOneToOne: false
            referencedRelation: "investor_llcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_jv_split_type_id_fkey"
            columns: ["jv_split_type_id"]
            isOneToOne: false
            referencedRelation: "split_types"
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
      employee_role_commission_types: {
        Row: {
          commission_type_id: string
          employee_role_id: string
        }
        Insert: {
          commission_type_id: string
          employee_role_id: string
        }
        Update: {
          commission_type_id?: string
          employee_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_role_commission_types_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_role_commission_types_employee_role_id_fkey"
            columns: ["employee_role_id"]
            isOneToOne: false
            referencedRelation: "employee_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_llcs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_llcs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      on_hold_reasons: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_hold_reasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          commission_type_id: string | null
          company_id: string
          created_at: string
          deal_id: string | null
          id: string
          profile_id: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number | null
          commission_type_id?: string | null
          company_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          profile_id?: string | null
          status: string
          type?: string
        }
        Update: {
          amount?: number | null
          commission_type_id?: string | null
          company_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          profile_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      profile_commission_types: {
        Row: {
          commission_type_id: string
          profile_id: string
        }
        Insert: {
          commission_type_id: string
          profile_id: string
        }
        Update: {
          commission_type_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_commission_types_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_commission_types_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          employee_role_id: string | null
          id: string
          name: string
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          employee_role_id?: string | null
          id: string
          name: string
          role: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          employee_role_id?: string | null
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
          {
            foreignKeyName: "profiles_employee_role_id_fkey"
            columns: ["employee_role_id"]
            isOneToOne: false
            referencedRelation: "employee_roles"
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
      showing_statuses: {
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
      showings: {
        Row: {
          buyer_contact_id: string | null
          created_at: string
          deal_id: string
          details: string | null
          id: string
          showing_date: string | null
          status_id: string
          vendor_contact_id: string | null
        }
        Insert: {
          buyer_contact_id?: string | null
          created_at?: string
          deal_id: string
          details?: string | null
          id?: string
          showing_date?: string | null
          status_id: string
          vendor_contact_id?: string | null
        }
        Update: {
          buyer_contact_id?: string | null
          created_at?: string
          deal_id?: string
          details?: string | null
          id?: string
          showing_date?: string | null
          status_id?: string
          vendor_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "showings_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "showing_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      split_types: {
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
      is_company_admin: {
        Args: { target_company_id: string }
        Returns: boolean
      }
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
