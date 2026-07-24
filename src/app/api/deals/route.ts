import { NextResponse } from 'next/server'

import { evaluateTriggersForDealCreated } from '@/lib/automations/runtime'
import { buildCustomFieldsForSave } from '@/lib/deals/custom-fields'
import { addDays } from '@/lib/deals/dates'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: forSaleStatus } = await supabase
    .from('deal_statuses')
    .select('id')
    .eq('name', 'For Sale')
    .single()

  if (!forSaleStatus) {
    return NextResponse.json({ error: 'Deal statuses are not set up.' }, { status: 500 })
  }

  const customFields = await buildCustomFieldsForSave(supabase, profile.company_id, body.custom_fields)

  // The quick-create wizard sends a day count instead of a date -- the "current"
  // value the client computes and sends must never be trusted directly (see
  // CLAUDE.md's renegotiation rule), so the expiration date is derived here.
  const dueDiligenceDays = Number(body.due_diligence_days)
  const dueDiligenceExpiration =
    Number.isFinite(dueDiligenceDays) && body.contract_date
      ? addDays(body.contract_date, dueDiligenceDays)
      : body.due_diligence_expiration || null

  // original_* is set once here, from the same values the client submitted
  // for the current fields -- never touched again after this insert (see
  // the protect_original_deal_values trigger).
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      company_id: profile.company_id,
      address,
      city: body.city || null,
      state: body.state || null,
      zip_code: body.zip_code || null,
      market_id: body.market_id || null,
      property_type_id: body.property_type_id || null,
      deal_type_id: body.deal_type_id || null,
      lead_source_id: body.lead_source_id || null,
      status_id: forSaleStatus.id,
      contract_price: body.contract_price ?? null,
      original_contract_price: body.contract_price ?? null,
      contract_date: body.contract_date || null,
      closing_date: body.closing_date || null,
      original_closing_date: body.closing_date || null,
      due_diligence_expiration: dueDiligenceExpiration,
      original_due_diligence_date: dueDiligenceExpiration,
      projected_sales_price: body.projected_sales_price ?? null,
      original_projected_sales_price: body.projected_sales_price ?? null,
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
      custom_fields: customFields,
    })
    // BC contract fields aren't set here -- there's no buyer yet at intake.
    // They're added later via PATCH once a buyer is found.
    .select('id, deal_type_id')
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: error?.message ?? 'Could not create deal.' }, { status: 400 })
  }

  await evaluateTriggersForDealCreated(supabase, {
    id: deal.id,
    company_id: profile.company_id,
    deal_type_id: deal.deal_type_id,
  })

  return NextResponse.json({ id: deal.id })
}
