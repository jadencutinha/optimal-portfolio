import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usePortfolioDetail, useSavedPortfolios, useTrack } from '../api/queries'
import type { TrackResponse } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { percent } from '../lib/format'

export function TrackerPage() {
  const saved = useSavedPortfolios()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const detail = usePortfolioDetail(selectedId)
  const tracker = useTrack()

  const runTrack = () => {
    if (detail.data) tracker.mutate(detail.data.weights)
  }

  if (saved.isLoading) {
    return <Skeleton height="120px" radius="14px" />
  }

  const portfolios = saved.data ?? []
  if (portfolios.length === 0) {
    return (
      <EmptyState
        icon="📡"
        title="No portfolio to track"
        description="Save a portfolio from the optimizer first, then come back to track its drift over time."
      />
    )
  }

  return (
    <div className="tracker">
      <div className="tracker-intro">
        <h2>Live tracking &amp; rebalance alerts</h2>
        <p className="muted">
          Pick a saved portfolio to see how its weights have drifted from target as prices moved, and
          whether it's time to rebalance.
        </p>
      </div>

      <section className="panel tracker-controls">
        <div className="field">
          <label>Portfolio</label>
          <select
            value={selectedId ?? ''}
            onChange={(event) => {
              setSelectedId(event.target.value ? Number(event.target.value) : null)
              tracker.reset()
            }}
          >
            <option value="">Choose a saved portfolio…</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="primary"
          disabled={!detail.data || detail.isLoading || tracker.isPending}
          onClick={runTrack}
        >
          {tracker.isPending ? 'Tracking…' : 'Track drift'}
        </button>
        {tracker.isError && <p className="error">Couldn't track this portfolio. Try again.</p>}
      </section>

      {tracker.data && <TrackerResult result={tracker.data} />}
    </div>
  )
}

function TrackerResult({ result }: { result: TrackResponse }) {
  const chartData = result.timeline.map((point) => ({
    date: point.date,
    drift: Number((point.drift * 100).toFixed(2)),
  }))

  return (
    <div className="tracker-output">
      <div className={`rebalance-alert ${result.rebalance_needed ? 'warn' : 'ok'}`}>
        {result.rebalance_needed ? (
          <>
            <strong>Rebalance recommended.</strong> {result.top_drifter} has drifted the most; the largest
            position is {percent(result.max_drift)} off target, beyond your {percent(result.band)} band.
          </>
        ) : (
          <>
            <strong>On target.</strong> The largest drift is {percent(result.max_drift)}, within your{' '}
            {percent(result.band)} band.
          </>
        )}
      </div>

      <div className="tracker-stats">
        <div className="planner-stat">
          <span className="planner-stat-value">{percent(result.total_return)}</span>
          <span className="planner-stat-label">return since start</span>
        </div>
        <div className="planner-stat">
          <span className="planner-stat-value">{percent(result.max_drift)}</span>
          <span className="planner-stat-label">largest position drift</span>
        </div>
        <div className="planner-stat">
          <span className="planner-stat-value">{percent(result.turnover_to_rebalance)}</span>
          <span className="planner-stat-label">turnover to rebalance</span>
        </div>
      </div>

      <div className="tracker-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
            <YAxis tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <ReferenceLine
              y={result.band * 100}
              stroke="var(--danger)"
              strokeDasharray="4 4"
              label={{ value: 'Rebalance band', fontSize: 11, fill: 'var(--muted)', position: 'insideTopRight' }}
            />
            <Line type="monotone" dataKey="drift" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="explain-table">
        <thead>
          <tr>
            <th>Holding</th>
            <th>Target</th>
            <th>Current</th>
            <th>Drift</th>
          </tr>
        </thead>
        <tbody>
          {result.holdings.map((holding) => (
            <tr key={holding.ticker}>
              <td>{holding.ticker}</td>
              <td className="mono">{percent(holding.target, 1)}</td>
              <td className="mono">{percent(holding.current, 1)}</td>
              <td className={`mono ${holding.drift >= 0 ? 'drift-up' : 'drift-down'}`}>
                {holding.drift >= 0 ? '+' : ''}
                {percent(holding.drift, 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="provenance">As of {result.as_of}</p>
    </div>
  )
}
