'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

// Completes the leg of the email flow that only the browser can: Supabase's
// default confirmation/invite links come back with the session in the URL
// fragment, which never reaches the server (see /auth/confirm for the full
// picture). Reading it here and calling setSession stores the session in
// cookies via createBrowserClient, so the server sees a logged-in user on the
// very next request.
export default function AuthFinishPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [failed, setFailed] = useState<string | null>(null)
  // React runs effects twice in dev; setSession must not be attempted twice.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // Wrapped in an async function rather than run inline: the work is
    // asynchronous anyway, and setting state straight from an effect body is
    // what react-hooks/set-state-in-effect (rightly) rejects.
    async function completeSignIn() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const errorDescription = params.get('error_description') ?? params.get('error')

      if (errorDescription) {
        setFailed(errorDescription)
        return
      }

      if (!accessToken || !refreshToken) {
        setFailed(t('missingToken'))
        return
      }

      const { error } = await createClient().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        setFailed(error.message)
        return
      }

      const nextParam = searchParams.get('next')
      const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'
      // Drops the tokens out of the address bar on the way through.
      router.replace(next)
      router.refresh()
    }

    void completeSignIn()
  }, [router, searchParams, t])

  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      {failed ? (
        <>
          <h1 className="heading-page">{t('errorTitle')}</h1>
          <p className="mt-2 text-muted-foreground">{failed}</p>
        </>
      ) : (
        <p className="text-muted-foreground">{t('signingYouIn')}</p>
      )}
    </div>
  )
}
