import { useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useOptimize, usePlan } from '../api/queries'
import type { OptimizeRequest, PlanResponse } from '../api/types'
import { percent } from '../lib/format'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'PG']

const optimizeRequest: OptimizeRequest = {
  tickers: DEFAULT_TICKERS,
  objective: 'max_sharpe',
  risk_model: 'sample',
  return_model: 'historical',
  lookback_days: 756,
  min_weight: 0,
  max_weight: 0.35,
}

function money(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${Math.round(value)}`
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: { year: number; p10: number; p50: number; p90: number } }[]
}

function FanTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="fan-tooltip">
      <div className="fan-tooltip-year">Year {point.year.toFixed(1)}</div>
      <div className="mono">Median {money(point.p50)}</div>
      <div className="mono muted">
        Range {money(point.p10)} – {money(point.p90)}
      </div>
    </div>
  )
}

export function PlannerPage() {
  const optimize = useOptimize()
  const plan = usePlan()

  const [expectedReturnPct, setExpectedReturnPct] = useState(12)
  const [volatilityPct, setVolatilityPct] = useState(15)
  const [initial, setInitial] = useState(10000)
  const [monthly, setMonthly] = useState(500)
  const [years, setYears] = useState(20)
  const [target, setTarget] = useState(500000)

  const pullFromOptimizer = async () => {
    const result = await optimize.mutateAsync(optimizeRequest)
    setExpectedReturnPct(Number((result.metrics.expected_return * 100).toFixed(1)))
    setVolatilityPct(Number((result.metrics.volatility * 100).toFixed(1)))
  }

  const run = () => {
    plan.mutate({
      expected_return: expectedReturnPct / 100,
      volatility: volatilityPct / 100,
      initial,
      monthly_contribution: monthly,
      years,
      target: target > 0 ? target : null,
      trials: 3000,
    })
  }

  const result = plan.data

  return (
    <div className="planner">
      <div className="planner-intro">
        <h2>Goal-based planner</h2>
        <p className="muted">
          Simulate thousands of possible futures for your portfolio to see the odds of reaching your
          goal — and the risk of a deep drawdown along the way.
        </p>
      </div>

      <div className="planner-grid">
        <section className="panel planner-controls">
          <h3>Your plan</h3>
          <div className="planner-field">
            <label>Expected annual return</label>
            <div className="planner-input-suffix">
              <input
                type="number"
                value={expectedReturnPct}
                step={0.5}
                onChange={(event) => setExpectedReturnPct(Number(event.target.value))}
              />
              <span>%</span>
            </div>
          </div>
          <div className="planner-field">
            <label>Annual volatility</label>
            <div className="planner-input-suffix">
              <input
                type="number"
                value={volatilityPct}
                step={0.5}
                onChange={(event) => setVolatilityPct(Number(event.target.value))}
              />
              <span>%</span>
            </div>
          </div>
          <button type="button" className="signin-trigger" onClick={pullFromOptimizer} disabled={optimize.isPending}>
            {optimize.isPending ? 'Loading…' : 'Use optimized portfolio (max-Sharpe)'}
          </button>

          <div className="planner-divider" />

          <div className="planner-field">
            <label>Starting amount</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <input type="number" value={initial} step={1000} onChange={(event) => setInitial(Number(event.target.value))} />
            </div>
          </div>
          <div className="planner-field">
            <label>Monthly contribution</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <input type="number" value={monthly} step={100} onChange={(event) => setMonthly(Number(event.target.value))} />
            </div>
          </div>
          <div className="planner-field">
            <label>Years</label>
            <input type="number" value={years} min={1} max={50} onChange={(event) => setYears(Number(event.target.value))} />
          </div>
          <div className="planner-field">
            <label>Goal amount</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <input type="number" value={target} step={10000} onChange={(event) => setTarget(Number(event.target.value))} />
            </div>
          </div>

          <button className="primary" onClick={run} disabled={plan.isPending}>
            {plan.isPending ? 'Simulating…' : 'Run simulation'}
          </button>
          {plan.isError && <p className="error">Simulation failed. Check your inputs and try again.</p>}
        </section>

        <section className="panel planner-results">
          <h3>Projected outcomes</h3>
          {!result && !plan.isPending && (
            <p className="muted">Set your plan and run the simulation to see the fan of outcomes.</p>
          )}
          {plan.isPending && <p className="muted">Running 3,000 market simulations…</p>}
          {result && <PlannerOutput result={result} />}
        </section>
      </div>
    </div>
  )
}

function PlannerOutput({ result }: { result: PlanResponse }) {
  const chartData = result.timeline.map((point) => ({
    year: point.month / 12,
    p10: point.p10,
    p50: point.p50,
    p90: point.p90,
    bandWidth: point.p90 - point.p10,
  }))

  return (
    <div className="planner-output">
      <div className="planner-stats">
        {result.prob_success !== null && (
          <div className="planner-stat highlight">
            <span className="planner-stat-value">{percent(result.prob_success, 0)}</span>
            <span className="planner-stat-label">chance of reaching {money(result.target ?? 0)}</span>
          </div>
        )}
        <div className="planner-stat">
          <span className="planner-stat-value">{percent(result.prob_large_drawdown, 0)}</span>
          <span className="planner-stat-label">
            chance of a ≥{Math.round(result.large_drawdown * 100)}% drawdown
          </span>
        </div>
        <div className="planner-stat">
          <span className="planner-stat-value">{money(result.median_final)}</span>
          <span className="planner-stat-label">median outcome</span>
        </div>
        <div className="planner-stat">
          <span className="planner-stat-value">
            {money(result.p10_final)} – {money(result.p90_final)}
          </span>
          <span className="planner-stat-label">likely range (10–90%)</span>
        </div>
      </div>

      <div className="planner-chart">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number) => `${Math.round(value)}y`}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={money} width={54} />
            <Tooltip content={<FanTooltip />} />
            <Area type="monotone" dataKey="p10" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area
              type="monotone"
              dataKey="bandWidth"
              stackId="band"
              stroke="none"
              fill="var(--accent)"
              fillOpacity={0.2}
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2} dot={false} />
            {result.target !== null && (
              <ReferenceLine
                y={result.target}
                stroke="var(--border)"
                strokeDasharray="4 4"
                label={{ value: 'Goal', fontSize: 11, fill: 'var(--muted)', position: 'insideTopRight' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="provenance">
        {result.trials.toLocaleString()} simulations · {result.years} years · you invest{' '}
        {money(result.total_contributions)} in total
      </p>
    </div>
  )
}
