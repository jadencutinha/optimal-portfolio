import { useState } from 'react'
import {
  downloadReportPdf,
  useExplain,
  useFrontier,
  useMe,
  useOptimize,
  useResampledFrontier,
  useSavePortfolio,
  useUniverse,
} from '../api/queries'
import { downloadCsv } from '../lib/csv'
import { extractApiError } from '../lib/errors'
import type { AssetBound, Objective, OptimizeRequest, ReturnModel, RiskModel, SectorCap } from '../api/types'
import { AllocationChart } from '../components/AllocationChart'
import { ConstraintBuilder } from '../components/ConstraintBuilder'
import { EmptyState } from '../components/EmptyState'
import { Explanation } from '../components/Explanation'
import { FrontierChart } from '../components/FrontierChart'
import { GrowthProjection } from '../components/GrowthProjection'
import { ObjectiveControls } from '../components/ObjectiveControls'
import { PortfolioDetail } from '../components/PortfolioDetail'
import { PromptModal } from '../components/PromptModal'
import { ResampledFrontierChart } from '../components/ResampledFrontierChart'
import { SkeletonCards } from '../components/Skeleton'
import { StatCards } from '../components/StatCards'
import { TickerInput } from '../components/TickerInput'
import { WeightsTable } from '../components/WeightsTable'
import { useLastOptimization } from '../optimizer/useLastOptimization'
import { useToast } from '../toast/useToast'
import { Tooltip } from '../components/Tooltip'
import { FINANCIAL_TERMS } from '../data/definitions'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'KO']

