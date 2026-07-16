import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  company_id: string | null
  name: string
  email: string
  role: 'admin' | 'member'
}

// Call this at the top of every mutating Route Handler / Server Action.
// Never infer permissions from what the UI shows or hides — always re-check here.
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Like requireUser(), but also loads the caller's company_id/role — most
// protected routes need company_id to scope their queries/writes.
export async function requireProfile(): Promise<Profile | null> {
  const user = await requireUser()
  if (!user) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, name, email, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as Profile
}

// For admin-only routes (e.g. inviting teammates).
export async function requireAdmin(): Promise<Profile | null> {
  const profile = await requireProfile()
  if (!profile || profile.role !== 'admin') {
    return null
  }

  return profile
}
