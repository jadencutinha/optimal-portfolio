import { useState } from 'react'

interface Props {
  id?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number | 'any'
  integer?: boolean
}

export function NumberInput({ id, value, onChange, min, max, step, integer = false }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  const display = draft ?? String(value)

  const handleChange = (raw: string) => {
    const normalized = raw.replace(/^(-?)0+(?=\d)/, '$1')
    setDraft(normalized)
    if (normalized === '' || normalized === '-') return
    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) return
    onChange(parsed)
  }

  const handleBlur = () => {
    setDraft(null)
    let settled = value
    if (integer) settled = Math.round(settled)
    if (min !== undefined && settled < min) settled = min
    if (max !== undefined && settled > max) settled = max
    if (settled !== value) onChange(settled)
  }

  return (
    <input
      id={id}
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={display}
      min={min}
      max={max}
      step={step}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  )
}
