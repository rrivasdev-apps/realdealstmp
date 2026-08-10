'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function SetPasswordForm() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { error: passwordError } = await supabase.auth.updateUser({ password })
    if (passwordError) {
      setSubmitting(false)
      setError(passwordError.message)
      return
    }

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    setSubmitting(false)

    if (!response.ok) {
      const result = await response.json()
      setError(result.error ?? t('couldNotSaveName'))
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
        {t('newPasswordLabel')}
        <input
          type="password"
          required
          minLength={8}
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
        {submitting ? t('savingButton') : t('setPasswordButton')}
      </button>
    </form>
  )
}
