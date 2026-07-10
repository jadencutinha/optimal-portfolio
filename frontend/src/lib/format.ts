export const percent = (value: number, digits = 2): string => `${(value * 100).toFixed(digits)}%`

export const ratio = (value: number, digits = 2): string => value.toFixed(digits)

export const money = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${Math.round(value)}`
}

export const exactMoney = (value: number): string =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
