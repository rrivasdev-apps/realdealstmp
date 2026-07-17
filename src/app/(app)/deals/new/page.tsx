import { filterContactsByType } from '@/lib/contacts/by-type'
import { createClient } from '@/lib/supabase/server'

import { DealForm } from '../deal-form'

export default async function NewDealPage() {
  const supabase = await createClient()
  const [
    { data: markets },
    { data: propertyTypes },
    { data: dealTypes },
    { data: leadSources },
    { data: purchaseTypes },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('markets').select('id, name').order('name'),
    supabase.from('property_types').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('purchase_types').select('id, name').order('name'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
  ])

  const titleCompanyContacts = filterContactsByType(contacts ?? [], 'Title Company')
  const mortgageCompanyContacts = filterContactsByType(contacts ?? [], 'Mortgage Company')
  const sellerContacts = filterContactsByType(contacts ?? [], 'Seller')

  return (
    <div>
      <h1 className="text-xl font-semibold">New deal</h1>
      <div className="mt-6">
        <DealForm
          mode="create"
          initialValues={{
            address: '',
            market_id: '',
            property_type_id: '',
            deal_type_id: '',
            lead_source_id: '',
            status_id: '',
            contract_price: '',
            contract_date: '',
            closing_date: '',
            due_diligence_expiration: '',
            actual_closing_date: '',
            projected_sales_price: '',
            buyer_found: false,
            buyer_contract_price: '',
            buyer_contract_date: '',
            bc_contract_closing_date: '',
            buyer_inspection_deadline: '',
            renegotiated_bc_price: '',
            buyer_deposit_received: false,
            buyer_deposit_amount: '',
            apn: '',
            legal_description: '',
            lot_size_acres: '',
            ab_purchase_type_id: '',
            title_opened: false,
            title_ordered: false,
            title_ready: false,
            poa_needed: false,
            title_company_contact_id: '',
            mortgage_company_contact_id: '',
            payoff_ordered: false,
            mortgage_principal_balance: '',
            mortgage_rate: '',
            mortgage_term: '',
            in_foreclosure: false,
            foreclosure_date: '',
            total_payoff_amount: '',
            seller_contact_id: '',
            is_listed: false,
          }}
          markets={markets ?? []}
          propertyTypes={propertyTypes ?? []}
          dealTypes={dealTypes ?? []}
          leadSources={leadSources ?? []}
          dealStatuses={[]}
          purchaseTypes={purchaseTypes ?? []}
          titleCompanyContacts={titleCompanyContacts}
          mortgageCompanyContacts={mortgageCompanyContacts}
          sellerContacts={sellerContacts}
        />
      </div>
    </div>
  )
}
