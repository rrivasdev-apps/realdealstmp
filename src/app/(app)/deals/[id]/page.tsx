import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { DealForm } from '../deal-form'

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: deal }, { data: markets }, { data: propertyTypes }, { data: dealTypes }, { data: leadSources }, { data: dealStatuses }] =
    await Promise.all([
      supabase.from('deals').select('*').eq('id', id).single(),
      supabase.from('markets').select('id, name').order('name'),
      supabase.from('property_types').select('id, name').order('name'),
      supabase.from('deal_types').select('id, name').order('name'),
      supabase.from('lead_sources').select('id, name').order('name'),
      supabase.from('deal_statuses').select('id, name').order('sort_order'),
    ])

  if (!deal) {
    notFound()
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
            contract_date: deal.contract_date ?? '',
            closing_date: deal.closing_date ?? '',
            due_diligence_expiration: deal.due_diligence_expiration ?? '',
            actual_closing_date: deal.actual_closing_date ?? '',
            projected_sales_price: deal.projected_sales_price?.toString() ?? '',
          }}
          markets={markets ?? []}
          propertyTypes={propertyTypes ?? []}
          dealTypes={dealTypes ?? []}
          leadSources={leadSources ?? []}
          dealStatuses={dealStatuses ?? []}
        />
      </div>
    </div>
  )
}
