import 'server-only'

import { DEAL_FIELDS } from '@/lib/automations/deal-fields'

import { AI_MODEL, createAiClient } from './client'
import type { AiDraftConfig, DraftAudience } from './draft-config'

// Which deal fields each audience's draft is allowed to see. This is a
// confidentiality boundary, not a token-cost optimisation: the wholesaler's
// margin is the difference between the AB price (what they pay the seller) and
// the BC price (what the buyer pays them), so a buyer-facing draft must never
// carry contract_price and a seller-facing one must never carry
// buyer_contract_price. Sending the whole deal row and trusting the prompt to
// stay quiet about it would put that entirely on the model's discretion.
const AUDIENCE_FIELDS: Record<DraftAudience, string[]> = {
  // AB side only -- what the seller themselves agreed to.
  seller: [
    'contract_price',
    'contract_date',
    'closing_date',
    'due_diligence_expiration',
    'actual_closing_date',
    'ab_emd_amount',
    'ab_emd_deposit_received',
    'closing_extension_date',
    'due_diligence_extension_date',
    'seller_info_sheet_sent',
    'seller_info_sheet_signed',
    'post_occupancy_move_out_date',
    'on_hold_date',
  ],
  // BC side only -- deliberately no contract_price.
  buyer: [
    'buyer_contract_price',
    'renegotiated_bc_price',
    'buyer_contract_date',
    'bc_contract_closing_date',
    'buyer_inspection_deadline',
    'buyer_deposit_amount',
    'buyer_deposit_received',
  ],
  // Needs both closing dates to coordinate, but no pricing beyond what's on the
  // contracts it is already handling.
  title_company: [
    'contract_date',
    'closing_date',
    'actual_closing_date',
    'bc_contract_closing_date',
    'apn',
    'legal_description',
    'title_ordered',
    'title_opened',
    'title_ready',
    'closing_extension_date',
  ],
  jv_partner: [
    'contract_price',
    'projected_sales_price',
    'buyer_contract_price',
    'closing_date',
    'actual_closing_date',
    'jv_split_percent',
    'split_amount',
    'total_expenses',
  ],
  mortgage_company: [
    'apn',
    'legal_description',
    'mortgage_principal_balance',
    'mortgage_rate',
    'mortgage_term',
    'total_payoff_amount',
    'foreclosure_date',
    'closing_date',
  ],
  // Internal recipients are colleagues who can already open the deal.
  internal: DEAL_FIELDS.map((field) => field.key),
}

const FIELD_BY_KEY = new Map(DEAL_FIELDS.map((field) => [field.key, field]))

// Frozen instructions. Kept byte-identical across calls so it stays a stable
// cache prefix -- everything deal-specific goes in the user turn below.
const SYSTEM_PROMPT = `You draft short, professional messages for a real estate wholesaling company's team members to send to the people involved in a deal.

Rules:
- Use ONLY the deal facts provided in the user message. Never invent an amount, date, name, or commitment that is not given to you.
- If a fact you would normally include is missing, leave a clearly marked blank like [confirm closing date] rather than guessing a value.
- Write as the team member sending it, in first person. Do not sign off with a specific person's name; end with a plain closing line.
- Keep it brief and businesslike: a few short paragraphs at most, no filler, no marketing language.
- Never mention internal figures the recipient would have no reason to know about, even if they appear in the facts.
- Output only the message itself as plain text. No subject line unless it is an email, no markdown, no preamble, no commentary about what you wrote.`

function formatFieldValue(key: string, raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null
  const field = FIELD_BY_KEY.get(key)
  if (!field) return null
  if (field.type === 'checkbox') return raw ? 'yes' : 'no'
  if (field.type === 'number') {
    const num = Number(raw)
    return Number.isFinite(num) ? String(num) : null
  }
  return String(raw)
}

// Builds the deal-facts block for one audience. Kept as its own function so the
// confidentiality boundary above is enforced in exactly one readable place --
// everything the model can possibly see about the deal passes through here.
export function buildDealFacts(deal: Record<string, unknown>, audience: DraftAudience): string {
  const lines: string[] = []
  const address = typeof deal.address === 'string' ? deal.address : null
  if (address) lines.push(`Property address: ${address}`)

  for (const key of AUDIENCE_FIELDS[audience]) {
    const value = formatFieldValue(key, deal[key])
    if (value === null) continue
    lines.push(`${FIELD_BY_KEY.get(key)?.label ?? key}: ${value}`)
  }

  return lines.length > 0 ? lines.join('\n') : 'No deal details are recorded yet.'
}

export type DraftTaskMessageInput = {
  deal: Record<string, unknown>
  stepType: 'email_task' | 'call_task'
  stepName: string
  stepDescription: string | null
  config: AiDraftConfig
}

// One shared function rather than prompt-building inlined in the route, matching
// how calculateProfitCascade/commission math live in src/lib/deals -- the two
// callers (first generation and regeneration) must not drift apart.
//
// The caller is responsible for having fetched `deal` through a company-scoped
// query; this never queries on its own, so it cannot widen the caller's scope.
export async function draftTaskMessage(input: DraftTaskMessageInput): Promise<string> {
  const { deal, stepType, stepName, stepDescription, config } = input
  const client = createAiClient()

  const kind =
    stepType === 'email_task'
      ? 'an email to send'
      : 'a short set of talking points for a phone call'

  const userContent = [
    `Draft ${kind}.`,
    `Recipient: the deal's ${config.audience.replace(/_/g, ' ')}.`,
    `Purpose: ${config.purpose}`,
    `Task title: ${stepName}`,
    stepDescription ? `Task notes: ${stepDescription}` : null,
    '',
    'Deal facts:',
    buildDealFacts(deal, config.audience),
  ]
    .filter((line) => line !== null)
    .join('\n')

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2000,
    // Adaptive thinking left on deliberately: with thinking disabled this model
    // tends to spill its reasoning into the visible response, and the whole
    // output here is pasted into a message a client will read.
    thinking: { type: 'adaptive' },
    // A short draft from facts already handed over is not a reasoning-heavy job.
    output_config: { effort: 'low' },
    // Marks the stable prefix (system prompt) as cacheable. It only starts
    // paying off once that prompt passes the ~1024-token minimum -- below that
    // the API silently skips caching -- but costs nothing and means any future
    // growth in the instructions is cached automatically rather than needing
    // this to be remembered later.
    cache_control: { type: 'ephemeral' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  // content is a discriminated union and adaptive thinking adds thinking blocks;
  // take the text blocks only.
  const draft = response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  if (!draft) {
    throw new Error('The model returned an empty draft.')
  }
  return draft
}
