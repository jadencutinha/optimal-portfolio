import { useState } from 'react'
import { useOptimize, useUniverse } from '../api/queries'
import type { Objective, OptimizeRequest } from '../api/types'
import { AllocationChart } from '../components/AllocationChart'
import { ObjectiveControls } from '../components/ObjectiveControls'
import { StatCards } from '../components/StatCards'
import { TickerInput } from '../components/TickerInput'
import { WeightsTable } from '../components/WeightsTable'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'PG']

export function OptimizerPage() {
  const universe = useUniverse()
  const optimize = useOptimize()

  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [objective, setObjective] = useState<Objective>('max_sharpe')
  const [targetReturnPct, setTargetReturnPct] = useState(15)
  const [targetRiskPct, setTargetRiskPct] = useState(18)
  const [maxWeightPct, setMaxWeightPct] = useState(35)
  const [lookbackDays, setLookbackDays] = useState(756)

  const canSubmit = tickers.length >= 2 && !optimize.isPending

  const submit = () => {
    const request: OptimizeRequest = {
      tickers,
      objective,
      lookback_days: lookbackDays,
      min_weight: 0,
      max_weight: maxWeightPct / 100,
      target_return: objective === 'target_return' ? targetReturnPct / 100 : null,
      target_risk: objective === 'target_risk' ? targetRiskPct / 100 : null,
    }
    optimize.mutate(request)
  }

  const result = optimize.data
  const errorMessage = optimize.isError ? extractError(optimize.error) : null

  return (
    <div className="optimizer">
      <section className="panel controls">
        <h2>Configuration</h2>
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />
        <ObjectiveControls
          objective={objective}
          targetReturnPct={targetReturnPct}
          targetRiskPct={targetRiskPct}
          maxWeightPct={maxWeightPct}
          lookbackDays={lookbackDays}
          onObjective={setObjective}
          onTargetReturnPct={setTargetReturnPct}
          onTargetRiskPct={setTargetRiskPct}
          onMaxWeightPct={setMaxWeightPct}
          onLookbackDays={setLookbackDays}
        />
        <button className="primary" disabled={!canSubmit} onClick={submit}>
          {optimize.isPending ? 'Optimizing…' : 'Optimize Portfolio'}
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>

      <section className="panel results">
        <h2>Results</h2>
        {!result && !optimize.isPending && (
          <p className="muted">Configure a portfolio and run the optimizer to see the optimal allocation.</p>
        )}
        {optimize.isPending && <p className="muted">Solving the convex program…</p>}
        {result && (
          <div className="results-grid">
            <StatCards result={result} />
            <div className="results-row">
              <AllocationChart weights={result.weights} />
              <WeightsTable weights={result.weights} />
            </div>
            <p className="provenance">
              {result.n_assets} assets · {result.provider} data · {result.as_of_start} → {result.as_of_end} · solver{' '}
              {result.solver_status}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function extractError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response
    const detail = response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join('; ')
    }
  }
  return 'Optimization failed. Adjust your inputs and try again.'
}
