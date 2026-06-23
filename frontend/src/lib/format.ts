export const percent = (value: number, digits = 2): string => `${(value * 100).toFixed(digits)}%`

export const ratio = (value: number, digits = 2): string => value.toFixed(digits)
