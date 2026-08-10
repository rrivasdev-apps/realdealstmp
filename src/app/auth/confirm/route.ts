import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Handles the signup-confirmation and invite emails, which arrive in one of
// two shapes:
//
// 1. `?token_hash=...&type=...` -- a template using `{{ .TokenHash }}`, which
//    this route verifies server-side and can set cookies for directly.
// 2. No query token at all -- Supabase's *default* `{{ .ConfirmationURL }}`
//    template points at its own /auth/v1/verify endpoint, which verifies the
//    token itself and redirects here with the session in the URL **fragment**
//    (`#access_token=...&refresh_token=...`). A fragment is never sent to the
//    server, so this handler cannot see it; it hands off to /auth/finish, a
//    Client Component that can. Browsers reattach the fragment across a
//    redirect, so it survives the hop.
//
// Before this handled case 2, an invited user landed on the error page and
// never reached /set-password -- the only screen that asks for their name.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(next)
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/finish?next=${encodeURIComponent(next)}`)
}

// Only ever redirect within this app -- `next` comes off the query string, and
// `//evil.example` is a valid absolute URL to a browser.
function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}
