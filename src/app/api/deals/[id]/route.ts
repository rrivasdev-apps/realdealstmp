import { NextResponse } from 'next/server'

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
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id })
}
