import 'server-only'

import { createClient } from '@/lib/supabase/server'

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