export function OptimizerPage() {
  const universe = useUniverse()
  const optimize = useOptimize()
  const frontier = useFrontier()
  const explain = useExplain()
  const resampled = useResampledFrontier()
  const me = useMe()
  const save = useSavePortfolio()
  const toast = useToast()
  const { setLastRun } = useLastOptimization()

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
  const [naming, setNaming] = useState(false)
  const [uploadedWeights, setUploadedWeights] = useState<Record<string, number> | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)

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
      prev_weights: uploadedWeights ?? undefined,
    }
    setSelectedFrontierIndex(null)
    setLastRequest(request)
    explain.reset()
    setExplanationOpen(false)
    resampled.reset()
    optimize.mutate(request, {
      onSuccess: (response) => {
        setLastRun({
          expectedReturn: response.metrics.expected_return,
          volatility: response.metrics.volatility,
          sharpeRatio: response.metrics.sharpe_ratio,
          objective: response.objective,
          riskModel: response.risk_model,
          tickers: response.weights.map((allocation) => allocation.ticker),
          request,
        })
      },
    })
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
  const errorMessage = optimize.isError
    ? extractApiError(optimize.error, 'Optimization failed. Adjust your inputs and try again.')
    : null

  const selectedPoint =
    frontierData && selectedFrontierIndex !== null ? frontierData.points[selectedFrontierIndex] : null

  const confirmSave = (name: string) => {
    if (!result) return
    save.mutate(
      {
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
      },
      {
        onSuccess: () => toast(`Saved "${name}"`, 'success'),
        onError: () => toast("Couldn't save. You may have hit your plan's saved-portfolio limit.", 'error'),
      },
    )
    setNaming(false)
  }

  const exportCsv = () => {
    if (!result) return
    const rows: (string | number)[][] = [['Ticker', 'Weight', 'Sector']]
    result.weights.forEach((allocation) =>
      rows.push([allocation.ticker, allocation.weight, allocation.sector ?? '']),
    )
    downloadCsv('portfolio-weights.csv', rows)
  }

  const downloadPdf = async () => {
    if (!lastRequest) return
    try {
      const blob = await downloadReportPdf(lastRequest)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'portfolio-report.pdf'
      link.click()
      URL.revokeObjectURL(url)
      toast('Report downloaded', 'success')
    } catch {
      toast('Could not generate the report.', 'error')
    }
  }

  const importCsv = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed: string[] = []
      const weights: Record<string, number> = {}
      let hasWeights = false
      for (const line of text.split(/\r?\n/)) {
        const [rawTicker, rawWeight] = line.split(/[,\t;]/)
        const ticker = rawTicker?.trim().toUpperCase()
        if (!ticker || ticker === 'TICKER' || !/^[A-Z][A-Z.-]*$/.test(ticker)) continue
        if (!parsed.includes(ticker)) parsed.push(ticker)
        if (rawWeight !== undefined && rawWeight.trim() !== '') {
          const value = Number(rawWeight.replace('%', '').trim())
          if (!Number.isNaN(value)) {
            weights[ticker] = value
            hasWeights = true
          }
        }
      }
      if (parsed.length < 2) {
        toast('Need at least 2 valid tickers in the CSV.', 'error')
        return
      }
      setTickers(parsed.slice(0, 50))
      if (hasWeights) {
        const total = Object.values(weights).reduce((sum, value) => sum + value, 0)
        const normalized: Record<string, number> = {}
        Object.entries(weights).forEach(([ticker, value]) => {
          normalized[ticker] = total > 0 ? value / total : 0
        })
        setUploadedWeights(normalized)
      } else {
        setUploadedWeights(null)
      }
      toast(`Loaded ${parsed.length} tickers${hasWeights ? ' with weights' : ''}`, 'success')
    }
    reader.readAsText(file)
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
        <div className="csv-upload">
          <label className="csv-upload-btn">
            Upload holdings CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) importCsv(file)
                event.target.value = ''
              }}
            />
          </label>
          {uploadedWeights && (
            <span className="csv-loaded">
              {Object.keys(uploadedWeights).length} holdings loaded
              <button type="button" onClick={() => setUploadedWeights(null)}>
                clear
              </button>
            </span>
          )}
        </div>
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
          <EmptyState
            icon="◎"
            title="No portfolio yet"
            description="Configure your universe and objective, then run the optimizer to see the optimal allocation."
          />
        )}
        {optimize.isPending && <SkeletonCards count={3} />}
        {result && (
          <div className="results-grid">
            <StatCards result={result} />
            <div className="results-row">
              <AllocationChart weights={result.weights} />
              <WeightsTable weights={result.weights} />
            </div>
            <GrowthProjection
              key={`${result.metrics.expected_return}-${result.metrics.volatility}`}
              expectedReturn={result.metrics.expected_return}
              volatility={result.metrics.volatility}
            />
            <p className="provenance">
              {result.n_assets} assets · {result.provider} data · {result.risk_model} ·{' '}
              {result.as_of_start} → {result.as_of_end} · solver {result.solver_status}
              {result.covariance_shrinkage !== null && ` · shrinkage ${result.covariance_shrinkage.toFixed(2)}`}
              {result.turnover !== null && ` · turnover ${(result.turnover * 100).toFixed(1)}%`}
            </p>
            {result.dropped_tickers.length > 0 && (
              <p className="ticker-warning">
                {result.dropped_tickers.join(', ')} had no price data and{' '}
                {result.dropped_tickers.length === 1 ? 'was' : 'were'} excluded from this portfolio.
              </p>
            )}
            <div className="result-actions">
              <button type="button" className="signin-trigger" onClick={() => setNaming(true)}>
                {save.isSuccess ? 'Saved ✓' : 'Save portfolio'}
              </button>
              <button type="button" className="signin-trigger" onClick={exportCsv}>
                Export CSV
              </button>
              <button type="button" className="signin-trigger" onClick={downloadPdf} disabled={!lastRequest}>
                PDF report
              </button>
              <button
                type="button"
                className="signin-trigger"
                aria-expanded={explanationOpen}
                disabled={!lastRequest || explain.isPending}
                onClick={() => {
                  if (explanationOpen) {
                    setExplanationOpen(false)
                    return
                  }
                  setExplanationOpen(true)
                  if (!explain.data && lastRequest) explain.mutate(lastRequest)
                }}
              >
                {explain.isPending ? 'Explaining…' : explanationOpen ? 'Hide explanation' : 'Why this portfolio?'}
              </button>
            </div>
            {explanationOpen && explain.isError && (
              <p className="error">Couldn't build the explanation. Try running the optimizer again.</p>
            )}
            {explanationOpen && explain.data && <Explanation data={explain.data} />}

            {frontier.isPending && <p className="muted">Tracing the efficient frontier…</p>}
            {frontierData && (
              <div className="frontier-section">
                <Tooltip text={FINANCIAL_TERMS["Efficient Frontier"]?.definition}>
                  <h3>Efficient Frontier</h3>
                </Tooltip>
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

                <div className="resampled-frontier">
                  <button
                    type="button"
                    className="signin-trigger"
                    disabled={resampled.isPending}
                    onClick={() =>
                      resampled.mutate({
                        tickers,
                        lookback_days: lookbackDays,
                        min_weight: 0,
                        max_weight: maxWeightPct / 100,
                        risk_model: riskModel,
                        points: 12,
                        resamples: 15,
                      })
                    }
                  >
                    {resampled.isPending ? 'Resampling…' : 'Compare resampled frontier (Michaud)'}
                  </button>
                  {resampled.isError && (
                    <p className="error">Couldn't resample the frontier. Try again.</p>
                  )}
                  {resampled.data && (
                    <>
                      <p className="muted resampled-note">
                        Michaud resampling averages the frontier over many simulated markets, so the
                        allocation is less sensitive to estimation error than the single-sample
                        (classic) frontier.
                      </p>
                      <ResampledFrontierChart data={resampled.data} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {naming && result && (
        <PromptModal
          title="Save portfolio"
          label="Portfolio name"
          defaultValue={`${result.objective} · ${new Date().toLocaleDateString()}`}
          submitLabel="Save"
          onSubmit={confirmSave}
          onCancel={() => setNaming(false)}
        />
      )}
    </div>
  )
}
