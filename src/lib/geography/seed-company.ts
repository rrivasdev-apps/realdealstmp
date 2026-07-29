import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import countriesData from './data/countries.json'
import usCitiesData from './data/us-cities.json'
import usStatesData from './data/us-states.json'

type SupaClient = SupabaseClient<Database>

type SeedResult = { ok: true; defaultCountryId: string } | { ok: false; error: string }

// Batched to stay comfortably under Supabase's per-request payload size -- the US
// cities seed is ~31.7k rows.
const INSERT_BATCH_SIZE = 2000

// Parallel, not sequential -- 16 sequential round trips for the ~31.7k-row US cities
// seed took 10+ seconds and was starving the signup route's subsequent auth.signUp()
// call (observed as an AuthRetryableFetchError under load). In parallel the batches
// are latency-bound together instead of stacked, cutting this to ~1-2s.
async function insertInBatches<Row extends Record<string, unknown>>(
  supabase: SupaClient,
  table: 'countries' | 'states' | 'cities',
  rows: Row[]
): Promise<{ error: string | null }> {
  const batches: Row[][] = []
  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    batches.push(rows.slice(i, i + INSERT_BATCH_SIZE))
  }

  const results = await Promise.all(
    // @ts-expect-error -- table name is a runtime param across three different row shapes
    batches.map((batch) => supabase.from(table).insert(batch))
  )
  const failed = results.find((result) => result.error)
  return { error: failed?.error?.message ?? null }
}

// Single source of truth for "give this company its starting geography," used by
// both the signup route (new companies) and the one-time backfill script (companies
// that existed before this feature shipped). Always seeds the full country list;
// additionally seeds all US states + a real US cities dataset (Census Gazetteer, see
// src/lib/geography/data/us-cities.json) when the home country is the US -- other
// home countries get just their country row today, states/cities grow via Settings
// (add one-by-one or import) -- see the plan's "known limitations".
export async function seedCompanyGeography(
  supabase: SupaClient,
  companyId: string,
  homeCountryIsoCode: string
): Promise<SeedResult> {
  const isoCode = homeCountryIsoCode.toUpperCase()

  const { data: countryRows, error: countriesError } = await supabase
    .from('countries')
    .insert(countriesData.map((country) => ({ company_id: companyId, name: country.name, iso_code: country.iso_code })))
    .select('id, iso_code')

  if (countriesError || !countryRows) {
    return { ok: false, error: countriesError?.message ?? 'Could not seed countries.' }
  }

  const homeCountry = countryRows.find((country) => country.iso_code.toUpperCase() === isoCode)
  if (!homeCountry) {
    return { ok: false, error: 'Unknown home country.' }
  }

  if (isoCode === 'US') {
    const { data: stateRows, error: statesError } = await supabase
      .from('states')
      .insert(usStatesData.map((state) => ({ company_id: companyId, country_id: homeCountry.id, name: state.name, code: state.code })))
      .select('id, code')

    if (statesError || !stateRows) {
      return { ok: false, error: statesError?.message ?? 'Could not seed states.' }
    }

    const stateIdByCode = new Map(stateRows.map((state) => [state.code, state.id]))
    const cityRows = usCitiesData
      .map((city) => {
        const stateId = stateIdByCode.get(city.state_code)
        return stateId ? { company_id: companyId, state_id: stateId, name: city.name } : null
      })
      .filter((row): row is { company_id: string; state_id: string; name: string } => row !== null)

    const { error: citiesError } = await insertInBatches(supabase, 'cities', cityRows)
    if (citiesError) {
      return { ok: false, error: citiesError }
    }
  }

  return { ok: true, defaultCountryId: homeCountry.id }
}
