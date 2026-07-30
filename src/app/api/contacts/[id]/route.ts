import { NextResponse } from 'next/server'

import { syncContactJoin } from '@/lib/contacts/sync-joins'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type PhoneInput = { type_id: string; phone: string }
type EmailInput = { type_id: string; email: string }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('contacts').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

  const { error } = await supabase
    .from('contacts')
    .update({
      name,
      notes: body.notes || null,
      last_contacted_at: body.last_contacted_at || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await Promise.all([
    supabase.from('contact_contact_types').delete().eq('contact_id', id),
    supabase.from('contact_phone_numbers').delete().eq('contact_id', id),
    supabase.from('contact_emails').delete().eq('contact_id', id),
  ])

  await Promise.all([
    contactTypeIds.length
      ? supabase
          .from('contact_contact_types')
          .insert(contactTypeIds.map((contact_type_id) => ({ contact_id: id, contact_type_id })))
      : Promise.resolve(),
    phones.length
      ? supabase
          .from('contact_phone_numbers')
          .insert(phones.map((row) => ({ contact_id: id, type_id: row.type_id, phone: row.phone })))
      : Promise.resolve(),
    emails.length
      ? supabase
          .from('contact_emails')
          .insert(emails.map((row) => ({ contact_id: id, type_id: row.type_id, email: row.email })))
      : Promise.resolve(),
    syncContactJoin(supabase, 'contact_partner_companies', id, 'partner_company_id', partnerCompanyIds),
    syncContactJoin(supabase, 'contact_investor_types', id, 'investor_type_id', investorTypeIds),
    syncContactJoin(
      supabase,
      'contact_communication_preferences',
      id,
      'communication_preference_id',
      communicationPreferenceIds
    ),
    syncContactJoin(supabase, 'contact_markets_interested', id, 'market_id', marketIdsInterested),
    syncContactJoin(supabase, 'contact_cities_interested', id, 'city_id', cityIdsInterested),
    syncContactJoin(supabase, 'contact_zip_codes_interested', id, 'zip_code_id', zipCodeIdsInterested),
    syncContactJoin(supabase, 'contact_deal_types_interested', id, 'deal_type_id', dealTypeIdsInterested),
    syncContactJoin(
      supabase,
      'contact_property_types_interested',
      id,
      'property_type_id',
      propertyTypeIdsInterested
    ),
    syncContactJoin(supabase, 'contact_realtor_industries', id, 'realtor_industry_id', realtorIndustryIds),
    syncContactJoin(supabase, 'contact_realtor_asset_types', id, 'realtor_asset_type_id', realtorAssetTypeIds),
    syncContactJoin(supabase, 'contact_realtor_specialties', id, 'realtor_specialty_id', realtorSpecialtyIds),
    syncContactJoin(supabase, 'contact_states_serving', id, 'state_id', stateIdsServing),
    syncContactJoin(supabase, 'contact_markets_serving', id, 'market_id', marketIdsServing),
    syncContactJoin(supabase, 'contact_cities_serving', id, 'city_id', cityIdsServing),
    syncContactJoin(supabase, 'contact_zip_codes_serving', id, 'zip_code_id', zipCodeIdsServing),
  ])

  return NextResponse.json({ id })
}
