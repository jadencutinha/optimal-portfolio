export const TRADING_DAYS = 252

export function logReturns(points: { close: number }[]): number[] {
  const out: number[] = []
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1].close
    const current = points[i].close
    if (previous > 0 && current > 0) out.push(Math.log(current / previous))
  }
  return out
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function annualizedVol(points: { close: number }[]): number {
  return stdev(logReturns(points)) * Math.sqrt(TRADING_DAYS)
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0
  const left = a.slice(a.length - n)
  const right = b.slice(b.length - n)
  const meanLeft = left.reduce((sum, value) => sum + value, 0) / n
  const meanRight = right.reduce((sum, value) => sum + value, 0) / n
  let cov = 0
  let varLeft = 0
  let varRight = 0
  for (let i = 0; i < n; i += 1) {
    const dl = left[i] - meanLeft
    const dr = right[i] - meanRight
    cov += dl * dr
    varLeft += dl * dl
    varRight += dr * dr
  }
  if (varLeft === 0 || varRight === 0) return 0
  return cov / Math.sqrt(varLeft * varRight)
}

export function maxDrawdown(points: { close: number }[]): number {
  let peak = -Infinity
  let worst = 0
  points.forEach(({ close }) => {
    if (close > peak) peak = close
    if (peak > 0) worst = Math.min(worst, close / peak - 1)
  })
  return worst
}
