import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ContactForm } from '../contact-form'

export default async function NewContactPage() {
  const profile = await requirePermission('edit_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">New contact</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to create contacts.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [
    { data: contactTypes },
    { data: phoneTypes },
    { data: emailTypes },
    { data: partnerCompanies },
    { data: investorTypes },
    { data: communicationPreferences },
    { data: markets },
    { data: dealTypes },
    { data: propertyTypes },
    { data: realtorIndustries },
    { data: realtorAssetTypes },
    { data: realtorSpecialties },
    { data: states },
    { data: company },
    { data: listingStatuses },
  ] = await Promise.all([
    supabase.from('contact_types').select('id, name').order('name'),
    supabase.from('phone_types').select('id, name').order('name'),
    supabase.from('email_types').select('id, name').order('name'),
    supabase.from('partner_companies').select('id, name').order('name'),
    supabase.from('investor_types').select('id, name').order('name'),
    supabase.from('communication_preferences').select('id, name').order('name'),
    supabase.from('markets').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('property_types').select('id, name').order('name'),
    supabase.from('realtor_industries').select('id, name').order('name'),
    supabase.from('realtor_asset_types').select('id, name').order('name'),
    supabase.from('realtor_specialties').select('id, name').order('name'),
    supabase.from('states').select('id, name').order('name'),
    supabase.from('companies').select('default_country_id').eq('id', profile.company_id ?? '').single(),
    supabase.from('listing_statuses').select('id, name').order('sort_order'),
  ])

  return (
    <div>
      <h1 className="heading-page">New contact</h1>
      <div className="mt-6">
        <ContactForm
          mode="create"
          initialValues={{
            name: '',
            notes: '',
            contactTypeIds: [],
            phones: [],
            emails: [],
            partnerCompanyIds: [],
            last_contacted_at: '',
            investorTypeIds: [],
            communicationPreferenceIds: [],
            marketIdsInterested: [],
            dealTypeIdsInterested: [],
            propertyTypeIdsInterested: [],
            citiesInterested: [],
            zipCodesInterested: [],
            realtorIndustryIds: [],
            realtorAssetTypeIds: [],
            realtorSpecialtyIds: [],
            stateIdsServing: [],
            marketIdsServing: [],
            citiesServing: [],
            zipCodesServing: [],
          }}
          contactTypes={contactTypes ?? []}
          phoneTypes={phoneTypes ?? []}
          emailTypes={emailTypes ?? []}
          partnerCompanies={partnerCompanies ?? []}
          offers={[]}
          meta={{ createdByName: null, createdAt: null, updatedAt: null }}
          investorTypes={investorTypes ?? []}
          communicationPreferences={communicationPreferences ?? []}
          markets={markets ?? []}
          dealTypes={dealTypes ?? []}
          propertyTypes={propertyTypes ?? []}
          realtorIndustries={realtorIndustries ?? []}
          realtorAssetTypes={realtorAssetTypes ?? []}
          realtorSpecialties={realtorSpecialties ?? []}
          states={states ?? []}
          defaultCountryId={company?.default_country_id ?? null}
          listings={[]}
          listingStatuses={listingStatuses ?? []}
        />
      </div>
    </div>
  )
}
