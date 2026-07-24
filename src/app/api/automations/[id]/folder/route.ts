import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Lightweight endpoint for moving a single automation between folders from the list
// page's "Move to folder" control, without round-tripping the full trigger/config
// payload the general PATCH /api/automations/[id] requires.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const folderId = typeof body.folder_id === 'string' && body.folder_id ? body.folder_id : null

  if (folderId) {
    const { data: folder } = await supabase.from('automation_folders').select('company_id').eq('id', folderId).single()
    if (!folder || folder.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'That folder was not found.' }, { status: 400 })
    }
  }

  const { error } = await supabase.from('automation_templates').update({ folder_id: folderId }).eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id, folder_id: folderId })
}
