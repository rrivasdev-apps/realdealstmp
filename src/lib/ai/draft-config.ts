// Shape and validation for a step's ai_draft config. Deliberately free of both
// `server-only` and the Anthropic SDK: the template builder is a Client Component
// and needs the audience list to render its dropdown, while step-config.ts needs
// the validator on the server. Only draft-message.ts (which does the actual API
// call) is server-only.

export const DRAFT_AUDIENCES = [
  'seller',
  'buyer',
  'title_company',
  'jv_partner',
  'mortgage_company',
  'internal',
] as const

export type DraftAudience = (typeof DRAFT_AUDIENCES)[number]

export type AiDraftConfig = {
  enabled: boolean
  audience: DraftAudience
  purpose: string
}

// Bounds what a Settings admin can push into the prompt. Long enough for a real
// instruction ("ask the seller to return the signed info sheet before Friday"),
// short enough that it can't become the bulk of the request.
export const MAX_PURPOSE_LENGTH = 300

export function isDraftAudience(value: unknown): value is DraftAudience {
  return typeof value === 'string' && (DRAFT_AUDIENCES as readonly string[]).includes(value)
}
