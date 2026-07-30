import { NextResponse } from 'next/server'

import { insertContactJoin } from '@/lib/contacts/sync-joins'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type PhoneInput = { type_id: string; phone: string }
type EmailInput = { type_id: string; email: string }

export async function POST(request: Request) {
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const contactTypeIds: string[] = Array.isArray(body.contactTypeIds) ? body.contactTypeIds : []
  const phones: PhoneInput[] = Array.isArray(body.phones) ? body.phones : []
  const emails: EmailInput[] = Array.isArray(body.emails) ? body.emails : []
  const partnerCompanyIds: string[] = Array.isArray(body.partnerCompanyIds) ? body.partnerCompanyIds : []
  const investorTypeIds: string[] = Array.isArray(body.investorTypeIds) ? body.investorTypeIds : []
  const communicationPreferenceIds: string[] = Array.isArray(body.communicationPreferenceIds)
    ? body.communicationPreferenceIds
    : []
  const marketIdsInterested: string[] = Array.isArray(body.marketIdsInterested) ? body.marketIdsInterested : []
  const dealTypeIdsInterested: string[] = Array.isArray(body.dealTypeIdsInterested) ? body.dealTypeIdsInterested : []
  const propertyTypeIdsInterested: string[] = Array.isArray(body.propertyTypeIdsInterested)
    ? body.propertyTypeIdsInterested
    : []
  const cityIdsInterested: string[] = Array.isArray(body.cityIdsInterested) ? body.cityIdsInterested : []
  const zipCodeIdsInterested: string[] = Array.isArray(body.zipCodeIdsInterested) ? body.zipCodeIdsInterested : []
  const realtorIndustryIds: string[] = Array.isArray(body.realtorIndustryIds) ? body.realtorIndustryIds : []
  const realtorAssetTypeIds: string[] = Array.isArray(body.realtorAssetTypeIds) ? body.realtorAssetTypeIds : []
  const realtorSpecialtyIds: string[] = Array.isArray(body.realtorSpecialtyIds) ? body.realtorSpecialtyIds : []
  const stateIdsServing: string[] = Array.isArray(body.stateIdsServing) ? body.stateIdsServing : []
  const marketIdsServing: string[] = Array.isArray(body.marketIdsServing) ? body.marketIdsServing : []
  const cityIdsServing: string[] = Array.isArray(body.cityIdsServing) ? body.cityIdsServing : []
  const zipCodeIdsServing: string[] = Array.isArray(body.zipCodeIdsServing) ? body.zipCodeIdsServing : []

  const supabase = await createClient()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ company_id: profile.company_id, name, notes: body.notes || null, created_by: profile.id })
    .select('id')
    .single()

  if (error || !contact) {
    return NextResponse.json({ error: error?.message ?? 'Could not create contact.' }, { status: 400 })
  }

  await Promise.all([
    contactTypeIds.length
      ? supabase
          .from('contact_contact_types')
          .insert(contactTypeIds.map((contact_type_id) => ({ contact_id: contact.id, contact_type_id })))
      : Promise.resolve(),
    phones.length
      ? supabase
          .from('contact_phone_numbers')
          .insert(phones.map((row) => ({ contact_id: contact.id, type_id: row.type_id, phone: row.phone })))
      : Promise.resolve(),
    emails.length
      ? supabase
          .from('contact_emails')
          .insert(emails.map((row) => ({ contact_id: contact.id, type_id: row.type_id, email: row.email })))
      : Promise.resolve(),
    insertContactJoin(supabase, 'contact_partner_companies', contact.id, 'partner_company_id', partnerCompanyIds),
    insertContactJoin(supabase, 'contact_investor_types', contact.id, 'investor_type_id', investorTypeIds),
    insertContactJoin(
      supabase,
      'contact_communication_preferences',
      contact.id,
      'communication_preference_id',
      communicationPreferenceIds
    ),
    insertContactJoin(supabase, 'contact_markets_interested', contact.id, 'market_id', marketIdsInterested),
    insertContactJoin(supabase, 'contact_cities_interested', contact.id, 'city_id', cityIdsInterested),
    insertContactJoin(supabase, 'contact_zip_codes_interested', contact.id, 'zip_code_id', zipCodeIdsInterested),
    insertContactJoin(supabase, 'contact_deal_types_interested', contact.id, 'deal_type_id', dealTypeIdsInterested),
    insertContactJoin(
      supabase,
      'contact_property_types_interested',
      contact.id,
      'property_type_id',
      propertyTypeIdsInterested
    ),
    insertContactJoin(supabase, 'contact_realtor_industries', contact.id, 'realtor_industry_id', realtorIndustryIds),
    insertContactJoin(
      supabase,
      'contact_realtor_asset_types',
      contact.id,
      'realtor_asset_type_id',
      realtorAssetTypeIds
    ),
    insertContactJoin(
      supabase,
      'contact_realtor_specialties',
      contact.id,
      'realtor_specialty_id',
      realtorSpecialtyIds
    ),
    insertContactJoin(supabase, 'contact_states_serving', contact.id, 'state_id', stateIdsServing),
    insertContactJoin(supabase, 'contact_markets_serving', contact.id, 'market_id', marketIdsServing),
    insertContactJoin(supabase, 'contact_cities_serving', contact.id, 'city_id', cityIdsServing),
    insertContactJoin(supabase, 'contact_zip_codes_serving', contact.id, 'zip_code_id', zipCodeIdsServing),
  ])

  return NextResponse.json({ id: contact.id })
}
