import { createServerClient } from '@supabase/ssr'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { NextResponse, type NextRequest } from 'next/server'

import { isLocale, LOCALE_CHECK_COOKIE, LOCALE_CHECK_MAX_AGE, LOCALE_COOKIE } from '@/i18n/config'
import type { Database } from '@/lib/supabase/database.types'

// Refreshes the Supabase auth session on every request so server-rendered
// pages and Route Handlers see a valid session. This performs an optimistic
// cookie check only — it does not replace per-route authorization checks.
// See src/lib/supabase/auth.ts for the checks that must happen on every
// mutating route.
export async function proxy(request: NextRequest) {
  // Collected rather than written straight to a response: every
  // `NextResponse.next({ request })` returns a *fresh* response, so building one
  // eagerly and rebuilding it later (as the locale sync below has to, to hand the
  // updated cookie to the render in this same pass) silently drops the Set-Cookie
  // headers written before it -- including a refreshed Supabase session. The
  // response is built once, at the end, from this list.
  const pendingCookies: { name: string; value: string; options?: Partial<ResponseCookie> }[] = []

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value)
            pendingCookies.push({ name, value, options })
          }
        },
      },
    }
  )

  // Touches the session so expired tokens get refreshed; do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Keeps the `locale` cookie (src/i18n/request.ts's source of truth) in sync
  // with the logged-in user's companies.locale. The DB is consulted when the
  // cookie is missing (fresh login, cleared cookies), when the check cookie has
  // expired, or when it was last stamped for a *different* user -- so a company
  // that switches language reaches sessions that are already open within
  // LOCALE_CHECK_MAX_AGE, without adding a query to every request.
  //
  // The check cookie stores the user id rather than a flag because the window
  // otherwise outlives the session it was stamped for: sign out and straight
  // back in as someone else (or let a session lapse and let the next person log
  // in) and the new user inherits the old company's language until the window
  // closes. Matching on the id makes an account switch re-derive immediately,
  // which is also why LogoutButton clearing these cookies is now a belt-and-
  // braces measure rather than the only thing preventing it. The id is not a
  // secret -- the Supabase auth cookie sitting beside it already carries it.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  const checkedFor = request.cookies.get(LOCALE_CHECK_COOKIE)?.value

  if (user && (!isLocale(cookieLocale) || checkedFor !== user.id)) {
    const { data } = await supabase.from('profiles').select('companies(locale)').eq('id', user.id).single()
    const companyLocale = data?.companies?.locale

    if (isLocale(companyLocale)) {
      request.cookies.set(LOCALE_COOKIE, companyLocale)
      request.cookies.set(LOCALE_CHECK_COOKIE, user.id)
      pendingCookies.push(
        { name: LOCALE_COOKIE, value: companyLocale, options: { path: '/', maxAge: 60 * 60 * 24 * 365 } },
        { name: LOCALE_CHECK_COOKIE, value: user.id, options: { path: '/', maxAge: LOCALE_CHECK_MAX_AGE } }
      )
    }
  }

  const response = NextResponse.next({ request })
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
