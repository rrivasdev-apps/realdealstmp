import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

type SupaClient = SupabaseClient<Database>

// Find-or-create against the caller's company geography, used by the Places
// resolution flow (src/app/api/places/details/route.ts) so an address the company
// hasn't seen before never blocks deal entry -- the new row is created with
// whatever canonical spelling the source (Google) gave us, same "auto-create on the
// fly" behavior the manual city search's "+ Add" affordance also uses.

export async function resolveCountry(
  supabase: SupaClient,
  companyId: string,
  isoCode: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const code = isoCode.toUpperCase()
  const { data: existing } = await supabase
    .from('countries')
    .select('id, name')
    .eq('company_id', companyId)
    .ilike('iso_code', code)
    .maybeSingle()
  if (existing) return existing

  const { data: created } = await supabase
    .from('countries')
    .insert({ company_id: companyId, name, iso_code: code })
    .select('id, name')
    .single()
  return created ?? null
}

// Matches on either the abbreviation or the full name -- whichever the source gave
// us -- since some future source may only provide one or the other (see the plan's
// note: Places gives both, a CSV import might only give a name).
export async function resolveState(
  supabase: SupaClient,
  companyId: string,
  countryId: string,
  { name, code }: { name: string; code: string | null }
): Promise<{ id: string; name: string } | null> {
  const orFilters = code ? `code.ilike.${code},name.ilike.${name}` : `name.ilike.${name}`
  const { data: existing } = await supabase
    .from('states')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('country_id', countryId)
    .or(orFilters)
    .maybeSingle()
  if (existing) return existing

  const { data: created } = await supabase
    .from('states')
    .insert({ company_id: companyId, country_id: countryId, name, code })
    .select('id, name')
    .single()
  return created ?? null
}

export async function resolveCity(
  supabase: SupaClient,
  companyId: string,
  stateId: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const { data: existing } = await supabase
    .from('cities')
    .select('id, name')
    .eq('state_id', stateId)
    .ilike('name', name)
    .maybeSingle()
  if (existing) return existing

  const { data: created } = await supabase
    .from('cities')
    .insert({ company_id: companyId, state_id: stateId, name })
    .select('id, name')
    .single()
  return created ?? null
}
