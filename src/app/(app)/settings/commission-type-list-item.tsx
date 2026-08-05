'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CommissionTypeForm } from './commission-type-form'

type CommissionType = {
  id: string
  name: string
  description: string | null
  category: string
  basis: string | null
  value: number
}

export function CommissionTypeListItem({ commissionType }: { commissionType: CommissionType }) {
  const t = useTranslations('Settings')
  const BASIS_LABELS: Record<string, string> = {
    contract_price: t('basisContractPrice'),
    gross_profit: t('basisGrossProfit'),
    current_selling_price: t('basisCurrentSellingPrice'),
  }
  const CATEGORY_LABELS: Record<string, string> = {
    flat: t('categoryFlat'),
    percentage: t('categoryPercentage'),
  }
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className="py-3">
        <CommissionTypeForm
          mode="edit"
          initialValues={{
            id: commissionType.id,
            name: commissionType.name,
            description: commissionType.description ?? '',
            category: commissionType.category === 'percentage' ? 'percentage' : 'flat',
            basis: commissionType.basis ?? 'contract_price',
            value: String(commissionType.value),
          }}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{commissionType.name}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span>
            {commissionType.category === 'flat'
              ? `$${commissionType.value}`
              : `${commissionType.value}% of ${BASIS_LABELS[commissionType.basis ?? ''] ?? commissionType.basis}`}
            {' · '}
            {CATEGORY_LABELS[commissionType.category] ?? commissionType.category}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-xs underline">
            {t('editButton')}
          </button>
        </span>
      </div>
      {commissionType.description && <div className="mt-1 text-muted-foreground">{commissionType.description}</div>}
    </li>
  )
}
