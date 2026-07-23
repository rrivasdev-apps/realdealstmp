'use client'

import type { AutomationStep, LookupOption } from '../types'

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-border bg-background p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export type AssigneeValue = { assigned_role_id: string | null; assigned_profile_id: string | null }

// A never-assigned step comes back from the DB as { null, null }. The role
// <select> below still visually shows its first <option> as selected in that
// case (an unmatched empty value falls back to the first option in every
// browser), so the submitted value needs to actually match what's shown --
// otherwise saving without touching this control sends an invalid payload.
// Per the reference doc, every step defaults to whichever role is named
// "Transaction Coordinator" (falling back to the first role if none matches,
// or null -- forcing "Specific user" -- if the company has no roles at all).
export function initialAssigneeValue(source: AssigneeValue, employeeRoles: LookupOption[]): AssigneeValue {
  if (source.assigned_role_id || source.assigned_profile_id) return source
  const transactionCoordinator = employeeRoles.find((role) => role.name.trim().toLowerCase() === 'transaction coordinator')
  const defaultRoleId = transactionCoordinator?.id ?? employeeRoles[0]?.id ?? null
  return { assigned_role_id: defaultRoleId, assigned_profile_id: null }
}

export function AssigneeFields({
  value,
  onChange,
  employeeRoles,
  profiles,
}: {
  value: AssigneeValue
  onChange: (value: AssigneeValue) => void
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
}) {
  const mode = value.assigned_profile_id ? 'user' : 'role'

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span>Task assignee</span>
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded border border-input-border">
          <button
            type="button"
            onClick={() => onChange({ assigned_role_id: employeeRoles[0]?.id ?? null, assigned_profile_id: null })}
            className={`px-3 py-1.5 text-sm ${mode === 'role' ? 'bg-foreground text-background' : ''}`}
          >
            Assign to role
          </button>
          <button
            type="button"
            onClick={() => onChange({ assigned_role_id: null, assigned_profile_id: profiles[0]?.id ?? null })}
            className={`px-3 py-1.5 text-sm ${mode === 'user' ? 'bg-foreground text-background' : ''}`}
          >
            Specific user
          </button>
        </div>

        {mode === 'role' ? (
          <select
            value={value.assigned_role_id ?? ''}
            onChange={(event) => onChange({ assigned_role_id: event.target.value, assigned_profile_id: null })}
            className="flex-1 rounded border border-input-border bg-input-background px-3 py-2"
          >
            {employeeRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={value.assigned_profile_id ?? ''}
            onChange={(event) => onChange({ assigned_role_id: null, assigned_profile_id: event.target.value })}
            className="flex-1 rounded border border-input-border bg-input-background px-3 py-2"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

export type NextStepValue = {
  next_step_id: string | null
  completes_automator: boolean
  next_step_due_delay_days: number | null
}

// A never-configured step (or option) comes back from the DB as
// { next_step_id: null, completes_automator: false } -- neither "go to a step"
// nor "complete" yet. NextStepFields' buttons visually default to showing
// "Complete" highlighted whenever next_step_id is null, so the underlying
// value needs to actually match that (completes_automator: true) from the
// start -- otherwise submitting without touching this control sends an
// invalid payload the server rejects.
export function initialNextStepValue(source: NextStepValue): NextStepValue {
  if (source.next_step_id || source.completes_automator) return source
  return { next_step_id: null, completes_automator: true, next_step_due_delay_days: null }
}

export function NextStepFields({
  value,
  onChange,
  availableSteps,
  label = 'Then',
}: {
  value: NextStepValue
  onChange: (value: NextStepValue) => void
  availableSteps: AutomationStep[]
  label?: string
}) {
  const goesToStep = Boolean(value.next_step_id)

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-input-border w-fit">
        <button
          type="button"
          onClick={() =>
            onChange({
              next_step_id: availableSteps[0]?.id ?? null,
              completes_automator: false,
              next_step_due_delay_days: value.next_step_due_delay_days ?? 0,
            })
          }
          disabled={availableSteps.length === 0}
          className={`px-3 py-1.5 text-sm disabled:opacity-50 ${goesToStep ? 'bg-foreground text-background' : ''}`}
        >
          Go to another step
        </button>
        <button
          type="button"
          onClick={() => onChange({ next_step_id: null, completes_automator: true, next_step_due_delay_days: null })}
          className={`px-3 py-1.5 text-sm ${!goesToStep ? 'bg-foreground text-background' : ''}`}
        >
          Complete the automation
        </button>
      </div>

      {goesToStep && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Next step
            <select
              value={value.next_step_id ?? ''}
              onChange={(event) =>
                onChange({ ...value, next_step_id: event.target.value, completes_automator: false })
              }
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              {availableSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  Step {step.step_number}
                  {step.name ? ` — ${step.name}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Days until due
            <input
              type="number"
              min={0}
              value={value.next_step_due_delay_days ?? 0}
              onChange={(event) => onChange({ ...value, next_step_due_delay_days: Number(event.target.value) })}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
        </div>
      )}
    </div>
  )
}

export function TriggerAutomationFields({
  targetIds,
  onChange,
  otherTemplates,
  label = 'If you want this step, when completed, to trigger another automation, select it below.',
}: {
  targetIds: string[]
  onChange: (targetIds: string[]) => void
  otherTemplates: LookupOption[]
  label?: string
}) {
  function toggle(id: string) {
    onChange(targetIds.includes(id) ? targetIds.filter((existing) => existing !== id) : [...targetIds, id])
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {otherTemplates.length === 0 ? (
        <span className="text-muted-foreground">No other automations to trigger yet.</span>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {otherTemplates.map((template) => (
            <label key={template.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={targetIds.includes(template.id)} onChange={() => toggle(template.id)} />
              {template.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
