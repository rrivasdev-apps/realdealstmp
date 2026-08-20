'use client'

import { NextIntlClientProvider, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/config'
import countries from '@/lib/geography/data/countries.json'
import { AUTH_EMAIL_SEND_FAILED } from '@/lib/supabase/auth-error'

type SignupMessages = Record<Locale, Record<string, unknown>>

// Every other screen takes its language from the locale cookie, which only exists
// once you're signed in (see src/i18n/request.ts) -- so signup, the one screen
// nobody reaches signed in, always rendered in English. The language dropdown here
// already asks which language the company wants; this makes the page answer in it
// immediately rather than only after the first login. The selected locale is
// re-provided to the subtree below, so picking "Español" reprints the form as you
// look at it, with nothing typed so far lost to a reload.
export function SignupForm({
  initialLocale,
  messagesByLocale,
}: {
  initialLocale: Locale
  messagesByLocale: SignupMessages
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  // The root layout stamped <html lang> from the cookie before this page picked its
  // own language; keep it truthful so screen readers announce the right one.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <SignupFields locale={locale} onLocaleChange={setLocale} />
    </NextIntlClientProvider>
  )
}

// Split out so it renders *inside* the provider above -- a component can't read a
// context it renders itself, so keeping these fields in SignupForm would leave
// useTranslations() reading the outer (cookie) locale and ignoring the dropdown.
function SignupFields({
  locale,
  onLocaleChange,
}: {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
}) {
  const t = useTranslations('Signup')
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [homeCountryCode, setHomeCountryCode] = useState('US')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, name, email, password, homeCountryCode, locale }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      // `result.error` is deliberately English (see auth-error.ts); a code means
      // the failure has translated copy of its own to show instead.
      setError(
        result.code === AUTH_EMAIL_SEND_FAILED
          ? t('confirmationEmailFailed')
          : (result.error ?? t('genericError'))
      )
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h1 className="heading-page">{t('checkEmailTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('checkEmailBody', { email, company: companyName })}</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="heading-page">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="field-label">
          {t('companyNameLabel')}
          <input
            type="text"
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('yourNameLabel')}
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('emailLabel')}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('passwordLabel')}
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('homeCountryLabel')}
          <select
            required
            value={homeCountryCode}
            onChange={(event) => setHomeCountryCode(event.target.value)}
            className="field-input px-3 py-2"
          >
            {countries.map((country) => (
              <option key={country.iso_code} value={country.iso_code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">{t('homeCountryHint')}</p>

        <label className="field-label">
          {t('language')}
          <select
            required
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}
            className="field-input px-3 py-2"
          >
            <option value="en">{t('languageEnglish')}</option>
            <option value="es">{t('languageSpanish')}</option>
          </select>
        </label>
        <p className="text-xs text-muted-foreground">{t('languageHint')}</p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-landing-lime px-4 py-2 font-semibold text-landing-navy transition hover:bg-landing-lime-dark hover:text-white disabled:opacity-50"
        >
          {submitting ? t('creatingButton') : t('createCompanyButton')}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('haveAccountPrompt')}{' '}
        <Link href="/login" className="font-medium text-landing-blue hover:text-landing-navy">
          {t('logInLink')}
        </Link>
      </p>
    </>
  )
}
