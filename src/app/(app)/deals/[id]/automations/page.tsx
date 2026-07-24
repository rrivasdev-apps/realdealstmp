import Link from 'next/link'
import { notFound } from 'next/navigation'

import { computeProcessProgress } from '@/lib/automations/urgency'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { StartAutomationButton } from './start-automation-button'

export default async function DealAutomationsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('view_deal_detail')
  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Deal automations</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this deal.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('id, address, company_id').eq('id', id).single()
  if (!deal || deal.company_id !== profile.company_id) {
    notFound()
  }

  const [{ data: processes }, { data: availableTemplates }] = await Promise.all([
    supabase.from('automation_processes').select('id, template_id, status, started_at, completed_at').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('automation_templates').select('id, name').eq('company_id', profile.company_id).eq('is_functional', true).order('name'),
  ])

  const templateIds = Array.from(new Set((processes ?? []).map((process) => process.template_id)))
  const { data: templates } = templateIds.length > 0 ? await supabase.from('automation_templates').select('id, name').in('id', templateIds) : { data: [] }
  const templateNameById = new Map((templates ?? []).map((template) => [template.id, template.name]))

  const processIds = (processes ?? []).map((process) => process.id)
  const [{ data: completedSteps }, { data: currentSteps }] = await Promise.all([
    processIds.length > 0
      ? supabase.from('automation_steps').select('process_id').in('process_id', processIds).eq('status', 'completed')
      : Promise.resolve({ data: [] }),
    processIds.length > 0
      ? supabase.from('automation_steps').select('process_id, template_step_id, due_at').in('process_id', processIds).eq('status', 'due')
      : Promise.resolve({ data: [] }),
  ])

  const completedCountByProcess = new Map<string, number>()
  for (const row of completedSteps ?? []) completedCountByProcess.set(row.process_id, (completedCountByProcess.get(row.process_id) ?? 0) + 1)
  const currentStepByProcess = new Map((currentSteps ?? []).map((row) => [row.process_id, row]))

  const templateStepIds = Array.from(new Set((currentSteps ?? []).map((row) => row.template_step_id)))
  const { data: templateSteps } =
    templateStepIds.length > 0 ? await supabase.from('automation_template_steps').select('id, name').in('id', templateStepIds) : { data: [] }
  const templateStepNameById = new Map((templateSteps ?? []).map((step) => [step.id, step.name]))

  const totalStepCountByTemplate = new Map<string, number>()
  for (const templateId of templateIds) {
    const { count } = await supabase.from('automation_template_steps').select('id', { count: 'exact', head: true }).eq('template_id', templateId)
    totalStepCountByTemplate.set(templateId, count ?? 0)
  }

  const running = (processes ?? []).filter((process) => process.status !== 'completed')
  const completed = (processes ?? []).filter((process) => process.status === 'completed')

  function renderProcessRow(process: NonNullable<typeof processes>[number]) {
    const currentStep = currentStepByProcess.get(process.id)
    const progress = computeProcessProgress({
      completedStepCount: completedCountByProcess.get(process.id) ?? 0,
      templateStepCount: totalStepCountByTemplate.get(process.template_id) ?? 0,
      status: process.status as 'pending_start' | 'running' | 'completed',
    })

    return (
      <li key={process.id} className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <Link href={`/deals/${id}/automations/${process.id}`} className="text-sm font-medium hover:underline">
            {templateNameById.get(process.template_id) ?? 'Automation'}
          </Link>
          {currentStep && (
            <p className="text-xs text-muted-foreground">
              {templateStepNameById.get(currentStep.template_step_id) ?? 'Untitled step'} — due {currentStep.due_at}
            </p>
          )}
        </div>
        <div className="flex w-32 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </li>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Deal automations</h1>
          <p className="mt-1 text-sm text-muted-foreground">{deal.address}</p>
        </div>
        <Link href={`/deals/${id}`} className="text-sm underline">
          Go to deal
        </Link>
      </div>

      <div className="mt-6">
        <StartAutomationButton dealId={id} availableTemplates={availableTemplates ?? []} />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">{running.length} running process(es)</h2>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
          {running.map(renderProcessRow)}
          {running.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No processes running.</li>}
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">{completed.length} completed process(es)</h2>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
          {completed.map(renderProcessRow)}
          {completed.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No completed processes yet.</li>}
        </ul>
      </div>
    </div>
  )
}
