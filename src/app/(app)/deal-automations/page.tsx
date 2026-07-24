import Link from 'next/link'

import { bucketDueDate, type DueBucket } from '@/lib/automations/urgency'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

const BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: 'Overdue Steps',
  due_today: 'Due Today Steps',
  due_this_week: 'Due This Week Steps',
  due_later: 'Due Later Steps',
}

const BUCKET_COLORS: Record<DueBucket, string> = {
  overdue: 'bg-danger/10 text-danger',
  due_today: 'bg-status-for-sale/10 text-status-for-sale',
  due_this_week: 'bg-success/10 text-success',
  due_later: 'bg-muted text-muted-foreground',
}

type DueStepRow = {
  id: string
  dealId: string
  templateName: string
  stepName: string
  dueAt: string
  bucket: DueBucket
  assigneeProfileIds: string[]
}

export default async function DealAutomationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; address?: string; employee?: string }>
}) {
  const { filter, address, employee } = await searchParams
  const activeFilter = filter && filter in BUCKET_LABELS ? (filter as DueBucket) : null

  const profile = await requirePermission('view_whiteboard')
  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Deal Automations</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: deals }, { data: companyProfiles }, { data: roleMembers }] = await Promise.all([
    supabase.from('deals').select('id, address, deal_statuses(name)').eq('company_id', profile.company_id),
    supabase.from('profiles').select('id, name').eq('company_id', profile.company_id).order('name'),
    supabase.from('profile_employee_roles').select('profile_id, employee_role_id'),
  ])

  const dealIds = (deals ?? []).map((deal) => deal.id)
  const dealById = new Map((deals ?? []).map((deal) => [deal.id, deal]))

  const { data: processes } =
    dealIds.length > 0
      ? await supabase
          .from('automation_processes')
          .select('id, template_id, deal_id, status')
          .in('deal_id', dealIds)
          .in('status', ['pending_start', 'running'])
      : { data: [] }

  const processIds = (processes ?? []).map((process) => process.id)
  const templateIds = Array.from(new Set((processes ?? []).map((process) => process.template_id)))

  const [{ data: templates }, { data: dueSteps }] = await Promise.all([
    templateIds.length > 0
      ? supabase.from('automation_templates').select('id, name').in('id', templateIds)
      : Promise.resolve({ data: [] }),
    processIds.length > 0
      ? supabase.from('automation_steps').select('id, process_id, template_step_id, due_at').in('process_id', processIds).eq('status', 'due')
      : Promise.resolve({ data: [] }),
  ])

  const templateNameById = new Map((templates ?? []).map((template) => [template.id, template.name]))
  const processById = new Map((processes ?? []).map((process) => [process.id, process]))

  const templateStepIds = Array.from(new Set((dueSteps ?? []).map((step) => step.template_step_id)))
  const { data: templateSteps } =
    templateStepIds.length > 0
      ? await supabase.from('automation_template_steps').select('id, name, assigned_role_id, assigned_profile_id').in('id', templateStepIds)
      : { data: [] }
  const templateStepById = new Map((templateSteps ?? []).map((step) => [step.id, step]))

  const membersByRole = new Map<string, string[]>()
  for (const row of roleMembers ?? []) {
    const list = membersByRole.get(row.employee_role_id) ?? []
    list.push(row.profile_id)
    membersByRole.set(row.employee_role_id, list)
  }

  const rows: DueStepRow[] = (dueSteps ?? [])
    .map((step): DueStepRow | null => {
      const process = processById.get(step.process_id)
      const templateStep = templateStepById.get(step.template_step_id)
      if (!process || !templateStep) return null
      const assigneeProfileIds = templateStep.assigned_profile_id
        ? [templateStep.assigned_profile_id]
        : templateStep.assigned_role_id
          ? (membersByRole.get(templateStep.assigned_role_id) ?? [])
          : []
      return {
        id: step.id,
        dealId: process.deal_id,
        templateName: templateNameById.get(process.template_id) ?? 'Automation',
        stepName: templateStep.name ?? 'Untitled step',
        dueAt: step.due_at,
        bucket: bucketDueDate(step.due_at),
        assigneeProfileIds,
      }
    })
    .filter((row): row is DueStepRow => row !== null)

  const filteredRows = rows.filter((row) => {
    if (activeFilter && row.bucket !== activeFilter) return false
    if (employee && !row.assigneeProfileIds.includes(employee)) return false
    return true
  })

  const tileCounts: Record<DueBucket, number> = { overdue: 0, due_today: 0, due_this_week: 0, due_later: 0 }
  for (const row of rows) tileCounts[row.bucket] += 1

  const addressQuery = (address ?? '').trim().toLowerCase()
  const rowsByDeal = new Map<string, DueStepRow[]>()
  for (const row of filteredRows) {
    const deal = dealById.get(row.dealId)
    if (addressQuery && !deal?.address.toLowerCase().includes(addressQuery)) continue
    const list = rowsByDeal.get(row.dealId) ?? []
    list.push(row)
    rowsByDeal.set(row.dealId, list)
  }

  function tileHref(bucket: DueBucket) {
    const params = new URLSearchParams()
    if (activeFilter !== bucket) params.set('filter', bucket)
    if (address) params.set('address', address)
    if (employee) params.set('employee', employee)
    const query = params.toString()
    return query ? `/deal-automations?${query}` : '/deal-automations'
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Deal Automations</h1>
      <p className="mt-2 text-sm text-muted-foreground">Automation processes currently running against your deals.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(['overdue', 'due_today', 'due_this_week'] as DueBucket[]).map((bucket) => (
          <Link
            key={bucket}
            href={tileHref(bucket)}
            className={`flex h-24 flex-col justify-center rounded-lg border p-4 transition-colors ${
              activeFilter === bucket ? 'border-brand-600 bg-brand-600/5' : 'border-border bg-background hover:bg-muted/50'
            }`}
          >
            <div className={`w-fit rounded px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide ${BUCKET_COLORS[bucket]}`}>
              {BUCKET_LABELS[bucket]}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{tileCounts[bucket]}</div>
          </Link>
        ))}
        <div className="flex h-24 flex-col justify-center rounded-lg border border-border bg-background p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active Steps</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{rows.length}</div>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        {activeFilter && <input type="hidden" name="filter" value={activeFilter} />}
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            type="text"
            name="address"
            defaultValue={address ?? ''}
            placeholder="Start typing…"
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Employee
          <select name="employee" defaultValue={employee ?? ''} className="rounded border border-input-border bg-input-background px-3 py-2">
            <option value="">Choose an option…</option>
            {(companyProfiles ?? []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded border border-input-border px-4 py-2 text-sm">
          Filter
        </button>
        {(address || employee || activeFilter) && (
          <Link href="/deal-automations" className="text-sm underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-muted-foreground">{rowsByDeal.size} deal(s) with active automations</p>

      <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
        {Array.from(rowsByDeal.entries()).map(([dealId, dealRows]) => {
          const deal = dealById.get(dealId)
          const counts: Record<DueBucket, number> = { overdue: 0, due_today: 0, due_this_week: 0, due_later: 0 }
          for (const row of dealRows) counts[row.bucket] += 1
          const automatorCount = new Set(dealRows.map((row) => row.templateName)).size

          return (
            <li key={dealId} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <Link href={`/deals/${dealId}/automations`} className="text-sm font-medium hover:underline">
                  {deal?.address ?? 'Deal'}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {deal?.deal_statuses?.name} · {automatorCount} automator(s) running
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {(['overdue', 'due_today', 'due_this_week'] as DueBucket[])
                  .filter((bucket) => counts[bucket] > 0)
                  .map((bucket) => (
                    <span key={bucket} className={`rounded px-1.5 py-0.5 font-medium ${BUCKET_COLORS[bucket]}`}>
                      {counts[bucket]} {BUCKET_LABELS[bucket].toLowerCase()}
                    </span>
                  ))}
              </div>
            </li>
          )
        })}
        {rowsByDeal.size === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No deals with active automations.</li>}
      </ul>
    </div>
  )
}
