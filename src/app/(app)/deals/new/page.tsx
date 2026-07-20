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
    { data: investorLlcs },
    { data: splitTypes },
    { data: customFieldDefinitions },
  ] = await Promise.all([
    supabase.from('markets').select('id, name').order('name'),
    supabase.from('property_types').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('purchase_types').select('id, name').order('name'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
    supabase.from('investor_llcs').select('id, name').order('name'),
    supabase.from('split_types').select('id, name').order('name'),
    supabase.from('custom_field_definitions').select('id, name, field_type, options').order('name'),
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
            contract_price_renegotiated_date: '',
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
            renegotiated_bc_date: '',
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
            is_jv_deal: false,
            jv_partner_company_id: '',
            jv_split_type_id: '',
            jv_split_percent: '',
            split_amount: '',
            total_expenses: '',
            total_commissions: '',
            checklist_post_occupancy: false,
            post_occupancy_hold_back_amount: '',
            post_occupancy_move_out_date: '',
            checklist_survey_needed: false,
            survey_ordered_date: '',
            checklist_initial_photos_needed: false,
            initial_photos_ordered_date: '',
            initial_photos_received_date: '',
            checklist_seller_info_sheet_needed: false,
            seller_info_sheet_sent: false,
            seller_info_sheet_signed: false,
            checklist_memo: false,
            checklist_on_hold: false,
            on_hold_date: '',
            onHoldReasonIds: [],
            checklist_closing_extension: false,
            closing_extension_date: '',
            checklist_due_diligence_extension: false,
            due_diligence_extension_date: '',
            ab_emd_deposit_received: false,
            ab_emd_amount: '',
            ab_emd_refund: false,
            bc_emd_refund: false,
            cancelled_ab: false,
            cancelled_ab_date: '',
            cancelled_ab_party: '',
            cancelledAbReasonIds: [],
            cancelled_bc_ac: false,
            cancelled_bc_ac_date: '',
            cancelled_bc_ac_party: '',
            cancelledBcAcReasonIds: [],
            customFields: {},
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
          investorLlcs={investorLlcs ?? []}
          splitTypes={splitTypes ?? []}
          checklistItems={[]}
          checkedChecklistItemIds={[]}
          onHoldReasons={[]}
          cancelledAbReasons={[]}
          cancelledBcAcReasons={[]}
          customFieldDefinitions={customFieldDefinitions ?? []}
        />
      </div>
    </div>
  )
}
