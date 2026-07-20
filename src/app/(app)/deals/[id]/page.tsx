import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DealSection } from '@/components/deal-section'
import { filterContactsByType } from '@/lib/contacts/by-type'
import { createClient } from '@/lib/supabase/server'

import { DealEmployeeForm } from '../deal-employee-form'
import { DealForm } from '../deal-form'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: deal },
    { data: markets },
    { data: propertyTypes },
    { data: dealTypes },
    { data: leadSources },
    { data: dealStatuses },
    { data: offers },
    { data: purchaseTypes },
    { data: contacts },
    { data: investorLlcs },
    { data: splitTypes },
    { data: showings },
    { data: dealEmployees },
    { data: companyProfiles },
    { data: payments },
    { data: checklistItems },
    { data: checkedChecklistItems },
    { data: onHoldReasons },
    { data: cancelledAbReasons },
    { data: cancelledBcAcReasons },
    { data: checkedOnHoldReasons },
    { data: checkedCancelledAbReasons },
    { data: checkedCancelledBcAcReasons },
    { data: customFieldDefinitions },
  ] = await Promise.all([
    supabase.from('deals').select('*').eq('id', id).single(),
    supabase.from('markets').select('id, name').order('name'),
    supabase.from('property_types').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('deal_statuses').select('id, name').order('sort_order'),
    supabase
      .from('offers')
      .select('id, offer_price, offer_date, offer_statuses(name), purchase_types(name)')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('purchase_types').select('id, name').order('name'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
    supabase.from('investor_llcs').select('id, name').order('name'),
    supabase.from('split_types').select('id, name').order('name'),
    supabase
      .from('showings')
      .select('id, showing_date, showing_statuses(name), buyer:contacts!showings_buyer_contact_id_fkey(name)')
      .eq('deal_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('deal_employees').select('id, profile_id, profiles(name)').eq('deal_id', id),
    supabase.from('profiles').select('id, name').order('name'),
    supabase
      .from('payments')
      .select('id, profile_id, amount, status, commission_types(name, category)')
      .eq('deal_id', id)
      .eq('type', 'commission'),
    supabase.from('checklist_items').select('id, name').order('name'),
    supabase.from('deal_checklist_items').select('checklist_item_id').eq('deal_id', id),
    supabase.from('on_hold_reasons').select('id, name').order('name'),
    supabase.from('cancelled_ab_reasons').select('id, name').order('name'),
    supabase.from('cancelled_bc_ac_reasons').select('id, name').order('name'),
    supabase.from('deal_on_hold_reasons').select('on_hold_reason_id').eq('deal_id', id),
    supabase.from('deal_cancelled_ab_reasons').select('cancelled_ab_reason_id').eq('deal_id', id),
    supabase.from('deal_cancelled_bc_ac_reasons').select('cancelled_bc_ac_reason_id').eq('deal_id', id),
    supabase.from('custom_field_definitions').select('id, name, field_type, options').order('name'),
  ])

  if (!deal) {
    notFound()
  }

  const customFieldsRaw = (deal.custom_fields ?? {}) as Record<string, unknown>
  const customFields: Record<string, string | boolean> = {}
  for (const [key, value] of Object.entries(customFieldsRaw)) {
    customFields[key] = typeof value === 'boolean' ? value : String(value)
  }

  const titleCompanyContacts = filterContactsByType(contacts ?? [], 'Title Company')
  const mortgageCompanyContacts = filterContactsByType(contacts ?? [], 'Mortgage Company')
  const sellerContacts = filterContactsByType(contacts ?? [], 'Seller')

  const assignedProfileIds = new Set((dealEmployees ?? []).map((row) => row.profile_id))
  const availableProfiles = (companyProfiles ?? []).filter((p) => !assignedProfileIds.has(p.id))

  type Payment = NonNullable<typeof payments>[number]
  const paymentsByProfile = new Map<string, Payment[]>()
  for (const payment of payments ?? []) {
    const existing = paymentsByProfile.get(payment.profile_id ?? '') ?? []
    existing.push(payment)
    paymentsByProfile.set(payment.profile_id ?? '', existing)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit deal</h1>
      <div className="mt-6">
        <DealForm
          mode="edit"
          initialValues={{
            id: deal.id,
            address: deal.address ?? '',
            market_id: deal.market_id ?? '',
            property_type_id: deal.property_type_id ?? '',
            deal_type_id: deal.deal_type_id ?? '',
            lead_source_id: deal.lead_source_id ?? '',
            status_id: deal.status_id ?? '',
            contract_price: deal.contract_price?.toString() ?? '',
            contract_price_renegotiated_date: deal.contract_price_renegotiated_date ?? '',
            contract_date: deal.contract_date ?? '',
            closing_date: deal.closing_date ?? '',
            due_diligence_expiration: deal.due_diligence_expiration ?? '',
            actual_closing_date: deal.actual_closing_date ?? '',
            projected_sales_price: deal.projected_sales_price?.toString() ?? '',
            buyer_found: deal.buyer_found ?? false,
            buyer_contract_price: deal.buyer_contract_price?.toString() ?? '',
            buyer_contract_date: deal.buyer_contract_date ?? '',
            bc_contract_closing_date: deal.bc_contract_closing_date ?? '',
            buyer_inspection_deadline: deal.buyer_inspection_deadline ?? '',
            renegotiated_bc_price: deal.renegotiated_bc_price?.toString() ?? '',
            renegotiated_bc_date: deal.renegotiated_bc_date ?? '',
            buyer_deposit_received: deal.buyer_deposit_received ?? false,
            buyer_deposit_amount: deal.buyer_deposit_amount?.toString() ?? '',
            apn: deal.apn ?? '',
            legal_description: deal.legal_description ?? '',
            lot_size_acres: deal.lot_size_acres?.toString() ?? '',
            ab_purchase_type_id: deal.ab_purchase_type_id ?? '',
            title_opened: deal.title_opened ?? false,
            title_ordered: deal.title_ordered ?? false,
            title_ready: deal.title_ready ?? false,
            poa_needed: deal.poa_needed ?? false,
            title_company_contact_id: deal.title_company_contact_id ?? '',
            mortgage_company_contact_id: deal.mortgage_company_contact_id ?? '',
            payoff_ordered: deal.payoff_ordered ?? false,
            mortgage_principal_balance: deal.mortgage_principal_balance?.toString() ?? '',
            mortgage_rate: deal.mortgage_rate?.toString() ?? '',
            mortgage_term: deal.mortgage_term?.toString() ?? '',
            in_foreclosure: deal.in_foreclosure ?? false,
            foreclosure_date: deal.foreclosure_date ?? '',
            total_payoff_amount: deal.total_payoff_amount?.toString() ?? '',
            seller_contact_id: deal.seller_contact_id ?? '',
            is_listed: deal.is_listed ?? false,
            is_jv_deal: deal.is_jv_deal ?? false,
            jv_partner_company_id: deal.jv_partner_company_id ?? '',
            jv_split_type_id: deal.jv_split_type_id ?? '',
            jv_split_percent: deal.jv_split_percent?.toString() ?? '',
            split_amount: deal.split_amount?.toString() ?? '',
            total_expenses: deal.total_expenses?.toString() ?? '',
            total_commissions: deal.total_commissions?.toString() ?? '',
            checklist_post_occupancy: deal.checklist_post_occupancy ?? false,
            post_occupancy_hold_back_amount: deal.post_occupancy_hold_back_amount?.toString() ?? '',
            post_occupancy_move_out_date: deal.post_occupancy_move_out_date ?? '',
            checklist_survey_needed: deal.checklist_survey_needed ?? false,
            survey_ordered_date: deal.survey_ordered_date ?? '',
            checklist_initial_photos_needed: deal.checklist_initial_photos_needed ?? false,
            initial_photos_ordered_date: deal.initial_photos_ordered_date ?? '',
            initial_photos_received_date: deal.initial_photos_received_date ?? '',
            checklist_seller_info_sheet_needed: deal.checklist_seller_info_sheet_needed ?? false,
            seller_info_sheet_sent: deal.seller_info_sheet_sent ?? false,
            seller_info_sheet_signed: deal.seller_info_sheet_signed ?? false,
            checklist_memo: deal.checklist_memo ?? false,
            checklist_on_hold: deal.checklist_on_hold ?? false,
            on_hold_date: deal.on_hold_date ?? '',
            onHoldReasonIds: (checkedOnHoldReasons ?? []).map((row) => row.on_hold_reason_id),
            checklist_closing_extension: deal.checklist_closing_extension ?? false,
            closing_extension_date: deal.closing_extension_date ?? '',
            checklist_due_diligence_extension: deal.checklist_due_diligence_extension ?? false,
            due_diligence_extension_date: deal.due_diligence_extension_date ?? '',
            ab_emd_deposit_received: deal.ab_emd_deposit_received ?? false,
            ab_emd_amount: deal.ab_emd_amount?.toString() ?? '',
            ab_emd_refund: deal.ab_emd_refund ?? false,
            bc_emd_refund: deal.bc_emd_refund ?? false,
            cancelled_ab: deal.cancelled_ab ?? false,
            cancelled_ab_date: deal.cancelled_ab_date ?? '',
            cancelled_ab_party: deal.cancelled_ab_party ?? '',
            cancelledAbReasonIds: (checkedCancelledAbReasons ?? []).map((row) => row.cancelled_ab_reason_id),
            cancelled_bc_ac: deal.cancelled_bc_ac ?? false,
            cancelled_bc_ac_date: deal.cancelled_bc_ac_date ?? '',
            cancelled_bc_ac_party: deal.cancelled_bc_ac_party ?? '',
            cancelledBcAcReasonIds: (checkedCancelledBcAcReasons ?? []).map(
              (row) => row.cancelled_bc_ac_reason_id
            ),
            customFields,
          }}
          markets={markets ?? []}
          propertyTypes={propertyTypes ?? []}
          dealTypes={dealTypes ?? []}
          leadSources={leadSources ?? []}
          dealStatuses={dealStatuses ?? []}
          purchaseTypes={purchaseTypes ?? []}
          titleCompanyContacts={titleCompanyContacts}
          mortgageCompanyContacts={mortgageCompanyContacts}
          sellerContacts={sellerContacts}
          investorLlcs={investorLlcs ?? []}
          splitTypes={splitTypes ?? []}
          checklistItems={checklistItems ?? []}
          checkedChecklistItemIds={(checkedChecklistItems ?? []).map((row) => row.checklist_item_id)}
          onHoldReasons={onHoldReasons ?? []}
          cancelledAbReasons={cancelledAbReasons ?? []}
          cancelledBcAcReasons={cancelledBcAcReasons ?? []}
          customFieldDefinitions={customFieldDefinitions ?? []}
        />
      </div>

      <DealSection id="jv-dispo">
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Offers</h2>
          <Link href={`/deals/${id}/offers/new`} className="text-xs underline">
            + Add offer
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
          {(offers ?? []).map((offer) => (
            <li key={offer.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link
                  href={`/deals/${id}/offers/${offer.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {offer.offer_price != null ? currency.format(offer.offer_price) : 'No price set'}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {[offer.offer_date, offer.purchase_types?.name].filter(Boolean).join(' · ') || 'No details yet'}
                </div>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                {offer.offer_statuses?.name ?? 'Unknown'}
              </span>
            </li>
          ))}
          {(offers ?? []).length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No offers yet.</li>
          )}
        </ul>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Showings</h2>
          <Link href={`/deals/${id}/showings/new`} className="text-xs underline">
            + Add showing
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
          {(showings ?? []).map((showing) => (
            <li key={showing.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link
                  href={`/deals/${id}/showings/${showing.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {showing.showing_date ?? 'No date set'}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {showing.buyer?.name ?? 'No buyer contact'}
                </div>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
                {showing.showing_statuses?.name ?? 'Unknown'}
              </span>
            </li>
          ))}
          {(showings ?? []).length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No showings yet.</li>
          )}
        </ul>
      </div>
      </DealSection>

      <DealSection id="employees">
      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">Employees</h2>
        <div className="mt-2">
          <DealEmployeeForm dealId={id} availableProfiles={availableProfiles} />
        </div>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
          {(dealEmployees ?? []).map((dealEmployee) => {
            const employeePayments = paymentsByProfile.get(dealEmployee.profile_id) ?? []
            return (
              <li key={dealEmployee.id} className="px-4 py-3">
                <div className="text-sm font-medium">{dealEmployee.profiles?.name ?? 'Unknown'}</div>
                {employeePayments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No commissions apply.</div>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {employeePayments.map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{payment.commission_types?.name}</span>
                        <span className="flex items-center gap-2">
                          <span>{payment.amount != null ? currency.format(payment.amount) : '—'}</span>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{payment.status}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
          {(dealEmployees ?? []).length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No employees added yet.</li>
          )}
        </ul>
      </div>
      </DealSection>
    </div>
  )
}
