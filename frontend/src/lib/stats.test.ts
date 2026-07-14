import { describe, expect, it } from 'vitest'
import { annualizedVol, correlation, logReturns, maxDrawdown, stdev } from './stats'

const closes = (values: number[]) => values.map((close) => ({ close }))

describe('logReturns', () => {
  it('returns one fewer value than points', () => {
    expect(logReturns(closes([100, 110, 121]))).toHaveLength(2)
  })

  it('computes log growth', () => {
    const [first] = logReturns(closes([100, 110]))
    expect(first).toBeCloseTo(Math.log(1.1), 10)
  })

  it('skips non-positive prices instead of producing NaN', () => {
    expect(logReturns(closes([100, 0, 120])).every(Number.isFinite)).toBe(true)
  })
})

describe('correlation', () => {
  it('is 1 for identical series', () => {
    expect(correlation([1, 2, 3, 4], [1, 2, 3, 4])).toBeCloseTo(1, 10)
  })

  it('is -1 for perfectly opposed series', () => {
    expect(correlation([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10)
  })

  it('is 0 when one series never moves', () => {
    expect(correlation([1, 2, 3, 4], [5, 5, 5, 5])).toBe(0)
  })

  it('aligns on the most recent overlap when lengths differ', () => {
    expect(correlation([9, 9, 1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10)
  })

  it('is scale invariant', () => {
    const a = [0.01, -0.02, 0.03, -0.01]
    const b = a.map((value) => value * 7)
    expect(correlation(a, b)).toBeCloseTo(1, 10)
  })
})

describe('stdev', () => {
  it('is 0 for a constant series', () => {
    expect(stdev([3, 3, 3])).toBe(0)
  })

  it('uses the sample denominator', () => {
    expect(stdev([2, 4])).toBeCloseTo(Math.sqrt(2), 10)
  })
})

describe('annualizedVol', () => {
  it('scales daily deviation by root 252', () => {
    const points = closes([100, 101, 100, 101, 100, 101])
    const daily = stdev(logReturns(points))
    expect(annualizedVol(points)).toBeCloseTo(daily * Math.sqrt(252), 10)
  })
})

describe('maxDrawdown', () => {
  it('is 0 when prices only rise', () => {
    expect(maxDrawdown(closes([10, 11, 12]))).toBe(0)
  })

  it('measures peak to trough, not first to last', () => {
    expect(maxDrawdown(closes([100, 200, 100, 150]))).toBeCloseTo(-0.5, 10)
  })

  it('is negative for a fall from the running peak', () => {
    expect(maxDrawdown(closes([100, 80]))).toBeCloseTo(-0.2, 10)
  })
})
