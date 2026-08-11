export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE = 'locale'

// Marks the locale cookie as recently checked against companies.locale, and
// records which user it was checked for. It expires on its own, which is what
// makes the check periodic: src/proxy.ts re-derives the locale whenever this is
// missing, stale, or stamped for a different user, so a company switching
// language reaches everyone already signed in within this window instead of
// waiting for them to log out. One query per session per window, rather than
// one per request.
export const LOCALE_CHECK_COOKIE = 'locale_checked'
export const LOCALE_CHECK_MAX_AGE = 60 * 5

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}
