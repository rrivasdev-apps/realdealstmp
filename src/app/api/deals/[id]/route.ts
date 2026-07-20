import { NextResponse } from 'next/server'

import { syncCommissionPaymentsForDeal } from '@/lib/deals/commissions'
import { buildCustomFieldsForSave } from '@/lib/deals/custom-fields'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Explicit whitelist -- deliberately excludes original_contract_price,
// original_closing_date, original_due_diligence_date and
// original_projected_sales_price. Those are set once at intake (see
// /api/deals POST) and never touched again; the protect_original_deal_values
// DB trigger backstops this even if a future route forgets it. That same
// trigger also locks buyer_contract_price after its first non-null write,
// so it's safe to pass through here unconditionally too.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('deals').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const customFields = await buildCustomFieldsForSave(supabase, profile.company_id, body.custom_fields)

  const { error } = await supabase
    .from('deals')
    .update({
      address,
      market_id: body.market_id || null,
      property_type_id: body.property_type_id || null,
      deal_type_id: body.deal_type_id || null,
      lead_source_id: body.lead_source_id || null,
      status_id: body.status_id || undefined,
      contract_price: body.contract_price ?? null,
      contract_date: body.contract_date || null,
      closing_date: body.closing_date || null,
      due_diligence_expiration: body.due_diligence_expiration || null,
      actual_closing_date: body.actual_closing_date || null,
      projected_sales_price: body.projected_sales_price ?? null,
      buyer_found: Boolean(body.buyer_found),
      buyer_contract_price: body.buyer_contract_price ?? null,
      buyer_contract_date: body.buyer_contract_date || null,
      bc_contract_closing_date: body.bc_contract_closing_date || null,
      buyer_inspection_deadline: body.buyer_inspection_deadline || null,
      renegotiated_bc_price: body.renegotiated_bc_price ?? null,
      buyer_deposit_received: Boolean(body.buyer_deposit_received),
      buyer_deposit_amount: body.buyer_deposit_amount ?? null,
      apn: body.apn || null,
      legal_description: body.legal_description || null,
      lot_size_acres: body.lot_size_acres ?? null,
      ab_purchase_type_id: body.ab_purchase_type_id || null,
      title_opened: Boolean(body.title_opened),
      title_ordered: Boolean(body.title_ordered),
      title_ready: Boolean(body.title_ready),
      poa_needed: Boolean(body.poa_needed),
      title_company_contact_id: body.title_company_contact_id || null,
      mortgage_company_contact_id: body.mortgage_company_contact_id || null,
      payoff_ordered: Boolean(body.payoff_ordered),
      mortgage_principal_balance: body.mortgage_principal_balance ?? null,
      mortgage_rate: body.mortgage_rate ?? null,
      mortgage_term: body.mortgage_term ?? null,
      in_foreclosure: Boolean(body.in_foreclosure),
      foreclosure_date: body.foreclosure_date || null,
      total_payoff_amount: body.total_payoff_amount ?? null,
      seller_contact_id: body.seller_contact_id || null,
      is_listed: Boolean(body.is_listed),
      is_jv_deal: Boolean(body.is_jv_deal),
      jv_partner_company_id: body.jv_partner_company_id || null,
      jv_split_type_id: body.jv_split_type_id || null,
      jv_split_percent: body.jv_split_percent ?? null,
      split_amount: body.split_amount ?? null,
      total_expenses: body.total_expenses ?? null,
      total_commissions: body.total_commissions ?? null,
      checklist_post_occupancy: Boolean(body.checklist_post_occupancy),
      post_occupancy_hold_back_amount: body.post_occupancy_hold_back_amount ?? null,
      post_occupancy_move_out_date: body.post_occupancy_move_out_date || null,
      checklist_survey_needed: Boolean(body.checklist_survey_needed),
      survey_ordered_date: body.survey_ordered_date || null,
      checklist_initial_photos_needed: Boolean(body.checklist_initial_photos_needed),
      initial_photos_ordered_date: body.initial_photos_ordered_date || null,
      initial_photos_received_date: body.initial_photos_received_date || null,
      checklist_seller_info_sheet_needed: Boolean(body.checklist_seller_info_sheet_needed),
      seller_info_sheet_sent: Boolean(body.seller_info_sheet_sent),
      seller_info_sheet_signed: Boolean(body.seller_info_sheet_signed),
      checklist_memo: Boolean(body.checklist_memo),
      checklist_on_hold: Boolean(body.checklist_on_hold),
      on_hold_date: body.on_hold_date || null,
      checklist_closing_extension: Boolean(body.checklist_closing_extension),
      closing_extension_date: body.closing_extension_date || null,
      checklist_due_diligence_extension: Boolean(body.checklist_due_diligence_extension),
      due_diligence_extension_date: body.due_diligence_extension_date || null,
      ab_emd_deposit_received: Boolean(body.ab_emd_deposit_received),
      ab_emd_amount: body.ab_emd_amount ?? null,
      ab_emd_refund: Boolean(body.ab_emd_refund),
      bc_emd_refund: Boolean(body.bc_emd_refund),
      cancelled_ab: Boolean(body.cancelled_ab),
      cancelled_ab_date: body.cancelled_ab_date || null,
      cancelled_ab_party: body.cancelled_ab_party || null,
      cancelled_bc_ac: Boolean(body.cancelled_bc_ac),
      cancelled_bc_ac_date: body.cancelled_bc_ac_date || null,
      cancelled_bc_ac_party: body.cancelled_bc_ac_party || null,
      custom_fields: customFields,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const onHoldReasonIds: string[] = Array.isArray(body.onHoldReasonIds) ? body.onHoldReasonIds : []
  const cancelledAbReasonIds: string[] = Array.isArray(body.cancelledAbReasonIds) ? body.cancelledAbReasonIds : []
  const cancelledBcAcReasonIds: string[] = Array.isArray(body.cancelledBcAcReasonIds)
    ? body.cancelledBcAcReasonIds
    : []

  // Same "delete all, insert selected" sync as /api/contacts/[id] for its
  // multi-select join tables.
  await Promise.all([
    supabase.from('deal_on_hold_reasons').delete().eq('deal_id', id),
    supabase.from('deal_cancelled_ab_reasons').delete().eq('deal_id', id),
    supabase.from('deal_cancelled_bc_ac_reasons').delete().eq('deal_id', id),
  ])

  await Promise.all([
    onHoldReasonIds.length
      ? supabase
          .from('deal_on_hold_reasons')
          .insert(onHoldReasonIds.map((on_hold_reason_id) => ({ deal_id: id, on_hold_reason_id })))
      : Promise.resolve(),
    cancelledAbReasonIds.length
      ? supabase
          .from('deal_cancelled_ab_reasons')
          .insert(cancelledAbReasonIds.map((cancelled_ab_reason_id) => ({ deal_id: id, cancelled_ab_reason_id })))
      : Promise.resolve(),
    cancelledBcAcReasonIds.length
      ? supabase
          .from('deal_cancelled_bc_ac_reasons')
          .insert(
            cancelledBcAcReasonIds.map((cancelled_bc_ac_reason_id) => ({
              deal_id: id,
              cancelled_bc_ac_reason_id,
            }))
          )
      : Promise.resolve(),
  ])

  // Refreshes every open commission payment on this deal against whatever
  // the numbers are now -- covers both a price renegotiation (pending
  // payments get a fresh amount) and the deal becoming Closed & funded
  // (created payments flip to pending). See lib/deals/commissions.ts.
  await syncCommissionPaymentsForDeal(supabase, id)

  return NextResponse.json({ id })
}
