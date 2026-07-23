import { NextResponse } from 'next/server'

import { startProcess } from '@/lib/automations/runtime'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// "Start an Automator Manually For This Deal" -- lets a user kick off any
// functional automation template against this deal, independent of its
// configured trigger.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('company_id').eq('id', id).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const templateId = typeof body.template_id === 'string' ? body.template_id : ''
  if (!templateId) {
    return NextResponse.json({ error: 'Choose an automation to start.' }, { status: 400 })
  }

  const { data: template } = await supabase
    .from('automation_templates')
    .select('id, company_id, is_functional')
    .eq('id', templateId)
    .single()
  if (!template || template.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Automation not found.' }, { status: 404 })
  }
  if (!template.is_functional) {
    return NextResponse.json({ error: 'This automation is not functional yet.' }, { status: 400 })
  }

  const process = await startProcess(supabase, { templateId, dealId: id, startedManually: true })
  if (!process) {
    return NextResponse.json({ error: 'Could not start this automation.' }, { status: 400 })
  }

  return NextResponse.json({ id: process.id })
}
