import { useState } from 'react'
import { useBacktest, useUniverse } from '../api/queries'
import type { BacktestObjective, BacktestRequest, BenchmarkName, RebalanceCadence, RiskModel } from '../api/types'
import { BacktestResults } from '../components/BacktestResults'
import { TickerInput } from '../components/TickerInput'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'PG']

const BENCHMARKS: { id: BenchmarkName; label: string }[] = [
  { id: 'index', label: 'Index (SPY)' },
  { id: 'equal_weight', label: 'Equal weight' },
  { id: 'sixty_forty', label: '60/40' },
]

export function BacktestPage() {
  const universe = useUniverse()
  const backtest = useBacktest()

  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [objective, setObjective] = useState<BacktestObjective>('max_sharpe')
  const [riskModel, setRiskModel] = useState<RiskModel>('sample')
  const [rebalance, setRebalance] = useState<RebalanceCadence>('monthly')
  const [estimationWindow, setEstimationWindow] = useState(252)
  const [historyYears, setHistoryYears] = useState(5)
  const [costBps, setCostBps] = useState(10)
  const [maxWeightPct, setMaxWeightPct] = useState(35)
  const [limitTurnover, setLimitTurnover] = useState(false)
  const [turnoverPct, setTurnoverPct] = useState(20)
  const [noTradeBandPct, setNoTradeBandPct] = useState(0)
  const [benchmarks, setBenchmarks] = useState<Record<BenchmarkName, boolean>>({
    index: true,
    equal_weight: true,
    sixty_forty: true,
  })

  const canSubmit = tickers.length >= 2 && !backtest.isPending

  const toggleBenchmark = (id: BenchmarkName) =>
    setBenchmarks((current) => ({ ...current, [id]: !current[id] }))

  const run = () => {
    const request: BacktestRequest = {
      tickers,
      objective,
      risk_model: riskModel,
      history_days: historyYears * 365,
      estimation_window: estimationWindow,
      rebalance,
      cost_bps: costBps,
      turnover_budget: limitTurnover ? turnoverPct / 100 : null,
      no_trade_band: noTradeBandPct / 100,
      min_weight: 0,
      max_weight: maxWeightPct / 100,
      benchmarks: BENCHMARKS.map((b) => b.id).filter((id) => benchmarks[id]),
    }
    backtest.mutate(request)
  }

  const error = backtest.isError ? extractError(backtest.error) : null

  return (
    <div className="backtest">
      <section className="panel">
        <h2>Backtest Configuration</h2>
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />

        <div className="bt-form">
          <div className="field">
            <label>Objective</label>
            <select value={objective} onChange={(e) => setObjective(e.target.value as BacktestObjective)}>
              <option value="max_sharpe">Maximum Sharpe</option>
              <option value="min_variance">Minimum Variance</option>
            </select>
          </div>

          <div className="field">
            <label>Risk model</label>
            <select value={riskModel} onChange={(e) => setRiskModel(e.target.value as RiskModel)}>
              <option value="sample">Sample covariance</option>
              <option value="ledoit_wolf">Ledoit-Wolf shrinkage</option>
              <option value="ewma">EWMA</option>
              <option value="factor">Factor model (PCA)</option>
            </select>
          </div>

          <div className="field">
            <label>Rebalance</label>
            <select value={rebalance} onChange={(e) => setRebalance(e.target.value as RebalanceCadence)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div className="field">
            <label>Estimation window</label>
            <select value={estimationWindow} onChange={(e) => setEstimationWindow(Number(e.target.value))}>
              <option value={126}>6 months</option>
              <option value={252}>1 year</option>
              <option value={504}>2 years</option>
            </select>
          </div>

          <div className="field">
            <label>History</label>
            <select value={historyYears} onChange={(e) => setHistoryYears(Number(e.target.value))}>
              <option value={3}>3 years</option>
              <option value={5}>5 years</option>
              <option value={8}>8 years</option>
            </select>
          </div>

          <div className="field">
            <label>Transaction cost: {costBps} bps</label>
            <input type="range" min={0} max={50} value={costBps} onChange={(e) => setCostBps(Number(e.target.value))} />
          </div>

          <div className="field">
            <label>Max weight per asset: {maxWeightPct}%</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={maxWeightPct}
              onChange={(e) => setMaxWeightPct(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label className="inline-check">
              <input type="checkbox" checked={limitTurnover} onChange={() => setLimitTurnover(!limitTurnover)} />
              Limit turnover
            </label>
            {limitTurnover && (
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={turnoverPct}
                onChange={(e) => setTurnoverPct(Number(e.target.value))}
              />
            )}
            {limitTurnover && <span className="muted">{turnoverPct}% per rebalance</span>}
          </div>

          <div className="field">
            <label>No-trade band: {noTradeBandPct}%</label>
            <input
              type="range"
              min={0}
              max={20}
              value={noTradeBandPct}
              onChange={(e) => setNoTradeBandPct(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label>Benchmarks</label>
          <div className="bt-benchmarks">
            {BENCHMARKS.map((b) => (
              <label key={b.id} className="inline-check">
                <input type="checkbox" checked={benchmarks[b.id]} onChange={() => toggleBenchmark(b.id)} />
                {b.label}
              </label>
            ))}
          </div>
        </div>

        <button className="primary" disabled={!canSubmit} onClick={run}>
          {backtest.isPending ? 'Running…' : 'Run Backtest'}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Results</h2>
        {!backtest.data && !backtest.isPending && (
          <p className="muted">Configure a strategy and run a walk-forward backtest against the benchmarks.</p>
        )}
        {backtest.isPending && <p className="muted">Running walk-forward backtest…</p>}
        {backtest.data && <BacktestResults result={backtest.data} />}
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
  return 'Backtest failed. Adjust your inputs and try again.'
}
