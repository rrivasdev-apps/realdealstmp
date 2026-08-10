import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/supabase/auth'

import { SetPasswordForm } from './set-password-form'

// Reached from the invite email's confirm link, which establishes a
// session but no password yet.
export default async function SetPasswordPage() {
  const t = await getTranslations('Auth')
  const user = await requireUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-sm py-24">
      <h1 className="heading-page">{t('setPasswordTitle')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('setPasswordSubtitle')}</p>
      <SetPasswordForm />
    </div>
  )
}
