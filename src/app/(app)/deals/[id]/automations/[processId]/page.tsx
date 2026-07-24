import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DEAL_FIELDS } from '@/lib/automations/deal-fields'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { StepAction } from './step-action'

const STEP_TYPE_LABELS: Record<string, string> = {
  fill_fields: 'Fill Fields',
  conditional_statement: 'Conditional Statement',
  email_task: 'Email Task',
  call_task: 'Call Task',
  generic_task: 'Generic Task',
  show_text: 'Show Text',
  option_list: 'Option List',
  trigger: 'Trigger',
}

export default async function AutomationProcessPage({
  params,
}: {
  params: Promise<{ id: string; processId: string }>
}) {
  const { id, processId } = await params
  const profile = await requirePermission('view_deal_detail')
  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Automation</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this deal.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal || deal.company_id !== profile.company_id) {
    notFound()
  }

  const { data: process } = await supabase.from('automation_processes').select('*').eq('id', processId).eq('deal_id', id).single()
  if (!process) {
    notFound()
  }

  const { data: template } = await supabase.from('automation_templates').select('id, name').eq('id', process.template_id).single()

  const { data: currentStep } = await supabase
    .from('automation_steps')
    .select('*')
    .eq('process_id', processId)
    .eq('status', 'due')
    .maybeSingle()

  const templateStep = currentStep
    ? (await supabase.from('automation_template_steps').select('*').eq('id', currentStep.template_step_id).single()).data
    : null

  const customFieldIds = ((templateStep?.config as { custom_field_ids?: string[] } | null)?.custom_field_ids ?? []) as string[]
  const { data: customFieldDefinitions } =
    customFieldIds.length > 0
      ? await supabase.from('custom_field_definitions').select('id, name, field_type, options').in('id', customFieldIds)
      : { data: [] }

  let nextStepPreview: { name: string; type: string } | null = null
  if (templateStep?.next_step_id) {
    const { data: nextStep } = await supabase
      .from('automation_template_steps')
      .select('name, step_type')
      .eq('id', templateStep.next_step_id)
      .single()
    if (nextStep) nextStepPreview = { name: nextStep.name ?? 'Untitled step', type: STEP_TYPE_LABELS[nextStep.step_type ?? ''] ?? '' }
  }

  const { data: activityLog } = await supabase
    .from('automation_activity_log')
    .select('*')
    .eq('process_id', processId)
    .order('created_at', { ascending: false })

  const { data: actorProfiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', (activityLog ?? []).map((row) => row.actor_profile_id).filter((profileId): profileId is string => Boolean(profileId)))
  const actorNameById = new Map((actorProfiles ?? []).map((row) => [row.id, row.name]))

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <Link href={`/deals/${id}/automations`} className="text-sm underline">
          &larr; All of deal&apos;s processes
        </Link>

        <h1 className="mt-2 text-xl font-semibold">{template?.name ?? 'Automation'}</h1>
        <p className="text-sm text-muted-foreground">{deal.address}</p>

        {process.status === 'completed' ? (
          <p className="mt-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            This automation is complete.
          </p>
        ) : !currentStep || !templateStep ? (
          <p className="mt-6 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            Waiting to start.
          </p>
        ) : (
          <StepAction
            processId={processId}
            step={currentStep}
            templateStep={templateStep}
            dealFields={DEAL_FIELDS}
            customFieldDefinitions={customFieldDefinitions ?? []}
            dealValues={deal as unknown as Record<string, unknown>}
            dealCustomFieldValues={(deal.custom_fields ?? {}) as Record<string, unknown>}
            nextStepPreview={nextStepPreview}
          />
        )}
      </div>

      <div className="w-full shrink-0 lg:w-80">
        <h2 className="text-sm font-medium text-muted-foreground">Activity log</h2>
        <ul className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
          {(activityLog ?? []).map((entry) => (
            <li key={entry.id} className="text-xs">
              <div className="font-medium text-foreground">{entry.event_type.replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
                {entry.actor_profile_id ? ` — ${actorNameById.get(entry.actor_profile_id) ?? 'Someone'}` : ''}
              </div>
            </li>
          ))}
          {(activityLog ?? []).length === 0 && <li className="text-xs text-muted-foreground">No activity yet.</li>}
        </ul>
      </div>
    </div>
  )
}
