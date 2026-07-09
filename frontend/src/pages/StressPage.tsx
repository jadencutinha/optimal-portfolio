import { useState } from 'react'
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStress, useUniverse } from '../api/queries'
import type { Objective, StressWindow } from '../api/types'
import { TickerInput } from '../components/TickerInput'
import { percent } from '../lib/format'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'KO']

const OBJECTIVES: { id: Objective; label: string }[] = [
  { id: 'max_sharpe', label: 'Max Sharpe' },
  { id: 'min_variance', label: 'Min Variance' },
  { id: 'risk_parity', label: 'Risk Parity' },
  { id: 'hrp', label: 'Hierarchical RP' },
]

export function StressPage() {
  const universe = useUniverse()
  const stress = useStress()
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [objective, setObjective] = useState<Objective>('max_sharpe')
  const [maxWeightPct, setMaxWeightPct] = useState(35)

  const run = () => {
    stress.mutate({
      tickers,
      objective,
      risk_model: 'sample',
      return_model: 'historical',
      lookback_days: 756,
      min_weight: 0,
      max_weight: maxWeightPct / 100,
    })
  }

  const result = stress.data

  return (
    <div className="stress">
      <div className="stress-intro">
        <h2>Historical stress test</h2>
        <p className="muted">
          Build a portfolio, then replay it through history's worst shocks to see the drawdown it
          would have taken, and how long it took to recover.
        </p>
      </div>

      <section className="panel stress-controls">
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />
        <div className="stress-control-row">
          <div className="field">
            <label>Objective</label>
            <select value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>
              {OBJECTIVES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Max weight per asset: {maxWeightPct}%</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={maxWeightPct}
              onChange={(event) => setMaxWeightPct(Number(event.target.value))}
            />
          </div>
        </div>
        <button className="primary" disabled={tickers.length < 2 || stress.isPending} onClick={run}>
          {stress.isPending ? 'Replaying history…' : 'Run stress test'}
        </button>
        {stress.isError && <p className="error">Couldn't run the stress test. Try again.</p>}
      </section>

      {result && (
        <div className="stress-grid">
          {result.windows.map((window) => (
            <StressCard key={window.key} window={window} />
          ))}
        </div>
      )}
    </div>
  )
}

function StressCard({ window }: { window: StressWindow }) {
  if (!window.available) {
    return (
      <div className="panel stress-card unavailable">
        <h3>{window.label}</h3>
        <p className="muted">{window.description}</p>
        <p className="stress-nodata">No price history available for these tickers in this period.</p>
      </div>
    )
  }

  const totalReturn = window.total_return ?? 0
  const positive = totalReturn >= 0
  const chartData = window.curve.map((point) => ({ date: point.date, equity: point.equity }))

  return (
    <div className="panel stress-card">
      <div className="stress-card-head">
        <h3>{window.label}</h3>
        <span className="stress-dates">
          {window.start} → {window.end}
        </span>
      </div>
      <p className="muted stress-desc">{window.description}</p>

      <div className="stress-chart">
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${window.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              formatter={(value: number) => `${((value - 1) * 100).toFixed(1)}%`}
              labelFormatter={(label: string) => label}
            />
            <ReferenceLine y={1} stroke="var(--border)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="var(--accent)"
              strokeWidth={2}
              fill={`url(#grad-${window.key})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="stress-metrics">
        <div className="stress-metric">
          <span className="stress-metric-label">Total return</span>
          <span className={`stress-metric-value ${positive ? 'up' : 'down'}`}>
            {positive ? '+' : ''}
            {percent(totalReturn, 1)}
          </span>
        </div>
        <div className="stress-metric">
          <span className="stress-metric-label">Max drawdown</span>
          <span className="stress-metric-value down">{percent(window.max_drawdown ?? 0, 1)}</span>
        </div>
        <div className="stress-metric">
          <span className="stress-metric-label">Recovery</span>
          <span className="stress-metric-value">
            {window.recovered ? `${window.recovery_days} days` : 'Not recovered'}
          </span>
        </div>
      </div>

      {window.missing_tickers.length > 0 && (
        <p className="stress-missing">
          No history for {window.missing_tickers.join(', ')} in this window, weights renormalized over the
          rest.
        </p>
      )}
    </div>
  )
}
