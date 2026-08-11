// Supabase Auth (GoTrue) can fail with a message that tells the person reading it
// nothing at all: when the project's mail transport is down, both signUp() and
// inviteUserByEmail() reject with an AuthRetryableFetchError whose `message` is the
// literal string "{}" -- an empty error body that got serialized on the way out. That
// string was being passed straight through to the browser, so a user signing up saw a
// paragraph containing "{}" and nothing else.
//
// Postgres errors elsewhere in the app are specific enough to surface as-is (that's the
// established pattern in the route handlers); these are not, so callers pair them with a
// fallback that says what actually failed. Kept server-side and in English on purpose,
// matching the convention in CLAUDE.md for API error strings.
export function authErrorMessage(message: string | null | undefined, fallback: string): string {
  const trimmed = message?.trim() ?? ''
  const isUninformative = !trimmed || trimmed === '{}' || trimmed === '[object Object]'
  return isUninformative ? fallback : trimmed
}
