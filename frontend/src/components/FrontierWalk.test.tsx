import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FrontierWalk } from './FrontierWalk'
import type { FrontierResponse, WeightAllocation } from '../api/types'

const TICKERS = ['NVDA', 'AAPL', 'JNJ']

// Risk and return both climb left to right, and the mix rotates out of the
// defensive name (JNJ) into the growth name (NVDA).
function buildFrontier(n = 25): FrontierResponse {
  const points = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const raw: Record<string, number> = {
      NVDA: 0.02 + t * 0.6,
      AAPL: 0.3,
      JNJ: 0.5 * (1 - t),
    }
    const sum = Object.values(raw).reduce((a, b) => a + b, 0)
    const weights: WeightAllocation[] = TICKERS.map((ticker) => ({ ticker, weight: raw[ticker] / sum }))
    const volatility = 0.1 + t * 0.2
    const expected_return = 0.05 + t * 0.2
    return { volatility, expected_return, sharpe_ratio: (expected_return - 0.04) / volatility, weights }
  })
  return {
    provider: 'fmp',
    risk_model: 'sample',
    as_of_start: '2021-01-01',
    as_of_end: '2026-01-01',
    risk_free_rate: 0.04,
    points,
    min_variance_index: 0,
    tangency_index: 10,
  }
}

const PORTFOLIO = { expected_return: 0.15, volatility: 0.2, sharpe_ratio: 0.55 }

const slider = () => screen.getByRole('slider')

const weightOf = (ticker: string) => {
  const row = screen.getByText(ticker).closest('.fwalk__bar') as HTMLElement
  return Number(row.querySelector('.fwalk__pct')!.textContent!.replace('%', ''))
}

const readReturn = () => Number(screen.getByText(/Expected return/i).nextSibling?.textContent?.replace('%', ''))

describe('FrontierWalk', () => {
  it('starts on the max-Sharpe (tangency) point', () => {
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={() => {}} />)

    // tangency_index 10 of 24 spans -> t = 10/24
    const expected = 0.05 + (10 / 24) * 0.2
    expect(readReturn()).toBeCloseTo(expected * 100, 1)
  })

  it('walks toward more risk and more return on ArrowRight, and rotates the weights', () => {
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={() => {}} />)

    const startReturn = readReturn()
    const startNvda = weightOf('NVDA')
    const startJnj = weightOf('JNJ')

    for (let i = 0; i < 20; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowRight' })

    expect(readReturn()).toBeGreaterThan(startReturn)
    // Weights must actually re-form, not just the headline numbers.
    expect(weightOf('NVDA')).toBeGreaterThan(startNvda)
    expect(weightOf('JNJ')).toBeLessThan(startJnj)
  })

  it('walks back toward less risk on ArrowLeft', () => {
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={() => {}} />)

    const startReturn = readReturn()
    for (let i = 0; i < 20; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowLeft' })

    expect(readReturn()).toBeLessThan(startReturn)
    expect(weightOf('JNJ')).toBeGreaterThan(0)
  })

  it('clamps at both ends of the curve', () => {
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={() => {}} />)

    for (let i = 0; i < 400; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowRight' })
    expect(readReturn()).toBeCloseTo(25, 1) // 0.05 + 0.2 at t = 1
    expect(slider()).toHaveAttribute('aria-valuenow', '100')

    for (let i = 0; i < 400; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowLeft' })
    expect(readReturn()).toBeCloseTo(5, 1) // t = 0
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
  })

  it('interpolates between the discrete frontier points', () => {
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={() => {}} />)

    for (let i = 0; i < 400; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowLeft' })
    // One 1% step lands between point 0 and point 1 (which are 1/24 apart).
    fireEvent.keyDown(slider(), { key: 'ArrowRight' })

    const between = readReturn()
    expect(between).toBeGreaterThan(5)
    expect(between).toBeLessThan(0.05 * 100 + (1 / 24) * 20)
  })

  it('adopts the nearest real frontier point, not the interpolated one', () => {
    const onAdopt = vi.fn()
    render(<FrontierWalk frontier={buildFrontier()} portfolio={PORTFOLIO} onAdopt={onAdopt} />)

    for (let i = 0; i < 400; i += 1) fireEvent.keyDown(slider(), { key: 'ArrowRight' })
    fireEvent.click(screen.getByRole('button', { name: /use this portfolio/i }))

    expect(onAdopt).toHaveBeenCalledWith(24)
  })
})
