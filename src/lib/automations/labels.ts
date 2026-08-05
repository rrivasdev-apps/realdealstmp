import type messages from '@/messages/en.json'

import { DEAL_DATE_FIELDS, DEAL_FIELDS, type DealField } from './deal-fields'

// Shared label lookups for the Automations feature (builder + runtime) -- a
// function rather than static records since the labels are translated:
// callers pass their own `useTranslations('Automations')` /
// `getTranslations('Automations')` instance so this works from both Server
// and Client Components. Mirrors the `getPayPeriodLabels(t)` pattern from
// src/lib/pay-periods/labels.ts.
type AutomationsKey = keyof (typeof messages)['Automations']
export type AutomationsTranslator = (key: AutomationsKey, values?: Record<string, string | number>) => string

export function getTriggerLabels(t: AutomationsTranslator): Record<string, string> {
  return {
    deal_created: t('triggerDealCreated'),
    field_changed: t('triggerFieldChanged'),
    custom_field_changed: t('triggerCustomFieldChanged'),
    step_completed: t('triggerStepCompleted'),
    date_based: t('triggerDateBased'),
  }
}

export function getStepTypeLabels(t: AutomationsTranslator): Record<string, string> {
  return {
    fill_fields: t('stepTypeFillFields'),
    conditional_statement: t('stepTypeConditionalStatement'),
    email_task: t('stepTypeEmailTask'),
    call_task: t('stepTypeCallTask'),
    generic_task: t('stepTypeGenericTask'),
    show_text: t('stepTypeShowText'),
    option_list: t('stepTypeOptionList'),
    trigger: t('stepTypeTrigger'),
  }
}

const DEAL_FIELD_LABEL_KEYS: Record<string, AutomationsKey> = {
  apn: 'fieldApn',
  legal_description: 'fieldLegalDescription',
  cancelled_ab_party: 'fieldCancelledAbParty',
  cancelled_bc_ac_party: 'fieldCancelledBcAcParty',
  contract_price: 'fieldContractPrice',
  projected_sales_price: 'fieldProjectedSalesPrice',
  buyer_contract_price: 'fieldBuyerContractPrice',
  renegotiated_bc_price: 'fieldRenegotiatedBcPrice',
  buyer_deposit_amount: 'fieldBuyerDepositAmount',
  ab_emd_amount: 'fieldAbEmdAmount',
  mortgage_principal_balance: 'fieldMortgagePrincipalBalance',
  mortgage_rate: 'fieldMortgageRate',
  mortgage_term: 'fieldMortgageTerm',
  total_payoff_amount: 'fieldTotalPayoffAmount',
  post_occupancy_hold_back_amount: 'fieldPostOccupancyHoldBackAmount',
  split_amount: 'fieldSplitAmount',
  jv_split_percent: 'fieldJvSplitPercent',
  total_expenses: 'fieldTotalExpenses',
  total_commissions: 'fieldTotalCommissions',
  lot_size_acres: 'fieldLotSizeAcres',
  contract_date: 'fieldContractDate',
  closing_date: 'fieldClosingDate',
  due_diligence_expiration: 'fieldDueDiligenceExpiration',
  actual_closing_date: 'fieldActualClosingDate',
  buyer_contract_date: 'fieldBuyerContractDate',
  bc_contract_closing_date: 'fieldBcContractClosingDate',
  buyer_inspection_deadline: 'fieldBuyerInspectionDeadline',
  renegotiated_bc_date: 'fieldRenegotiatedBcDate',
  foreclosure_date: 'fieldForeclosureDate',
  on_hold_date: 'fieldOnHoldDate',
  closing_extension_date: 'fieldClosingExtensionDate',
  due_diligence_extension_date: 'fieldDueDiligenceExtensionDate',
  survey_ordered_date: 'fieldSurveyOrderedDate',
  initial_photos_ordered_date: 'fieldInitialPhotosOrderedDate',
  initial_photos_received_date: 'fieldInitialPhotosReceivedDate',
  post_occupancy_move_out_date: 'fieldPostOccupancyMoveOutDate',
  cancelled_ab_date: 'fieldCancelledAbDate',
  cancelled_bc_ac_date: 'fieldCancelledBcAcDate',
  buyer_found: 'fieldBuyerFound',
  buyer_deposit_received: 'fieldBuyerDepositReceived',
  title_opened: 'fieldTitleOpened',
  title_ordered: 'fieldTitleOrdered',
  title_ready: 'fieldTitleReady',
  poa_needed: 'fieldPoaNeeded',
  payoff_ordered: 'fieldPayoffOrdered',
  in_foreclosure: 'fieldInForeclosure',
  is_listed: 'fieldIsListed',
  is_jv_deal: 'fieldIsJvDeal',
  ab_emd_deposit_received: 'fieldAbEmdDepositReceived',
  ab_emd_refund: 'fieldAbEmdRefund',
  bc_emd_refund: 'fieldBcEmdRefund',
  cancelled_ab: 'fieldCancelledAb',
  cancelled_bc_ac: 'fieldCancelledBcAc',
  seller_info_sheet_sent: 'fieldSellerInfoSheetSent',
  seller_info_sheet_signed: 'fieldSellerInfoSheetSigned',
  checklist_post_occupancy: 'fieldChecklistPostOccupancy',
  checklist_survey_needed: 'fieldChecklistSurveyNeeded',
  checklist_initial_photos_needed: 'fieldChecklistInitialPhotosNeeded',
  checklist_seller_info_sheet_needed: 'fieldChecklistSellerInfoSheetNeeded',
  checklist_memo: 'fieldChecklistMemo',
  checklist_on_hold: 'fieldChecklistOnHold',
  checklist_closing_extension: 'fieldChecklistClosingExtension',
  checklist_due_diligence_extension: 'fieldChecklistDueDiligenceExtension',
}

function translateDealFields(fields: DealField[], t: AutomationsTranslator): DealField[] {
  return fields.map((field) => ({ ...field, label: t(DEAL_FIELD_LABEL_KEYS[field.key]) }))
}

export function getDealFields(t: AutomationsTranslator): DealField[] {
  return translateDealFields(DEAL_FIELDS, t)
}

export function getDealDateFields(t: AutomationsTranslator): DealField[] {
  return translateDealFields(DEAL_DATE_FIELDS, t)
}
