import { getLocale } from 'next-intl/server'

import { defaultLocale, isLocale, locales } from '@/i18n/config'
import en from '@/messages/en.json'
import es from '@/messages/es.json'

import { SignupForm } from './signup-form'

const CATALOGS = { en, es }

// Only the one namespace this page reads gets handed to the client. Shipping both
// full catalogs so the form could switch between them would put every string in the
// app into the bundle for the one route a visitor sees before they have an account.
const SIGNUP_MESSAGES = Object.fromEntries(
  locales.map((locale) => [locale, { Signup: CATALOGS[locale].Signup }])
) as Record<(typeof locales)[number], { Signup: (typeof en)['Signup'] }>

export default async function SignupPage() {
  const cookieLocale = await getLocale()

  return (
    <SignupForm
      initialLocale={isLocale(cookieLocale) ? cookieLocale : defaultLocale}
      messagesByLocale={SIGNUP_MESSAGES}
    />
  )
}
