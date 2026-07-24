import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Creates either a top-level folder (no parent_folder_id) or a subfolder of an
// existing top-level folder. Depth is capped at 2 levels: a subfolder's parent
// must itself be top-level, so there's no re-parenting UI and no way to end up
// with grandchildren.
export async function POST(request: Request) {
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const parentFolderId = typeof body.parent_folder_id === 'string' && body.parent_folder_id ? body.parent_folder_id : null

  const supabase = await createClient()

  if (parentFolderId) {
    const { data: parent } = await supabase
      .from('automation_folders')
      .select('id, company_id, parent_folder_id')
      .eq('id', parentFolderId)
      .single()

    if (!parent || parent.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'That folder was not found.' }, { status: 400 })
    }
    if (parent.parent_folder_id) {
      return NextResponse.json({ error: 'Subfolders can only be created inside a main folder.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('automation_folders')
    .insert({ company_id: profile.company_id, name, parent_folder_id: parentFolderId })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create folder.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
