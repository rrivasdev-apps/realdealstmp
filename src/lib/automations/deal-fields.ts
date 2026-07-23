// Hardcoded allowlist of updatable `deals` columns for Fill Fields steps and the
// field_changed/date_based trigger pickers. Real columns aren't dynamically
// discoverable at runtime the way custom_field_definitions rows are, so this is a
// maintained constant, not a query -- deliberately excludes identity columns
// (id/company_id/address/created_at), custom_fields (handled separately), every
// original_* column (protected by the protect_original_deal_values trigger, never
// client-settable per CLAUDE.md), status_id, and lookup FK columns (out of scope
// for a Fill Fields step in this milestone).
export type DealFieldType = 'text' | 'number' | 'date' | 'checkbox'

export type DealField = {
  key: string
  label: string
  type: DealFieldType
}

export const DEAL_FIELDS: DealField[] = [
  { key: 'apn', label: 'APN', type: 'text' },
  { key: 'legal_description', label: 'Legal description', type: 'text' },
  { key: 'cancelled_ab_party', label: 'Cancelled AB party', type: 'text' },
  { key: 'cancelled_bc_ac_party', label: 'Cancelled BC/AC party', type: 'text' },

  { key: 'contract_price', label: 'Contract price', type: 'number' },
  { key: 'projected_sales_price', label: 'Projected sales price', type: 'number' },
  { key: 'buyer_contract_price', label: 'Buyer contract price', type: 'number' },
  { key: 'renegotiated_bc_price', label: 'Renegotiated BC price', type: 'number' },
  { key: 'buyer_deposit_amount', label: 'Buyer deposit amount', type: 'number' },
  { key: 'ab_emd_amount', label: 'AB EMD amount', type: 'number' },
  { key: 'mortgage_principal_balance', label: 'Mortgage principal balance', type: 'number' },
  { key: 'mortgage_rate', label: 'Mortgage rate', type: 'number' },
  { key: 'mortgage_term', label: 'Mortgage term', type: 'number' },
  { key: 'total_payoff_amount', label: 'Total payoff amount', type: 'number' },
  { key: 'post_occupancy_hold_back_amount', label: 'Post occupancy hold back amount', type: 'number' },
  { key: 'split_amount', label: 'Split amount', type: 'number' },
  { key: 'jv_split_percent', label: 'JV split percent', type: 'number' },
  { key: 'total_expenses', label: 'Total expenses', type: 'number' },
  { key: 'total_commissions', label: 'Total commissions', type: 'number' },
  { key: 'lot_size_acres', label: 'Lot size (acres)', type: 'number' },

  { key: 'contract_date', label: 'Contract date', type: 'date' },
  { key: 'closing_date', label: 'Closing date', type: 'date' },
  { key: 'due_diligence_expiration', label: 'Due diligence expiration', type: 'date' },
  { key: 'actual_closing_date', label: 'Actual closing date', type: 'date' },
  { key: 'buyer_contract_date', label: 'Buyer contract date', type: 'date' },
  { key: 'bc_contract_closing_date', label: 'BC contract closing date', type: 'date' },
  { key: 'buyer_inspection_deadline', label: 'Buyer inspection deadline', type: 'date' },
  { key: 'renegotiated_bc_date', label: 'Renegotiated BC date', type: 'date' },
  { key: 'foreclosure_date', label: 'Foreclosure date', type: 'date' },
  { key: 'on_hold_date', label: 'On hold date', type: 'date' },
  { key: 'closing_extension_date', label: 'Extension closing date', type: 'date' },
  { key: 'due_diligence_extension_date', label: 'DD extension date', type: 'date' },
  { key: 'survey_ordered_date', label: 'Survey ordered date', type: 'date' },
  { key: 'initial_photos_ordered_date', label: 'Initial photos ordered date', type: 'date' },
  { key: 'initial_photos_received_date', label: 'Initial photos received date', type: 'date' },
  { key: 'post_occupancy_move_out_date', label: 'Post occupancy move out date', type: 'date' },
  { key: 'cancelled_ab_date', label: 'Cancelled AB date', type: 'date' },
  { key: 'cancelled_bc_ac_date', label: 'Cancelled BC/AC date', type: 'date' },

  { key: 'buyer_found', label: 'Buyer found', type: 'checkbox' },
  { key: 'buyer_deposit_received', label: 'Buyer deposit received', type: 'checkbox' },
  { key: 'title_opened', label: 'Title opened', type: 'checkbox' },
  { key: 'title_ordered', label: 'Title ordered', type: 'checkbox' },
  { key: 'title_ready', label: 'Title ready', type: 'checkbox' },
  { key: 'poa_needed', label: 'Are we obtaining POA', type: 'checkbox' },
  { key: 'payoff_ordered', label: 'Payoff ordered', type: 'checkbox' },
  { key: 'in_foreclosure', label: 'In foreclosure', type: 'checkbox' },
  { key: 'is_listed', label: 'Listed', type: 'checkbox' },
  { key: 'is_jv_deal', label: 'Is JV deal', type: 'checkbox' },
  { key: 'ab_emd_deposit_received', label: 'AB EMD deposit received', type: 'checkbox' },
  { key: 'ab_emd_refund', label: 'AB EMD refund', type: 'checkbox' },
  { key: 'bc_emd_refund', label: 'BC EMD refund', type: 'checkbox' },
  { key: 'cancelled_ab', label: 'Cancelled AB', type: 'checkbox' },
  { key: 'cancelled_bc_ac', label: 'Cancelled BC/AC', type: 'checkbox' },
  { key: 'seller_info_sheet_sent', label: 'Seller info sheet sent', type: 'checkbox' },
  { key: 'seller_info_sheet_signed', label: 'Seller info sheet signed', type: 'checkbox' },
  { key: 'checklist_post_occupancy', label: 'Post occupancy', type: 'checkbox' },
  { key: 'checklist_survey_needed', label: 'Survey needed', type: 'checkbox' },
  { key: 'checklist_initial_photos_needed', label: 'Initial photos needed', type: 'checkbox' },
  { key: 'checklist_seller_info_sheet_needed', label: 'Seller info sheet needed', type: 'checkbox' },
  { key: 'checklist_memo', label: 'Memo', type: 'checkbox' },
  { key: 'checklist_on_hold', label: 'On hold', type: 'checkbox' },
  { key: 'checklist_closing_extension', label: 'Closing extension', type: 'checkbox' },
  { key: 'checklist_due_diligence_extension', label: 'Due diligence extension', type: 'checkbox' },
]

export const DEAL_DATE_FIELDS = DEAL_FIELDS.filter((field) => field.type === 'date')

const DEAL_FIELD_KEYS = new Set(DEAL_FIELDS.map((field) => field.key))
const DEAL_DATE_FIELD_KEYS = new Set(DEAL_DATE_FIELDS.map((field) => field.key))

export function isValidDealField(key: unknown): key is string {
  return typeof key === 'string' && DEAL_FIELD_KEYS.has(key)
}

export function isValidDealDateField(key: unknown): key is string {
  return typeof key === 'string' && DEAL_DATE_FIELD_KEYS.has(key)
}
