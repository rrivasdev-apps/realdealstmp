import Link from 'next/link'
import { notFound } from 'next/navigation'

import { filterContactsByType } from '@/lib/contacts/by-type'
import { createClient } from '@/lib/supabase/server'

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
  ])

  if (!deal) {
    notFound()
  }

  const titleCompanyContacts = filterContactsByType(contacts ?? [], 'Title Company')
  const mortgageCompanyContacts = filterContactsByType(contacts ?? [], 'Mortgage Company')
  const sellerContacts = filterContactsByType(contacts ?? [], 'Seller')

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
        />
      </div>

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
    </div>
  )
}
