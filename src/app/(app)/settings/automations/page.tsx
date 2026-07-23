import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { NewAutomationButton } from './new-automation-button'

const TRIGGER_LABELS: Record<string, string> = {
  deal_created: 'Any deal is created',
  field_changed: 'A field value changes',
  custom_field_changed: 'A custom field value changes',
  step_completed: 'Another automation finishes a step',
  date_based: 'A date field is reached',
}

export default async function AutomationsPage() {
  const profile = await requirePermission('can_manage_settings')

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Automations</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to manage settings.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('automation_templates')
    .select('id, name, trigger_type, is_functional, deal_types(name)')
    .order('name')

  return (
    <div>
      <h1 className="text-xl font-semibold">Automations</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure the automated step-by-step workflows (&ldquo;Deal Automations&rdquo;) that run against your deals.
      </p>

      <div className="mt-6 max-w-2xl">
        <NewAutomationButton />
      </div>

      <ul className="mt-2 max-w-2xl divide-y divide-border rounded-lg border border-border bg-background">
        {(templates ?? []).map((template) => (
          <li key={template.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <Link href={`/settings/automations/${template.id}`} className="text-sm font-medium hover:underline">
                {template.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {TRIGGER_LABELS[template.trigger_type] ?? template.trigger_type}
                {template.deal_types ? ` — ${template.deal_types.name}` : ''}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                template.is_functional ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              }`}
            >
              {template.is_functional ? 'Functional' : 'Not functional'}
            </span>
          </li>
        ))}
        {(templates ?? []).length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No automations yet.</li>}
      </ul>
    </div>
  )
}
