'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { CurrencyInput } from '@/components/currency-input'

type LookupOption = { id: string; name: string }

export type DealExpense = {
  id: string
  category_id: string
  categoryName: string | null
  description: string | null
  amount: number
  expense_date: string | null
}

type ExpenseFormState = {
  category_id: string
  description: string
  amount: string
  expense_date: string
}

const EMPTY_FORM: ExpenseFormState = { category_id: '', description: '', amount: '', expense_date: '' }

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// Itemized expense line items for a deal, categorized via the company's
// expense_categories list (Settings > Expense Categories). Persists
// immediately per line item (same pattern as ListingsPanel/DealEmployeeForm)
// rather than deferring to the deal form's own Save -- deals.total_expenses
// is a DB-trigger-maintained rollup of this table now, not a manual field,
// so there's nothing left for the parent form to submit for it.
export function ExpensesPanel({
  dealId,
  initialExpenses,
  expenseCategories,
  onTotalChange,
}: {
  dealId: string
  initialExpenses: DealExpense[]
  expenseCategories: LookupOption[]
  onTotalChange?: (total: number) => void
}) {
  const t = useTranslations('Expenses')
  const [expenses, setExpenses] = useState(initialExpenses)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ExpenseFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onTotalChange?.(expenses.reduce((sum, expense) => sum + expense.amount, 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses])

  function startAdd() {
    setEditingId('new')
    setForm(EMPTY_FORM)
    setError(null)
  }

  function startEdit(expense: DealExpense) {
    setEditingId(expense.id)
    setForm({
      category_id: expense.category_id,
      description: expense.description ?? '',
      amount: expense.amount.toString(),
      expense_date: expense.expense_date ?? '',
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    if (!form.category_id) {
      setError(t('errorCategoryRequired'))
      return
    }
    const amount = Number(form.amount)
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      setError(t('errorAmountPositive'))
      return
    }
    setSubmitting(true)
    setError(null)

    const isNew = editingId === 'new'
    const url = isNew ? `/api/deals/${dealId}/expenses` : `/api/deals/${dealId}/expenses/${editingId}`
    const response = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: form.category_id,
        amount,
        description: form.description || null,
        expense_date: form.expense_date || null,
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('errorCouldNotSave'))
      return
    }

    const categoryName = expenseCategories.find((option) => option.id === form.category_id)?.name ?? null
    const savedExpense: DealExpense = {
      id: isNew ? result.id : (editingId as string),
      category_id: form.category_id,
      categoryName,
      description: form.description || null,
      amount,
      expense_date: form.expense_date || null,
    }

    setExpenses((prev) =>
      isNew ? [...prev, savedExpense] : prev.map((expense) => (expense.id === editingId ? savedExpense : expense))
    )
    cancelEdit()
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/deals/${dealId}/expenses/${id}`, { method: 'DELETE' })
    if (!response.ok) return
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    if (editingId === id) cancelEdit()
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{t('expenses')}</span>
        {editingId === null && (
          <button type="button" onClick={startAdd} className="text-xs underline">
            {t('addExpense')}
          </button>
        )}
      </div>

      {expenses.length === 0 && editingId === null && (
        <p className="text-xs text-muted-foreground">{t('noExpensesYet')}</p>
      )}

      <ul className="flex flex-col gap-1">
        {expenses.map((expense) =>
          editingId === expense.id ? (
            <li key={expense.id} className="rounded border border-border p-2">
              <ExpenseForm
                form={form}
                setForm={setForm}
                expenseCategories={expenseCategories}
                onSave={handleSave}
                onCancel={cancelEdit}
                submitting={submitting}
                error={error}
              />
            </li>
          ) : (
            <li key={expense.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5">
              <div>
                <div className="font-medium">{expense.categoryName ?? t('uncategorized')}</div>
                <div className="text-xs text-muted-foreground">
                  {[expense.description, expense.expense_date].filter(Boolean).join(' · ') || t('noDetails')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{currency.format(expense.amount)}</span>
                <button type="button" onClick={() => startEdit(expense)} className="text-xs underline">
                  {t('edit')}
                </button>
                <button type="button" onClick={() => handleDelete(expense.id)} className="text-xs text-danger">
                  {t('remove')}
                </button>
              </div>
            </li>
          )
        )}
        {editingId === 'new' && (
          <li className="rounded border border-border p-2">
            <ExpenseForm
              form={form}
              setForm={setForm}
              expenseCategories={expenseCategories}
              onSave={handleSave}
              onCancel={cancelEdit}
              submitting={submitting}
              error={error}
            />
          </li>
        )}
      </ul>

      {expenses.length > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
          <span>{t('totalExpenses')}</span>
          <span>{currency.format(total)}</span>
        </div>
      )}
    </div>
  )
}

function ExpenseForm({
  form,
  setForm,
  expenseCategories,
  onSave,
  onCancel,
  submitting,
  error,
}: {
  form: ExpenseFormState
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>
  expenseCategories: LookupOption[]
  onSave: () => void
  onCancel: () => void
  submitting: boolean
  error: string | null
}) {
  const t = useTranslations('Expenses')
  return (
    <div className="flex flex-col gap-2.5">
      <label className="field-label">
        {t('category')}
        <select
          value={form.category_id}
          onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
          className="field-input px-2 py-1"
        >
          <option value="">—</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        {t('amount')}
        <CurrencyInput
          value={form.amount}
          onChange={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          className="field-input px-2 py-1"
        />
      </label>
      <label className="field-label">
        {t('date')}
        <input
          type="date"
          value={form.expense_date}
          onChange={(event) => setForm((prev) => ({ ...prev, expense_date: event.target.value }))}
          className="field-input px-2 py-1"
        />
      </label>
      <label className="field-label">
        {t('description')}
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={2}
          className="field-input px-2 py-1"
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className="btn-primary px-3 py-1 text-xs"
        >
          {submitting ? t('saving') : t('save')}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground underline">
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
