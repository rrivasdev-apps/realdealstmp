import { createClient } from '@/lib/supabase/server'

import { DealForm } from '../deal-form'

export default async function NewDealPage() {
  const supabase = await createClient()
  const [{ data: markets }, { data: propertyTypes }, { data: dealTypes }, { data: leadSources }] =
    await Promise.all([
      supabase.from('markets').select('id, name').order('name'),
      supabase.from('property_types').select('id, name').order('name'),
      supabase.from('deal_types').select('id, name').order('name'),
      supabase.from('lead_sources').select('id, name').order('name'),
    ])

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
          }}
          markets={markets ?? []}
          propertyTypes={propertyTypes ?? []}
          dealTypes={dealTypes ?? []}
          leadSources={leadSources ?? []}
          dealStatuses={[]}
        />
      </div>
    </div>
  )
}
