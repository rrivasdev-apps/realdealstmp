import 'server-only'

import Anthropic from '@anthropic-ai/sdk'

// The model every AI feature in the app runs on. Kept as one exported constant
// rather than inlined at the call site so switching it is a one-line change.
// Sonnet is the deliberate choice here: drafting a short message from field
// values that have already been assembled for it is not a reasoning-heavy job,
// and this runs once per task across every automation, so the per-draft cost is
// what scales. Any replacement needs to support adaptive thinking and
// `effort: low` -- check with client.models.retrieve(id) before changing it,
// since older Sonnet and Haiku releases reject the effort parameter outright.
export const AI_MODEL = 'claude-sonnet-5'

// Thrown when ANTHROPIC_API_KEY isn't configured. Callers are expected to catch
// this and degrade rather than surface an error -- same shape as the optional
// GOOGLE_MAPS_API_KEY path, where address autocomplete simply doesn't appear and
// manual entry still works (see CLAUDE.md's env var section).
export class AiNotConfiguredError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured.')
    this.name = 'AiNotConfiguredError'
  }
}

// Server-only by construction: the `server-only` import above makes importing
// this from a Client Component a build error, so the key can't leak into the
// browser bundle. It is deliberately not NEXT_PUBLIC_.
export function createAiClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new AiNotConfiguredError()
  }
  return new Anthropic({ apiKey })
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
