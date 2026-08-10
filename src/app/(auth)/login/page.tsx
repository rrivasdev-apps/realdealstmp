'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (error) {
      // A deleted employee's auth user is banned (see
      // /api/team/[id]/status), and GoTrue's own wording for that ("User is
      // banned") doesn't match what the company did or tell them what to do.
      setError(
        /banned/i.test(error.message)
          ? t('deactivatedAccount')
          : error.message
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-sm py-24">
      <h1 className="heading-page">{t('logInTitle')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {submitting ? t('loggingInButton') : t('logInButton')}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t('newCompanyPrompt')}{' '}
        <Link href="/signup" className="font-medium underline">
          {t('createOneLink')}
        </Link>
      </p>
    </div>
  )
}
