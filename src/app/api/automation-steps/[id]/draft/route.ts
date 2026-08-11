import { NextResponse } from 'next/server'

import { AiNotConfiguredError, AI_MODEL } from '@/lib/ai/client'
import { isDraftAudience, MAX_PURPOSE_LENGTH, type AiDraftConfig } from '@/lib/ai/draft-config'
import { draftTaskMessage } from '@/lib/ai/draft-message'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Explicit ceiling on how many times one step can be redrafted. Each call is a
// paid model request kicked off by a button, so this is what stops a bored
// clicker from running up a bill on a single task.
const MAX_REGENERATIONS = 5

type AiOutput = {
  draft: string
  generated_at: string
  model: string
  regenerate_count: number
}

function readAiDraftConfig(config: unknown): AiDraftConfig | null {
  if (typeof config !== 'object' || config === null) return null
  const raw = (config as Record<string, unknown>).ai_draft
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (value.enabled !== true || !isDraftAudience(value.audience)) return null
  const purpose = typeof value.purpose === 'string' ? value.purpose.trim() : ''
  if (!purpose || purpose.length > MAX_PURPOSE_LENGTH) return null
  return { enabled: true, audience: value.audience, purpose }
}

// Generates the suggested message for an email_task/call_task step, or returns
// the one already stored. Drafting happens here -- on first view -- rather than
// when the step row is created: activateProcess() is called in a loop by the
// daily cron sweep (advanceStalledProcesses), and putting a model call inside
// that loop would have every overdue process serialise an API request into one
// serverless invocation. Drafting on view also means the draft reflects the
// deal as it stands when someone actually picks the task up, not as it was when
// the step was scheduled, which may have been weeks earlier.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params
  const profile = await requirePermission('view_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // step -> process -> deal, so the company check is on the deal that owns the
  // automation rather than on anything the caller supplied.
  const { data: step } = await supabase
    .from('automation_steps')
    .select('id, process_id, ai_output, template_step_id, automation_processes(deal_id)')
    .eq('id', stepId)
    .single()

  if (!step) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const dealId = (step.automation_processes as { deal_id: string } | null)?.deal_id
  if (!dealId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: templateStep } = await supabase
    .from('automation_template_steps')
    .select('step_type, name, description, config')
    .eq('id', step.template_step_id)
    .single()

  if (!templateStep || (templateStep.step_type !== 'email_task' && templateStep.step_type !== 'call_task')) {
    return NextResponse.json({ error: 'This step does not support drafting.' }, { status: 400 })
  }

  const config = readAiDraftConfig(templateStep.config)
  if (!config) {
    return NextResponse.json({ error: 'Drafting is not enabled for this step.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const regenerate = body?.regenerate === true
  const existing = (step.ai_output ?? null) as AiOutput | null

  // Not a regeneration and a draft is already stored: hand it back untouched.
  // The panel calls this on mount, so without this every remount would be a
  // fresh paid request.
  if (!regenerate && existing?.draft) {
    return NextResponse.json({ ai_output: existing })
  }

  const regenerateCount = existing ? existing.regenerate_count + 1 : 0
  if (regenerate && regenerateCount > MAX_REGENERATIONS) {
    return NextResponse.json(
      { error: `This draft has been regenerated the maximum of ${MAX_REGENERATIONS} times.`, code: 'regenerate_limit' },
      { status: 429 }
    )
  }

  let draft: string
  try {
    draft = await draftTaskMessage({
      deal: deal as unknown as Record<string, unknown>,
      stepType: templateStep.step_type,
      stepName: templateStep.name ?? '',
      stepDescription: templateStep.description,
      config,
    })
  } catch (error) {
    // Only ever records that drafting failed and why in broad terms -- never the
    // prompt, the deal facts, or any partial output. `detail` is readable by
    // everyone in the company through the process activity log.
    await supabase.from('automation_activity_log').insert({
      process_id: step.process_id,
      event_type: 'ai_draft_failed',
      actor_profile_id: profile.id,
      detail: { automation_step_id: step.id, reason: error instanceof AiNotConfiguredError ? 'not_configured' : 'request_failed' },
    })

    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: 'AI drafting is not configured.', code: 'not_configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not generate a draft.', code: 'generation_failed' }, { status: 502 })
  }

  const aiOutput: AiOutput = {
    draft,
    generated_at: new Date().toISOString(),
    model: AI_MODEL,
    regenerate_count: regenerateCount,
  }

  const { error: updateError } = await supabase
    .from('automation_steps')
    .update({ ai_output: aiOutput })
    .eq('id', step.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await supabase.from('automation_activity_log').insert({
    process_id: step.process_id,
    event_type: regenerate ? 'ai_draft_regenerated' : 'ai_draft_generated',
    actor_profile_id: profile.id,
    detail: { automation_step_id: step.id, model: AI_MODEL, regenerate_count: regenerateCount },
  })

  return NextResponse.json({ ai_output: aiOutput })
}
