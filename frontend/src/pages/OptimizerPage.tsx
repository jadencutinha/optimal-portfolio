import { useState } from 'react'
import { useExplain, useFrontier, useMe, useOptimize, useSavePortfolio, useUniverse } from '../api/queries'
import { downloadCsv } from '../lib/csv'
import type { AssetBound, Objective, OptimizeRequest, ReturnModel, RiskModel, SectorCap } from '../api/types'
import { AllocationChart } from '../components/AllocationChart'
import { ConstraintBuilder } from '../components/ConstraintBuilder'
import { Explanation } from '../components/Explanation'
import { FrontierChart } from '../components/FrontierChart'
import { ObjectiveControls } from '../components/ObjectiveControls'
import { PortfolioDetail } from '../components/PortfolioDetail'
import { StatCards } from '../components/StatCards'
import { TickerInput } from '../components/TickerInput'
import { WeightsTable } from '../components/WeightsTable'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'PG']

export function OptimizerPage() {
  const universe = useUniverse()
  const optimize = useOptimize()
  const frontier = useFrontier()
  const explain = useExplain()
  const me = useMe()
  const save = useSavePortfolio()

  const entitlements = (me.data?.entitlements ?? {}) as Record<string, unknown>
  const pro = Boolean(entitlements.advanced_optimizers)
  const maxTickers = typeof entitlements.max_tickers === 'number' ? entitlements.max_tickers : null
  const dailyOptimizations = entitlements.daily_optimizations

  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [objective, setObjective] = useState<Objective>('max_sharpe')
  const [riskModel, setRiskModel] = useState<RiskModel>('sample')
  const [returnModel, setReturnModel] = useState<ReturnModel>('historical')
  const [targetReturnPct, setTargetReturnPct] = useState(15)
  const [targetRiskPct, setTargetRiskPct] = useState(18)
  const [cvarConfidencePct, setCvarConfidencePct] = useState(95)
  const [costBps, setCostBps] = useState(10)
  const [riskAversion, setRiskAversion] = useState(5)
  const [maxWeightPct, setMaxWeightPct] = useState(35)
  const [lookbackDays, setLookbackDays] = useState(756)
  const [sectorCaps, setSectorCaps] = useState<SectorCap[]>([])
  const [assetBounds, setAssetBounds] = useState<AssetBound[]>([])
  const [selectedFrontierIndex, setSelectedFrontierIndex] = useState<number | null>(null)
  const [lastRequest, setLastRequest] = useState<OptimizeRequest | null>(null)

  const canSubmit = tickers.length >= 2 && !optimize.isPending

  const submit = () => {
    const request: OptimizeRequest = {
      tickers,
      objective,
      risk_model: riskModel,
      return_model: returnModel,
      lookback_days: lookbackDays,
      min_weight: 0,
      max_weight: maxWeightPct / 100,
      target_return: objective === 'target_return' ? targetReturnPct / 100 : null,
      target_risk: objective === 'target_risk' ? targetRiskPct / 100 : null,
      cvar_alpha: cvarConfidencePct / 100,
      transaction_cost_bps: costBps,
      risk_aversion: riskAversion,
      asset_bounds: assetBounds,
      sector_caps: sectorCaps,
    }
    setSelectedFrontierIndex(null)
    setLastRequest(request)
    explain.reset()
    optimize.mutate(request)
    frontier.mutate({
      tickers,
      lookback_days: lookbackDays,
      min_weight: 0,
      max_weight: maxWeightPct / 100,
      risk_model: riskModel,
      points: 25,
    })
  }

  const result = optimize.data
  const frontierData = frontier.data
  const errorMessage = optimize.isError ? extractError(optimize.error) : null

  const selectedPoint =
    frontierData && selectedFrontierIndex !== null ? frontierData.points[selectedFrontierIndex] : null

  const savePortfolio = () => {
    if (!result) return
    const name = window.prompt('Name this portfolio', `${result.objective} · ${new Date().toLocaleDateString()}`)
    if (!name) return
    save.mutate({
      name,
      objective: result.objective,
      risk_model: result.risk_model,
      tickers: result.weights.map((allocation) => allocation.ticker),
      weights: Object.fromEntries(result.weights.map((allocation) => [allocation.ticker, allocation.weight])),
      metrics: {
        sharpe_ratio: result.metrics.sharpe_ratio,
        expected_return: result.metrics.expected_return,
        volatility: result.metrics.volatility,
      },
    })
  }

  const exportCsv = () => {
    if (!result) return
    const rows: (string | number)[][] = [['Ticker', 'Weight', 'Sector']]
    result.weights.forEach((allocation) =>
      rows.push([allocation.ticker, allocation.weight, allocation.sector ?? '']),
    )
    downloadCsv('portfolio-weights.csv', rows)
  }

  return (
    <div className="optimizer">
      <section className="panel controls">
        <h2>Configuration</h2>
        {!pro && (
          <div className="free-banner">
            Free plan{maxTickers ? ` · up to ${maxTickers} tickers` : ''}
            {typeof dailyOptimizations === 'number' ? ` · ${dailyOptimizations} runs/day` : ''}
          </div>
        )}
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />
        <ObjectiveControls
          objective={objective}
          riskModel={riskModel}
          pro={pro}
          returnModel={returnModel}
          targetReturnPct={targetReturnPct}
          targetRiskPct={targetRiskPct}
          cvarConfidencePct={cvarConfidencePct}
          costBps={costBps}
          riskAversion={riskAversion}
          maxWeightPct={maxWeightPct}
          lookbackDays={lookbackDays}
          onObjective={setObjective}
          onRiskModel={setRiskModel}
          onReturnModel={setReturnModel}
          onTargetReturnPct={setTargetReturnPct}
          onTargetRiskPct={setTargetRiskPct}
          onCvarConfidencePct={setCvarConfidencePct}
          onCostBps={setCostBps}
          onRiskAversion={setRiskAversion}
          onMaxWeightPct={setMaxWeightPct}
          onLookbackDays={setLookbackDays}
        />
        <ConstraintBuilder
          tickers={tickers}
          universe={universe.data?.assets ?? []}
          sectorCaps={sectorCaps}
          assetBounds={assetBounds}
          onSectorCaps={setSectorCaps}
          onAssetBounds={setAssetBounds}
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
              {result.n_assets} assets · {result.provider} data · {result.risk_model} ·{' '}
              {result.as_of_start} → {result.as_of_end} · solver {result.solver_status}
              {result.covariance_shrinkage !== null && ` · shrinkage ${result.covariance_shrinkage.toFixed(2)}`}
              {result.turnover !== null && ` · turnover ${(result.turnover * 100).toFixed(1)}%`}
            </p>
            <div className="result-actions">
              <button type="button" className="signin-trigger" onClick={savePortfolio}>
                {save.isSuccess ? 'Saved ✓' : 'Save portfolio'}
              </button>
              <button type="button" className="signin-trigger" onClick={exportCsv}>
                Export CSV
              </button>
              <button type="button" className="signin-trigger" onClick={() => window.print()}>
                PDF report
              </button>
              <button
                type="button"
                className="signin-trigger"
                disabled={!lastRequest || explain.isPending}
                onClick={() => lastRequest && explain.mutate(lastRequest)}
              >
                {explain.isPending ? 'Explaining…' : 'Why this portfolio?'}
              </button>
            </div>
            {save.isError && <p className="error">Could not save — you may have hit your plan's saved-portfolio limit.</p>}
            {explain.isError && <p className="error">Couldn't build the explanation. Try running the optimizer again.</p>}
            {explain.data && <Explanation data={explain.data} />}

            {frontier.isPending && <p className="muted">Tracing the efficient frontier…</p>}
            {frontierData && (
              <div className="frontier-section">
                <h3>Efficient Frontier</h3>
                <FrontierChart
                  frontier={frontierData}
                  portfolio={result.metrics}
                  selectedIndex={selectedFrontierIndex}
                  onSelect={setSelectedFrontierIndex}
                />
                {selectedPoint ? (
                  <PortfolioDetail
                    title="Selected frontier portfolio"
                    weights={selectedPoint.weights}
                    expectedReturn={selectedPoint.expected_return}
                    volatility={selectedPoint.volatility}
                    sharpe={selectedPoint.sharpe_ratio}
                  />
                ) : (
                  <PortfolioDetail
                    title="Your optimized portfolio"
                    weights={result.weights}
                    expectedReturn={result.metrics.expected_return}
                    volatility={result.metrics.volatility}
                    sharpe={result.metrics.sharpe_ratio}
                  />
                )}
              </div>
            )}
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
