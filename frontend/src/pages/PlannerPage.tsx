import { useState } from 'react'
import { usePlan } from '../api/queries'
import type { PlanResponse } from '../api/types'
import { Loader } from '../components/Loader'
import { NumberInput } from '../components/NumberInput'
import { ProjectionFan } from '../components/ProjectionFan'
import { money, percent } from '../lib/format'
import { useLastOptimization } from '../optimizer/useLastOptimization'

export function PlannerPage() {
  const plan = usePlan()
  const { lastRun } = useLastOptimization()

  const [expectedReturnPct, setExpectedReturnPct] = useState(12)
  const [volatilityPct, setVolatilityPct] = useState(15)
  const [initial, setInitial] = useState(10000)
  const [monthly, setMonthly] = useState(500)
  const [years, setYears] = useState(20)
  const [target, setTarget] = useState(500000)

  const pulledReturnPct = lastRun ? Number((lastRun.expectedReturn * 100).toFixed(2)) : null
  const pulledVolatilityPct = lastRun ? Number((lastRun.volatility * 100).toFixed(2)) : null
  const usingOptimized =
    lastRun !== null && expectedReturnPct === pulledReturnPct && volatilityPct === pulledVolatilityPct

  const pullFromOptimizer = () => {
    if (pulledReturnPct === null || pulledVolatilityPct === null) return
    setExpectedReturnPct(pulledReturnPct)
    setVolatilityPct(pulledVolatilityPct)
  }

  const run = () => {
    plan.mutate({
      expected_return: expectedReturnPct / 100,
      volatility: volatilityPct / 100,
      initial,
      monthly_contribution: monthly,
      years: Math.round(years),
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
          goal and the risk of a deep drawdown along the way.
        </p>
      </div>

      <div className="planner-grid">
        <section className="panel planner-controls">
          <h3>Your plan</h3>
          <div className="planner-field">
            <label>Expected annual return</label>
            <div className="planner-input-suffix">
              <NumberInput
                value={expectedReturnPct}
                min={-100}
                max={200}
                step={0.01}
                onChange={setExpectedReturnPct}
              />
              <span>%</span>
            </div>
          </div>
          <div className="planner-field">
            <label>Annual volatility</label>
            <div className="planner-input-suffix">
              <NumberInput
                value={volatilityPct}
                min={0.01}
                max={300}
                step={0.01}
                onChange={setVolatilityPct}
              />
              <span>%</span>
            </div>
          </div>

          {lastRun ? (
            <>
              <button type="button" className="signin-trigger" onClick={pullFromOptimizer} disabled={usingOptimized}>
                {usingOptimized ? 'Using your optimized portfolio ✓' : 'Use my optimized portfolio'}
              </button>
              <p className="muted planner-source">
                Your last optimizer run was {lastRun.objective} over {lastRun.tickers.length} tickers,
                giving {percent(lastRun.expectedReturn)} expected return at{' '}
                {percent(lastRun.volatility)} volatility.
              </p>
            </>
          ) : (
            <>
              <button type="button" className="signin-trigger" disabled>
                Use my optimized portfolio
              </button>
              <p className="muted planner-source">
                Run the optimizer first and its expected return and volatility will be available here.
              </p>
            </>
          )}

          <div className="planner-divider" />

          <div className="planner-field">
            <label>Starting amount</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <NumberInput value={initial} min={0} step={1000} onChange={setInitial} />
            </div>
          </div>
          <div className="planner-field">
            <label>Monthly contribution</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <NumberInput value={monthly} min={0} step={100} onChange={setMonthly} />
            </div>
          </div>
          <div className="planner-field">
            <label>Years</label>
            <NumberInput value={years} min={1} max={50} step={1} integer onChange={setYears} />
          </div>
          <div className="planner-field">
            <label>Goal amount</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <NumberInput value={target} min={0} step={10000} onChange={setTarget} />
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
          {plan.isPending && <Loader fullscreen={false} label="Running 3,000 market simulations…" />}
          {result && <PlannerOutput result={result} />}
        </section>
      </div>
    </div>
  )
}

function PlannerOutput({ result }: { result: PlanResponse }) {
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
            {money(result.p10_final)} - {money(result.p90_final)}
          </span>
          <span className="planner-stat-label">likely range (10-90%)</span>
        </div>
      </div>

      <ProjectionFan timeline={result.timeline} target={result.target} />

      <p className="provenance">
        {result.trials.toLocaleString()} simulations · {result.years} years · you invest{' '}
        {money(result.total_contributions)} in total
      </p>
    </div>
  )
}
