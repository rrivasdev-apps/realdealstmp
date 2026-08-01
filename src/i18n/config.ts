export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE = 'locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}
