import { useState } from 'react'
import { usePlan } from '../api/queries'
import { exactMoney, money, percent } from '../lib/format'
import { NumberInput } from './NumberInput'
import { ProjectionFan } from './ProjectionFan'

interface Props {
  expectedReturn: number
  volatility: number
}

export function GrowthProjection({ expectedReturn, volatility }: Props) {
  const plan = usePlan()

  const [initial, setInitial] = useState(1000)
  const [monthly, setMonthly] = useState(0)
  const [years, setYears] = useState(10)

  const usable = volatility > 0 && expectedReturn >= -1 && expectedReturn <= 2
  const canRun = usable && initial >= 0 && years >= 1 && years <= 50 && !plan.isPending

  const run = () => {
    plan.mutate({
      expected_return: expectedReturn,
      volatility,
      initial,
      monthly_contribution: monthly,
      years: Math.round(years),
      trials: 3000,
    })
  }

  const result = plan.data
  const gain = result ? result.median_final - result.total_contributions : 0

  return (
    <div className="growth-projection">
      <h3>What this portfolio turns into</h3>
      <p className="muted growth-intro">
        Runs the same Monte Carlo simulation the planner uses, driven by this portfolio's own
        expected return of {percent(expectedReturn)} and volatility of {percent(volatility)}.
      </p>

      <div className="growth-inputs">
        <div className="planner-field">
          <label htmlFor="growth-initial">Starting amount</label>
          <div className="planner-input-suffix">
            <span>$</span>
            <NumberInput id="growth-initial" min={0} step={500} value={initial} onChange={setInitial} />
          </div>
        </div>
        <div className="planner-field">
          <label htmlFor="growth-monthly">Monthly contribution</label>
          <div className="planner-input-suffix">
            <span>$</span>
            <NumberInput id="growth-monthly" min={0} step={100} value={monthly} onChange={setMonthly} />
          </div>
        </div>
        <div className="planner-field">
          <label htmlFor="growth-years">Years</label>
          <NumberInput id="growth-years" min={1} max={50} step={1} integer value={years} onChange={setYears} />
        </div>
        <button type="button" className="primary growth-run" disabled={!canRun} onClick={run}>
          {plan.isPending ? 'Simulating…' : 'Project growth'}
        </button>
      </div>

      {!usable && (
        <p className="muted">
          This portfolio's risk estimate is too small to simulate. Try a longer lookback window.
        </p>
      )}
      {plan.isError && <p className="error">Projection failed. Check your inputs and try again.</p>}

      {result && (
        <div className="growth-output">
          <div className="planner-stats">
            <div className="planner-stat highlight">
              <span className="planner-stat-value">{money(result.median_final)}</span>
              <span className="planner-stat-label">
                median value after {result.years} {result.years === 1 ? 'year' : 'years'}
              </span>
            </div>
            <div className="planner-stat">
              <span className="planner-stat-value">{money(gain)}</span>
              <span className="planner-stat-label">
                median gain on {exactMoney(result.total_contributions)} invested
              </span>
            </div>
            <div className="planner-stat">
              <span className="planner-stat-value">
                {money(result.p10_final)} - {money(result.p90_final)}
              </span>
              <span className="planner-stat-label">likely range (10-90%)</span>
            </div>
            <div className="planner-stat">
              <span className="planner-stat-value">{percent(result.prob_large_drawdown, 0)}</span>
              <span className="planner-stat-label">
                chance of a ≥{Math.round(result.large_drawdown * 100)}% drawdown
              </span>
            </div>
          </div>

          <ProjectionFan timeline={result.timeline} height={220} />

          <p className="provenance">
            {result.trials.toLocaleString()} simulations. Expected return and volatility are
            estimated from historical data, so these are modelled outcomes rather than a forecast.
          </p>
        </div>
      )}
    </div>
  )
}
