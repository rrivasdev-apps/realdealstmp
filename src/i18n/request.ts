import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

// Locale is a workspace (companies.locale) setting, not a URL segment --
// read from a cookie here rather than querying the DB per request. An
// earlier version resolved this straight from the DB on every request
// (auth.getUser() -> profiles -> companies.locale), which is the more
// "obviously correct" design on paper, but caused real hydration mismatches
// in production use: Next.js can render/prefetch the same route's RSC
// payload more than once per navigation, and there's no guarantee an async
// DB-backed getRequestConfig() resolves identically every time within that
// window, so the client's re-render and the server-rendered fragment it's
// reconciling against could disagree on locale. A cookie is synchronous and
// request-stable, which is also next-intl's own documented pattern for
// apps without a [locale] URL segment. src/proxy.ts is what keeps this
// cookie in sync with companies.locale (sets it whenever missing); the
// cookie is cleared on logout so a different account's login can't inherit
// a stale value. Unauthenticated requests (no cookie yet) fall back to
// English.
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
