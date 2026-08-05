import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { getDealDateFields, getDealFields } from '@/lib/automations/labels'

import { AutomationBuilder } from './automation-builder'

export default async function AutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('Automations')
  const profile = await requirePermission('can_manage_settings')

  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('automationFallback')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermissionSettings')}</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [
    { data: template },
    { data: steps },
    { data: employeeRoles },
    { data: profiles },
    { data: dealTypes },
    { data: customFieldDefinitions },
    { data: otherTemplates },
    { data: otherSteps },
    { data: folders },
  ] = await Promise.all([
    supabase.from('automation_templates').select('*').eq('id', id).single(),
    supabase.from('automation_template_steps').select('*').eq('template_id', id).order('step_number'),
    supabase.from('employee_roles').select('id, name').order('name'),
    supabase.from('profiles').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('custom_field_definitions').select('id, name, field_type').order('name'),
    supabase.from('automation_templates').select('id, name').neq('id', id).order('name'),
    supabase.from('automation_template_steps').select('id, name, template_id').neq('template_id', id).order('name'),
    supabase.from('automation_folders').select('id, name, parent_folder_id').order('name'),
  ])

  if (!template || template.company_id !== profile.company_id) {
    notFound()
  }

  const stepIds = (steps ?? []).map((step) => step.id)
  const { data: triggers } =
    stepIds.length > 0
      ? await supabase.from('automation_template_step_triggers').select('*').in('step_id', stepIds)
      : { data: [] }

  return (
    <div>
      <AutomationBuilder
        template={template}
        steps={steps ?? []}
        triggers={triggers ?? []}
        employeeRoles={employeeRoles ?? []}
        profiles={profiles ?? []}
        dealTypes={dealTypes ?? []}
        customFieldDefinitions={customFieldDefinitions ?? []}
        otherTemplates={otherTemplates ?? []}
        otherSteps={otherSteps ?? []}
        dealFields={getDealFields(t)}
        dealDateFields={getDealDateFields(t)}
        folders={folders ?? []}
      />
    </div>
  )
}
