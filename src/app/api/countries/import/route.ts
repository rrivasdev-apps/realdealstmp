import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Textarea-paste bulk import, not a file upload -- there's no multipart-parsing
// precedent anywhere in this app, and a paste-from-spreadsheet textarea covers the
// same need with far less code. One "name,iso_code" pair per line.
export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const text: string = typeof body.text === 'string' ? body.text : ''

  const rows = text
    .split('\n')
    .map((line) => line.split(',').map((part) => part.trim()))
    .filter(([name, isoCode]) => name && isoCode)
    .map(([name, isoCode]) => ({ company_id: profile.company_id as string, name, iso_code: isoCode.toUpperCase() }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Paste at least one "name,iso_code" line.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error, count } = await supabase.from('countries').insert(rows, { count: 'exact' })

  if (error) {
    return NextResponse.json({ error: 'Some rows could not be imported (check for duplicate country codes).' }, { status: 400 })
  }

  return NextResponse.json({ imported: count ?? rows.length })
}
