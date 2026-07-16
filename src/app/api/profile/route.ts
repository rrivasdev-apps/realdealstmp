import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Every mutating route follows this shape: check the user first, never
// trust the client's own view of what it's allowed to do.
export async function PATCH(request: Request) {
  const user = await requireUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ name: body.name })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ profile: data })
}
