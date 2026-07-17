import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

// When an offer is accepted, its price becomes the deal's BC contract price
// -- shared by the offer create and update routes so the rule lives in one
// place. If the deal has no buyer contract price yet, this accepted offer is
// the first one, so it becomes the locked price (same as buyer_contract_price
// set directly on the deal). If one is already locked, this is a
// renegotiation -- a later offer got accepted instead -- so it updates
// renegotiated_bc_price rather than trying to overwrite the locked field.
export async function applyAcceptedOfferToDeal(
  supabase: SupabaseClient<Database>,
  dealId: string,
  offerPrice: number | null
) {
  if (offerPrice == null) {
    return
  }

  const { data: deal } = await supabase.from('deals').select('buyer_contract_price').eq('id', dealId).single()
  if (!deal) {
    return
  }

  await supabase
    .from('deals')
    .update(
      deal.buyer_contract_price == null
        ? { buyer_found: true, buyer_contract_price: offerPrice }
        : { buyer_found: true, renegotiated_bc_price: offerPrice }
    )
    .eq('id', dealId)
}
