import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

// Never trust the client's custom_fields payload directly -- it could carry
// stale/renamed keys or a value of the wrong type. Re-derives the object
// server-side from this company's current field definitions instead, same
// spirit as the "current vs. client-supplied" rule in CLAUDE.md.
export async function buildCustomFieldsForSave(
  supabase: SupabaseClient<Database>,
  companyId: string,
  input: unknown
): Promise<Record<string, string | number | boolean>> {
  const { data: definitions } = await supabase
    .from('custom_field_definitions')
    .select('id, field_type, options')
    .eq('company_id', companyId)

  const result: Record<string, string | number | boolean> = {}
  if (!definitions || typeof input !== 'object' || input === null) {
    return result
  }

  const raw = input as Record<string, unknown>

  for (const definition of definitions) {
    const value = raw[definition.id]
    if (value === undefined || value === null || value === '') continue

    if (definition.field_type === 'checkbox') {
      result[definition.id] = Boolean(value)
    } else if (definition.field_type === 'number') {
      const num = Number(value)
      if (Number.isFinite(num)) result[definition.id] = num
    } else if (definition.field_type === 'select') {
      const options = definition.options ?? []
      if (typeof value === 'string' && options.includes(value)) {
        result[definition.id] = value
      }
    } else {
      result[definition.id] = String(value)
    }
  }

  return result
}
