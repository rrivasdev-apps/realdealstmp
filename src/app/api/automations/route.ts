import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// New automations start bare -- "New" on the list just creates the row and
// opens the builder, same as the reference app's two-step flow (create, then
// configure). Name defaults to "Untitled Automation" when none is given --
// the builder's own Name field is where it actually gets set. trigger_type
// defaults to "any deal created" (trigger_deal_type_id left null = any type)
// and both delays start at zero.
export async function POST(request: Request) {
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled Automation'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automation_templates')
    .insert({ company_id: profile.company_id, name, trigger_type: 'deal_created' })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create automation.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
