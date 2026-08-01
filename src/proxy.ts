import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { isLocale, LOCALE_COOKIE } from '@/i18n/config'
import type { Database } from '@/lib/supabase/database.types'

// Refreshes the Supabase auth session on every request so server-rendered
// pages and Route Handlers see a valid session. This performs an optimistic
// cookie check only — it does not replace per-route authorization checks.
// See src/lib/supabase/auth.ts for the checks that must happen on every
// mutating route.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // Touches the session so expired tokens get refreshed; do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Keeps the `locale` cookie (src/i18n/request.ts's source of truth) in
  // sync with the logged-in user's companies.locale -- only queries the DB
  // when the cookie is missing (fresh login, cleared cookies, or a session
  // that predates this feature), so this doesn't add a DB round trip to
  // every request. Cleared on logout (see LogoutButton) so a different
  // account signing in on the same browser can't inherit a stale value.
  if (user && !isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    const { data } = await supabase.from('profiles').select('companies(locale)').eq('id', user.id).single()
    const companyLocale = data?.companies?.locale
    if (isLocale(companyLocale)) {
      request.cookies.set(LOCALE_COOKIE, companyLocale)
      response = NextResponse.next({ request })
      response.cookies.set(LOCALE_COOKIE, companyLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
