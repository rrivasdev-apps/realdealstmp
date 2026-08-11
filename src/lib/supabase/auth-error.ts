// Supabase Auth (GoTrue) can fail with a message that tells the person reading it
// nothing at all: when the project's mail transport is down, both signUp() and
// inviteUserByEmail() reject with an AuthRetryableFetchError whose `message` is the
// literal string "{}" -- an empty error body that got serialized on the way out. That
// string was being passed straight through to the browser, so a user signing up saw a
// paragraph containing "{}" and nothing else.
//
// Postgres errors elsewhere in the app are specific enough to surface as-is (that's the
// established pattern in the route handlers); these are not, so callers pair them with a
// fallback that says what actually failed.
//
// The `error` string stays server-side English per CLAUDE.md's convention. `code` is what
// makes that convention work here: this failure is reachable in normal use and can't be
// pre-empted by a client-side check (nothing is wrong with the input -- the mail server is
// down), so the client maps the code to a translated string instead of rendering `error`.
// Anything without a code is a specific upstream message worth showing as-is.
export const AUTH_EMAIL_SEND_FAILED = 'auth_email_send_failed'

export type AuthErrorBody = { error: string; code?: string }

export function authErrorBody(message: string | null | undefined, fallback: string): AuthErrorBody {
  const trimmed = message?.trim() ?? ''
  const isUninformative = !trimmed || trimmed === '{}' || trimmed === '[object Object]'
  // The same failure reads as a real sentence when it comes back over plain REST
  // rather than through supabase-js, so match that shape too.
  const isMailFailure = /error sending\b.*\bmail/i.test(trimmed)

  if (isUninformative || isMailFailure) {
    return { error: fallback, code: AUTH_EMAIL_SEND_FAILED }
  }
  return { error: trimmed }
}
