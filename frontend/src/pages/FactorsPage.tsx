import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFactors, useUniverse } from '../api/queries'
import type { Objective } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { SkeletonCards } from '../components/Skeleton'
import { TickerInput } from '../components/TickerInput'
import { percent, ratio } from '../lib/format'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'KO']

const OBJECTIVES: { id: Objective; label: string }[] = [
  { id: 'max_sharpe', label: 'Max Sharpe' },
  { id: 'min_variance', label: 'Min Variance' },
  { id: 'risk_parity', label: 'Risk Parity' },
  { id: 'hrp', label: 'Hierarchical RP' },
]

export function FactorsPage() {
  const universe = useUniverse()
  const factors = useFactors()
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [objective, setObjective] = useState<Objective>('max_sharpe')

  const run = () => {
    factors.mutate({
      tickers,
      objective,
      risk_model: 'sample',
      return_model: 'historical',
      lookback_days: 756,
      min_weight: 0,
      max_weight: 0.35,
    })
  }

  const result = factors.data
  const chartData = result?.exposures.map((exposure) => ({
    label: exposure.label,
    beta: Number(exposure.beta.toFixed(2)),
  }))

  return (
    <div className="factors">
      <div className="factors-intro">
        <h2>Factor exposures</h2>
        <p className="muted">
          Decompose your portfolio's returns into style-factor tilts to see how much of its behavior comes
          from the market, momentum, and other factors versus stock-specific bets.
        </p>
      </div>

      <section className="panel">
        <TickerInput tickers={tickers} suggestions={universe.data?.assets ?? []} onChange={setTickers} />
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
        <button className="primary" disabled={tickers.length < 2 || factors.isPending} onClick={run}>
          {factors.isPending ? 'Analyzing…' : 'Analyze factors'}
        </button>
        {factors.isError && <p className="error">Couldn't compute factor exposures. Try again.</p>}
      </section>

      <section className="panel">
        <h2>Exposures</h2>
        {!result && !factors.isPending && (
          <EmptyState
            icon="🧭"
            title="No analysis yet"
            description="Build a portfolio and analyze its factor tilts."
          />
        )}
        {factors.isPending && <SkeletonCards count={4} />}
        {result && chartData && (
          <div className="factors-output">
            <div className="explain-metrics">
              <div className="explain-metric">
                <span className="explain-metric-label">Alpha (annual)</span>
                <span className="explain-metric-value">{percent(result.alpha)}</span>
              </div>
              <div className="explain-metric">
                <span className="explain-metric-label">R² (explained)</span>
                <span className="explain-metric-value">{ratio(result.r_squared)}</span>
              </div>
              <div className="explain-metric">
                <span className="explain-metric-label">Stock-specific vol</span>
                <span className="explain-metric-value">{percent(result.idiosyncratic_vol)}</span>
              </div>
            </div>

            <div className="factors-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toFixed(2)} />
                  <Bar dataKey="beta" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.beta >= 0 ? 'var(--accent)' : 'var(--danger)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className="explain-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Exposure (β)</th>
                  <th>t-stat</th>
                  <th>Return contribution</th>
                </tr>
              </thead>
              <tbody>
                {result.exposures.map((exposure) => (
                  <tr key={exposure.key}>
                    <td>{exposure.label}</td>
                    <td className="mono">{exposure.beta.toFixed(2)}</td>
                    <td className="mono">{exposure.t_stat.toFixed(1)}</td>
                    <td className="mono">{percent(exposure.contribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="muted factors-note">{result.note}</p>
          </div>
        )}
      </section>
    </div>
  )
}
