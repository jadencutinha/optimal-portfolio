import { useState } from 'react'
import { useComparePortfolios, useMe, useUniverse, type ComparisonSlot } from '../api/queries'
import type { Objective, OptimizeRequest, RiskModel } from '../api/types'
import { CompareResults } from '../components/CompareResults'
import { EmptyState } from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { TickerInput } from '../components/TickerInput'
import { ADVANCED_OBJECTIVES, ADVANCED_RISK, LOOKBACKS, OBJECTIVES, RISK_MODELS } from '../lib/objectives'
import { SERIES_COLORS } from '../lib/series'

const MAX_SLOTS = 4
const SLOT_NAMES = ['Portfolio A', 'Portfolio B', 'Portfolio C', 'Portfolio D']

interface SlotConfig {
  id: string
  name: string
  tickers: string[]
  objective: Objective
  riskModel: RiskModel
  lookbackDays: number
  maxWeightPct: number
}

const makeSlot = (index: number, tickers: string[], objective: Objective): SlotConfig => ({
  id: `slot-${index}-${Date.now()}`,
  name: SLOT_NAMES[index],
  tickers,
  objective,
  riskModel: 'sample',
  lookbackDays: 756,
  maxWeightPct: 35,
})

const INITIAL_SLOTS: SlotConfig[] = [
  makeSlot(0, ['AAPL', 'MSFT', 'GOOGL', 'AMZN'], 'max_sharpe'),
  makeSlot(1, ['AAPL', 'JPM', 'JNJ', 'XOM', 'KO'], 'min_variance'),
]

const toRequest = (slot: SlotConfig): OptimizeRequest => ({
  tickers: slot.tickers,
  objective: slot.objective,
  risk_model: slot.riskModel,
  return_model: 'historical',
  lookback_days: slot.lookbackDays,
  min_weight: 0,
  max_weight: slot.maxWeightPct / 100,
})

export function SideBySidePage() {
  const universe = useUniverse()
  const me = useMe()
  const compare = useComparePortfolios()

  const [slots, setSlots] = useState<SlotConfig[]>(INITIAL_SLOTS)

  const entitlements = (me.data?.entitlements ?? {}) as Record<string, unknown>
  const pro = Boolean(entitlements.advanced_optimizers)
  const dailyOptimizations = entitlements.daily_optimizations

  const update = (id: string, patch: Partial<SlotConfig>) =>
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)))

  const addSlot = () =>
    setSlots((current) => {
      if (current.length >= MAX_SLOTS) return current
      const taken = new Set(current.map((slot) => slot.name))
      const nameIndex = SLOT_NAMES.findIndex((name) => !taken.has(name))
      return [...current, makeSlot(nameIndex === -1 ? current.length : nameIndex, ['AAPL', 'MSFT'], 'max_sharpe')]
    })

  const removeSlot = (id: string) =>
    setSlots((current) => (current.length <= 2 ? current : current.filter((slot) => slot.id !== id)))

  const invalid = slots.filter((slot) => slot.tickers.length < 2)
  const canRun = invalid.length === 0 && !compare.isPending

  const run = () => {
    const payload: ComparisonSlot[] = slots.map((slot) => ({
      id: slot.id,
      label: slot.name,
      request: toRequest(slot),
    }))
    compare.mutate(payload)
  }

  return (
    <div className="side-by-side">
      <div className="planner-intro">
        <h2>Side by side</h2>
        <p className="muted">
          Optimize several portfolios at once, each with its own tickers and objective, and compare
          them on one screen. Nothing has to be saved first.
        </p>
      </div>

      {!pro && typeof dailyOptimizations === 'number' && (
        <div className="free-banner">
          Free plan · each portfolio here uses one of your {dailyOptimizations} daily optimizer runs, so this
          comparison costs {slots.length}
        </div>
      )}

      <div className="compare-slots">
        {slots.map((slot, index) => (
          <section className="panel compare-slot" key={slot.id}>
            <div className="compare-slot-head">
              <span className="series-swatch" style={{ background: SERIES_COLORS[index] }} aria-hidden="true" />
              <input
                className="compare-slot-name"
                value={slot.name}
                aria-label={`Name for portfolio ${index + 1}`}
                onChange={(event) => update(slot.id, { name: event.target.value })}
              />
              {slots.length > 2 && (
                <button
                  type="button"
                  className="compare-slot-remove"
                  aria-label={`Remove ${slot.name}`}
                  onClick={() => removeSlot(slot.id)}
                >
                  ×
                </button>
              )}
            </div>

            <TickerInput
              tickers={slot.tickers}
              suggestions={universe.data?.assets ?? []}
              onChange={(tickers) => update(slot.id, { tickers })}
            />

            <div className="field">
              <label>Objective</label>
              <select
                value={slot.objective}
                onChange={(event) => update(slot.id, { objective: event.target.value as Objective })}
              >
                {OBJECTIVES.map((option) => {
                  const locked = !pro && ADVANCED_OBJECTIVES.has(option.value)
                  return (
                    <option key={option.value} value={option.value} disabled={locked}>
                      {option.label}
                      {locked ? ' (Pro)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="field">
              <label>Risk model</label>
              <select
                value={slot.riskModel}
                onChange={(event) => update(slot.id, { riskModel: event.target.value as RiskModel })}
              >
                {RISK_MODELS.map((option) => {
                  const locked = !pro && ADVANCED_RISK.has(option.value)
                  return (
                    <option key={option.value} value={option.value} disabled={locked}>
                      {option.label}
                      {locked ? ' (Pro)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="field">
              <label>Lookback window</label>
              <select
                value={slot.lookbackDays}
                onChange={(event) => update(slot.id, { lookbackDays: Number(event.target.value) })}
              >
                {LOOKBACKS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Max weight per asset: {slot.maxWeightPct}%</label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={slot.maxWeightPct}
                onChange={(event) => update(slot.id, { maxWeightPct: Number(event.target.value) })}
              />
            </div>

            {slot.tickers.length < 2 && <p className="error">Add at least 2 tickers.</p>}
          </section>
        ))}

        {slots.length < MAX_SLOTS && (
          <button type="button" className="compare-add" onClick={addSlot}>
            <span aria-hidden="true">+</span>
            Add portfolio
          </button>
        )}
      </div>

      <div className="compare-run">
        <button className="primary" disabled={!canRun} onClick={run}>
          {compare.isPending ? 'Optimizing…' : `Compare all ${slots.length}`}
        </button>
      </div>

      <section className="panel compare-output">
        <h2>Comparison</h2>
        {compare.isPending && <Loader fullscreen={false} label="Optimizing every portfolio…" />}
        {!compare.data && !compare.isPending && (
          <EmptyState
            icon="⚖"
            title="Nothing compared yet"
            description="Configure each portfolio above, then run them together to see them side by side."
          />
        )}
        {compare.data && !compare.isPending && <CompareResults outcomes={compare.data} />}
      </section>
    </div>
  )
}
