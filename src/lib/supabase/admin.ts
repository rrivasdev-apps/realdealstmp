import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

// Service-role client: bypasses RLS. Only import this where a route needs to
// write another user's row that RLS deliberately restricts to self-only
// (e.g. signup, team-invite, or setting another profile's employee_role_id)
// — never from anything reachable by a Client Component, and never expose
// SUPABASE_SERVICE_ROLE_KEY to the browser. If RLS already permits the write
// for the caller's own role (e.g. admin-gated company-scoped tables like
// commission_types), use the regular per-request client instead — the admin
// client should be the exception, not the default.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
