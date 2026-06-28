import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../api/client'
import { useUniverse } from '../api/queries'
import type { Objective, RiskModel, SweepCell } from '../api/types'
import { TickerInput } from '../components/TickerInput'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'PG']

const OBJECTIVE_OPTIONS: { id: Objective; label: string }[] = [
  { id: 'max_sharpe', label: 'Max Sharpe' },
  { id: 'min_variance', label: 'Min Variance' },
  { id: 'risk_parity', label: 'Risk Parity' },
  { id: 'max_diversification', label: 'Max Diversification' },
  { id: 'cvar', label: 'Min CVaR' },
]

const RISK_OPTIONS: { id: RiskModel; label: string }[] = [
  { id: 'sample', label: 'Sample' },
  { id: 'ledoit_wolf', label: 'Ledoit-Wolf' },
  { id: 'ewma', label: 'EWMA' },
  { id: 'factor', label: 'Factor' },
]

const OBJECTIVE_LABEL = Object.fromEntries(OBJECTIVE_OPTIONS.map((o) => [o.id, o.label]))
const RISK_LABEL = Object.fromEntries(RISK_OPTIONS.map((o) => [o.id, o.label]))

interface Axes {
  objectives: Objective[]
  riskModels: RiskModel[]
}

export function SweepPage() {
  const universe = useUniverse()
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [lookbackDays, setLookbackDays] = useState(756)
  const [maxWeightPct, setMaxWeightPct] = useState(35)
  const [objectives, setObjectives] = useState<Record<string, boolean>>(
    Object.fromEntries(OBJECTIVE_OPTIONS.map((o) => [o.id, true])),
  )
  const [riskModels, setRiskModels] = useState<Record<string, boolean>>(
    Object.fromEntries(RISK_OPTIONS.map((o) => [o.id, true])),
  )

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cells, setCells] = useState<Record<string, SweepCell>>({})
  const [axes, setAxes] = useState<Axes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => () => wsRef.current?.close(), [])

  const selectedObjectives = OBJECTIVE_OPTIONS.map((o) => o.id).filter((id) => objectives[id])
  const selectedRisk = RISK_OPTIONS.map((o) => o.id).filter((id) => riskModels[id])
  const canRun = tickers.length >= 2 && selectedObjectives.length > 0 && selectedRisk.length > 0 && !running

  const run = async () => {
    setError(null)
    setCells({})
    setProgress(0)
    setAxes({ objectives: selectedObjectives, riskModels: selectedRisk })
    try {
      const { data } = await apiClient.post<{ job_id: string; total: number }>('/api/jobs/sweep', {
        tickers,
        lookback_days: lookbackDays,
        max_weight: maxWeightPct / 100,
        objectives: selectedObjectives,
        risk_models: selectedRisk,
      })
      setRunning(true)
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${protocol}://${window.location.host}/api/jobs/${data.job_id}/ws`)
      wsRef.current = ws
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (typeof message.progress === 'number') setProgress(message.progress)
        if (message.type === 'progress' && message.cell) {
          const cell = message.cell as SweepCell
          setCells((prev) => ({ ...prev, [`${cell.objective}|${cell.risk_model}`]: cell }))
        }
        if (message.type === 'done') {
          setRunning(false)
          ws.close()
        }
        if (message.type === 'error') {
          setError(message.message ?? 'Sweep failed.')
          setRunning(false)
          ws.close()
        }
      }
      ws.onerror = () => {
        setError('Connection lost.')
        setRunning(false)
      }
    } catch {
      setError('Could not start the sweep.')
    }
  }

  const sharpes = Object.values(cells)
    .filter((cell) => cell.status === 'ok' && cell.sharpe_ratio !== null)
    .map((cell) => cell.sharpe_ratio as number)
  const low = sharpes.length ? Math.min(...sharpes) : 0
  const high = sharpes.length ? Math.max(...sharpes) : 1
  const colorFor = (value: number) => {
    const norm = high > low ? (value - low) / (high - low) : 0.5
    return `rgba(46, 125, 50, ${(0.12 + 0.72 * norm).toFixed(3)})`
  }

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string,
  ) => setter((current) => ({ ...current, [key]: !current[key] }))

  return (
    <div className="backtest">
      <section className="panel">
        <h2>Strategy Comparison</h2>
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />

        <div className="field">
          <label>Objectives (rows)</label>
          <div className="bt-benchmarks">
            {OBJECTIVE_OPTIONS.map((option) => (
              <label key={option.id} className="inline-check">
                <input type="checkbox" checked={objectives[option.id]} onChange={() => toggle(setObjectives, option.id)} />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Risk models (columns)</label>
          <div className="bt-benchmarks">
            {RISK_OPTIONS.map((option) => (
              <label key={option.id} className="inline-check">
                <input type="checkbox" checked={riskModels[option.id]} onChange={() => toggle(setRiskModels, option.id)} />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Lookback window</label>
          <select value={lookbackDays} onChange={(e) => setLookbackDays(Number(e.target.value))}>
            <option value={252}>1 year</option>
            <option value={504}>2 years</option>
            <option value={756}>3 years</option>
            <option value={1260}>5 years</option>
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
            onChange={(e) => setMaxWeightPct(Number(e.target.value))}
          />
        </div>

        <button className="primary" disabled={!canRun} onClick={run}>
          {running ? 'Running…' : 'Run Comparison'}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Sharpe heatmap</h2>
        {!axes && <p className="muted">Pick objectives and risk models, then run a sweep. Progress streams live.</p>}
        {axes && (
          <>
            <div className="sweep-progress">
              <div className="sweep-progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="bt-table-wrap">
              <table className="heatmap">
                <thead>
                  <tr>
                    <th />
                    {axes.riskModels.map((risk) => (
                      <th key={risk}>{RISK_LABEL[risk]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {axes.objectives.map((objective) => (
                    <tr key={objective}>
                      <th className="row-label">{OBJECTIVE_LABEL[objective]}</th>
                      {axes.riskModels.map((risk) => {
                        const cell = cells[`${objective}|${risk}`]
                        if (!cell) {
                          return (
                            <td key={risk} className="heatmap-cell pending">
                              …
                            </td>
                          )
                        }
                        if (cell.status === 'error' || cell.sharpe_ratio === null) {
                          return (
                            <td key={risk} className="heatmap-cell error" title={cell.message}>
                              ×
                            </td>
                          )
                        }
                        return (
                          <td
                            key={risk}
                            className="heatmap-cell"
                            style={{ background: colorFor(cell.sharpe_ratio) }}
                            title={`return ${(cell.expected_return ?? 0) * 100}% · vol ${(cell.volatility ?? 0) * 100}%`}
                          >
                            {cell.sharpe_ratio.toFixed(2)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
