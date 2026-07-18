'use client'

import { useState } from 'react'

type LookupOption = { id: string; name: string }

// Unlike the known checklist items (part of the main form's submit),
// custom items save immediately on click -- same reasoning as
// Offers/Showings/Employees below the form: there's no extra data to batch,
// so there's nothing to gain from waiting for "Save changes."
export function CustomChecklistItems({
  dealId,
  availableItems,
  initialCheckedIds,
}: {
  dealId: string
  availableItems: LookupOption[]
  initialCheckedIds: string[]
}) {
  const [checkedIds, setCheckedIds] = useState<string[]>(initialCheckedIds)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggle(itemId: string, checked: boolean) {
    setPendingId(itemId)

    if (checked) {
      setCheckedIds((prev) => [...prev, itemId])
      await fetch(`/api/deals/${dealId}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_item_id: itemId }),
      })
    } else {
      setCheckedIds((prev) => prev.filter((id) => id !== itemId))
      await fetch(`/api/deals/${dealId}/checklist-items/${itemId}`, { method: 'DELETE' })
    }

    setPendingId(null)
  }

  if (availableItems.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-xs font-medium text-muted-foreground">Custom checklist items</span>
      {availableItems.map((item) => (
        <label key={item.id} className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={checkedIds.includes(item.id)}
            disabled={pendingId === item.id}
            onChange={(event) => toggle(item.id, event.target.checked)}
          />
          {item.name}
        </label>
      ))}
    </div>
  )
}
