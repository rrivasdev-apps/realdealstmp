'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { LOCALE_CHECK_COOKIE, LOCALE_COOKIE } from '@/i18n/config'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const t = useTranslations('Nav')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // A different account (possibly a different company/locale) may log in
    // next on this same browser -- don't let it inherit a stale locale
    // cookie. src/proxy.ts re-derives it from scratch once that happens.
    document.cookie = `${LOCALE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = `${LOCALE_CHECK_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="text-xs text-sidebar-muted hover:text-sidebar-foreground hover:underline">
      {t('logOut')}
    </button>
  )
}
