'use client'

import { useState } from 'react'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// Plain type="number" inputs can't display "$60,000.00" and stay editable --
// browsers reject the non-numeric characters. This shows the formatted
// value while at rest and the raw number while focused, so typing never
// fights with comma/currency-symbol insertion.
export function CurrencyInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const displayValue =
    !focused && value !== '' && !Number.isNaN(Number(value)) ? currency.format(Number(value)) : value

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const raw = event.target.value.replace(/[^0-9.]/g, '')
        onChange(raw)
      }}
      className={className}
    />
  )
}
