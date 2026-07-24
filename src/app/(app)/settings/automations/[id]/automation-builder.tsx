'use client'

import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'

import type { AutomationFolder } from '../types'
import { GeneralSettingsPanel } from './general-settings-panel'
import { StepList } from './step-list'
import type {
  AutomationStep,
  AutomationTemplate,
  CustomFieldOption,
  LookupOption,
  OtherStepOption,
  StepTrigger,
} from './types'

export function AutomationBuilder({
  template,
  steps,
  triggers,
  employeeRoles,
  profiles,
  dealTypes,
  customFieldDefinitions,
  otherTemplates,
  otherSteps,
  dealFields,
  dealDateFields,
  folders,
}: {
  template: AutomationTemplate
  steps: AutomationStep[]
  triggers: StepTrigger[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  dealTypes: LookupOption[]
  customFieldDefinitions: CustomFieldOption[]
  otherTemplates: LookupOption[]
  otherSteps: OtherStepOption[]
  dealFields: DealField[]
  dealDateFields: DealField[]
  folders: AutomationFolder[]
}) {
  const [openStepId, setOpenStepId] = useState<string | null>(null)

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <GeneralSettingsPanel
        template={template}
        dealTypes={dealTypes}
        customFieldDefinitions={customFieldDefinitions}
        otherTemplates={otherTemplates}
        otherSteps={otherSteps}
        dealFields={dealFields}
        dealDateFields={dealDateFields}
        folders={folders}
      />

      <StepList
        templateId={template.id}
        steps={steps}
        triggers={triggers}
        employeeRoles={employeeRoles}
        profiles={profiles}
        customFieldDefinitions={customFieldDefinitions}
        otherTemplates={otherTemplates}
        dealFields={dealFields}
        openStepId={openStepId}
        onOpenStep={setOpenStepId}
      />
    </div>
  )
}
