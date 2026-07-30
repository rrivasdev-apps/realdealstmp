import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

type SupaClient = SupabaseClient<Database>

// Every simple contact join table (contact_partner_companies,
// contact_investor_types, contact_markets_interested, ...) has the same
// (contact_id, <foreign>_id) shape -- one helper instead of repeating the
// "delete then insert-if-any" dance per table per route.
export async function insertContactJoin(
  supabase: SupaClient,
  table: string,
  contactId: string,
  foreignKey: string,
  ids: string[]
) {
  if (!ids.length) return
  // @ts-expect-error -- table name is a runtime param across many join-table shapes
  await supabase.from(table).insert(ids.map((id) => ({ contact_id: contactId, [foreignKey]: id })))
}

// Full replace of a join table's rows for one contact -- used on update,
// where the client always sends the complete desired set.
export async function syncContactJoin(
  supabase: SupaClient,
  table: string,
  contactId: string,
  foreignKey: string,
  ids: string[]
) {
  // @ts-expect-error -- table name is a runtime param across many join-table shapes
  await supabase.from(table).delete().eq('contact_id', contactId)
  await insertContactJoin(supabase, table, contactId, foreignKey, ids)
}
