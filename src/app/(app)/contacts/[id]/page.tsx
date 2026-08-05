import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ContactForm } from '../contact-form'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('Contacts')

  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('contactFallbackTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermissionViewOne')}</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [
    { data: contact },
    { data: contactTypes },
    { data: phoneTypes },
    { data: emailTypes },
    { data: partnerCompanies },
    { data: offers },
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
    { data: listings },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select(
        `id, name, notes, created_at, updated_at, last_contacted_at,
         created_by_profile:profiles!contacts_created_by_fkey(name),
         contact_contact_types(contact_type_id),
         contact_phone_numbers(type_id, phone),
         contact_emails(type_id, email),
         contact_partner_companies(partner_company_id),
         contact_investor_types(investor_type_id),
         contact_communication_preferences(communication_preference_id),
         contact_markets_interested(market_id),
         contact_deal_types_interested(deal_type_id),
         contact_property_types_interested(property_type_id),
         contact_cities_interested(cities(id, name)),
         contact_zip_codes_interested(zip_codes(id, code)),
         contact_realtor_industries(realtor_industry_id),
         contact_realtor_asset_types(realtor_asset_type_id),
         contact_realtor_specialties(realtor_specialty_id),
         contact_states_serving(state_id),
         contact_markets_serving(market_id),
         contact_cities_serving(cities(id, name)),
         contact_zip_codes_serving(zip_codes(id, code))`
      )
      .eq('id', id)
      .single(),
    supabase.from('contact_types').select('id, name').order('name'),
    supabase.from('phone_types').select('id, name').order('name'),
    supabase.from('email_types').select('id, name').order('name'),
    supabase.from('partner_companies').select('id, name').order('name'),
    supabase
      .from('offers')
      .select('id, deal_id, offer_price, offer_statuses(name), deals(address)')
      .or(`realtor_contact_id.eq.${id},investor_contact_id.eq.${id}`)
      .order('created_at', { ascending: false }),
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
    supabase
      .from('realtor_listings')
      .select('id, address, list_price, status_id, listing_date, notes, listing_statuses(name)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <div>
      <h1 className="heading-page">{t('editContactTitle')}</h1>
      <div className="mt-6">
        <ContactForm
          mode="edit"
          initialValues={{
            id: contact.id,
            name: contact.name,
            notes: contact.notes ?? '',
            contactTypeIds: contact.contact_contact_types.map((row) => row.contact_type_id),
            phones: contact.contact_phone_numbers.map((row) => ({ type_id: row.type_id ?? '', phone: row.phone })),
            emails: contact.contact_emails.map((row) => ({ type_id: row.type_id ?? '', email: row.email })),
            partnerCompanyIds: contact.contact_partner_companies.map((row) => row.partner_company_id),
            last_contacted_at: contact.last_contacted_at ?? '',
            investorTypeIds: contact.contact_investor_types.map((row) => row.investor_type_id),
            communicationPreferenceIds: contact.contact_communication_preferences.map(
              (row) => row.communication_preference_id
            ),
            marketIdsInterested: contact.contact_markets_interested.map((row) => row.market_id),
            dealTypeIdsInterested: contact.contact_deal_types_interested.map((row) => row.deal_type_id),
            propertyTypeIdsInterested: contact.contact_property_types_interested.map((row) => row.property_type_id),
            citiesInterested: contact.contact_cities_interested
              .map((row) => row.cities)
              .filter((city): city is { id: string; name: string } => Boolean(city)),
            zipCodesInterested: contact.contact_zip_codes_interested
              .map((row) => row.zip_codes)
              .filter((zip): zip is { id: string; code: string } => Boolean(zip))
              .map((zip) => ({ id: zip.id, name: zip.code })),
            realtorIndustryIds: contact.contact_realtor_industries.map((row) => row.realtor_industry_id),
            realtorAssetTypeIds: contact.contact_realtor_asset_types.map((row) => row.realtor_asset_type_id),
            realtorSpecialtyIds: contact.contact_realtor_specialties.map((row) => row.realtor_specialty_id),
            stateIdsServing: contact.contact_states_serving.map((row) => row.state_id),
            marketIdsServing: contact.contact_markets_serving.map((row) => row.market_id),
            citiesServing: contact.contact_cities_serving
              .map((row) => row.cities)
              .filter((city): city is { id: string; name: string } => Boolean(city)),
            zipCodesServing: contact.contact_zip_codes_serving
              .map((row) => row.zip_codes)
              .filter((zip): zip is { id: string; code: string } => Boolean(zip))
              .map((zip) => ({ id: zip.id, name: zip.code })),
          }}
          contactTypes={contactTypes ?? []}
          phoneTypes={phoneTypes ?? []}
          emailTypes={emailTypes ?? []}
          partnerCompanies={partnerCompanies ?? []}
          offers={(offers ?? []).map((offer) => ({
            id: offer.id,
            dealId: offer.deal_id,
            dealAddress: offer.deals?.address ?? t('unknownDeal'),
            offerPrice: offer.offer_price,
            statusName: offer.offer_statuses?.name ?? null,
          }))}
          meta={{
            createdByName: contact.created_by_profile?.name ?? null,
            createdAt: contact.created_at,
            updatedAt: contact.updated_at,
          }}
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
          listings={(listings ?? []).map((listing) => ({
            id: listing.id,
            address: listing.address,
            list_price: listing.list_price,
            status_id: listing.status_id,
            statusName: listing.listing_statuses?.name ?? null,
            listing_date: listing.listing_date,
            notes: listing.notes,
          }))}
          listingStatuses={listingStatuses ?? []}
        />
      </div>
    </div>
  )
}
