import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

const FIELD_TYPES = ['text', 'number', 'date', 'checkbox', 'select'] as const

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const fieldType = FIELD_TYPES.includes(body.field_type) ? body.field_type : ''

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!fieldType) {
    return NextResponse.json({ error: 'Field type is invalid.' }, { status: 400 })
  }

  const parsedOptions: string[] = Array.isArray(body.options)
    ? body.options.map((option: unknown) => String(option).trim()).filter(Boolean)
    : []

  if (fieldType === 'select' && parsedOptions.length === 0) {
    return NextResponse.json({ error: 'A select field needs at least one option.' }, { status: 400 })
  }

  const options: string[] | null = fieldType === 'select' ? parsedOptions : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      company_id: profile.company_id,
      name,
      field_type: fieldType,
      options,
    })
    .select('id, name, field_type, options')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create custom field.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
