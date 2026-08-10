'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'

import countries from '@/lib/geography/data/countries.json'

export default function SignupPage() {
  const t = useTranslations('Signup')
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [homeCountryCode, setHomeCountryCode] = useState('US')
  const [locale, setLocale] = useState('en')
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
      setError(result.error ?? t('genericError'))
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-sm py-24 text-center">
        <h1 className="heading-page">{t('checkEmailTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('checkEmailBody', { email, company: companyName })}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm py-24">
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
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('yourNameLabel')}
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('emailLabel')}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
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
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('homeCountryLabel')}
          <select
            required
            value={homeCountryCode}
            onChange={(event) => setHomeCountryCode(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
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
            onChange={(event) => setLocale(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
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
          className="mt-2 rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {submitting ? t('creatingButton') : t('createCompanyButton')}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('haveAccountPrompt')}{' '}
        <Link href="/login" className="font-medium underline">
          {t('logInLink')}
        </Link>
      </p>
    </div>
  )
}
