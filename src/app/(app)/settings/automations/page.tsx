import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { AutomationsExplorer } from './automations-explorer'

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
  const [{ data: folders }, { data: templates }] = await Promise.all([
    supabase.from('automation_folders').select('id, name, parent_folder_id').order('name'),
    supabase.from('automation_templates').select('id, name, trigger_type, is_functional, folder_id, deal_types(name)').order('name'),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold">Automations</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure the automated step-by-step workflows (&ldquo;Deal Automations&rdquo;) that run against your deals.
      </p>

      <div className="mt-6 max-w-2xl">
        <AutomationsExplorer folders={folders ?? []} templates={templates ?? []} />
      </div>
    </div>
  )
}
