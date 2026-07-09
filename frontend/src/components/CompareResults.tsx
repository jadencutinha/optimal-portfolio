import {
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { ComparisonOutcome } from '../api/queries'
import type { OptimizeResponse } from '../api/types'
import { percent, ratio } from '../lib/format'
import { OBJECTIVE_LABEL, RISK_MODEL_LABEL } from '../lib/objectives'
import { SERIES_COLORS, SERIES_SHAPES, type SeriesShape } from '../lib/series'

interface Solved {
  id: string
  label: string
  color: string
  shape: SeriesShape
  response: OptimizeResponse
}

const largestPosition = (response: OptimizeResponse) =>
  response.weights.reduce((max, allocation) => Math.max(max, allocation.weight), 0)

const effectiveHoldings = (response: OptimizeResponse) => {
  const sumOfSquares = response.weights.reduce((sum, allocation) => sum + allocation.weight ** 2, 0)
  return sumOfSquares > 0 ? 1 / sumOfSquares : 0
}

interface Row {
  label: string
  values: number[]
  format: (value: number) => string
  best: 'high' | 'low' | null
}

function bestIndex(row: Row): number | null {
  if (row.best === null || row.values.length < 2) return null
  let winner = 0
  for (let index = 1; index < row.values.length; index += 1) {
    const better = row.best === 'high' ? row.values[index] > row.values[winner] : row.values[index] < row.values[winner]
    if (better) winner = index
  }
  const ties = row.values.filter((value) => value === row.values[winner]).length
  return ties > 1 ? null : winner
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: { label: string; volatility: number; expectedReturn: number; sharpe: number } }[]
}

function ScatterTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="fan-tooltip">
      <div className="fan-tooltip-year">{point.label}</div>
      <div className="mono">Return {percent(point.expectedReturn)}</div>
      <div className="mono">Volatility {percent(point.volatility)}</div>
      <div className="mono muted">Sharpe {ratio(point.sharpe)}</div>
    </div>
  )
}

export function CompareResults({ outcomes }: { outcomes: ComparisonOutcome[] }) {
  const solved: Solved[] = outcomes.flatMap((outcome, index) =>
    outcome.status === 'ok'
      ? [
          {
            id: outcome.id,
            label: outcome.label,
            color: SERIES_COLORS[index % SERIES_COLORS.length],
            shape: SERIES_SHAPES[index % SERIES_SHAPES.length],
            response: outcome.response,
          },
        ]
      : [],
  )
  const failed = outcomes.filter((outcome) => outcome.status === 'error')

  if (solved.length === 0) {
    return (
      <div className="compare-results">
        {failed.map((outcome) => (
          <p key={outcome.id} className="error">
            {outcome.label}. {outcome.status === 'error' ? outcome.message : ''}
          </p>
        ))}
      </div>
    )
  }

  const rows: Row[] = [
    {
      label: 'Sharpe ratio',
      values: solved.map((item) => item.response.metrics.sharpe_ratio),
      format: (value) => ratio(value),
      best: 'high',
    },
    {
      label: 'Expected return',
      values: solved.map((item) => item.response.metrics.expected_return),
      format: (value) => percent(value),
      best: 'high',
    },
    {
      label: 'Volatility',
      values: solved.map((item) => item.response.metrics.volatility),
      format: (value) => percent(value),
      best: 'low',
    },
    {
      label: 'Largest position',
      values: solved.map((item) => largestPosition(item.response)),
      format: (value) => percent(value),
      best: 'low',
    },
    {
      label: 'Effective holdings',
      values: solved.map((item) => effectiveHoldings(item.response)),
      format: (value) => ratio(value, 1),
      best: 'high',
    },
    {
      label: 'Positions held',
      values: solved.map((item) => item.response.weights.length),
      format: (value) => String(value),
      best: null,
    },
    {
      label: 'Assets considered',
      values: solved.map((item) => item.response.n_assets),
      format: (value) => String(value),
      best: null,
    },
  ]

  const points = solved.map((item) => ({
    id: item.id,
    label: item.label,
    volatility: item.response.metrics.volatility,
    expectedReturn: item.response.metrics.expected_return,
    sharpe: item.response.metrics.sharpe_ratio,
  }))

  const universe = new Map<string, number>()
  solved.forEach((item) =>
    item.response.weights.forEach((allocation) => {
      universe.set(allocation.ticker, Math.max(universe.get(allocation.ticker) ?? 0, allocation.weight))
    }),
  )
  const tickers = [...universe.entries()].sort((a, b) => b[1] - a[1]).map(([ticker]) => ticker)
  const shared = tickers.filter((ticker) =>
    solved.every((item) => item.response.weights.some((allocation) => allocation.ticker === ticker)),
  )

  const weightOf = (item: Solved, ticker: string) =>
    item.response.weights.find((allocation) => allocation.ticker === ticker)?.weight ?? null

  return (
    <div className="compare-results">
      {failed.length > 0 && (
        <div className="compare-failures">
          {failed.map((outcome) => (
            <p key={outcome.id} className="error">
              {outcome.label} could not be optimized. {outcome.status === 'error' ? outcome.message : ''}
            </p>
          ))}
        </div>
      )}

      <section className="compare-block">
        <h3>Metrics</h3>
        <div className="bt-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                {solved.map((item) => (
                  <th key={item.id}>
                    <span className="series-swatch" style={{ background: item.color }} aria-hidden="true" />
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const winner = bestIndex(row)
                return (
                  <tr key={row.label}>
                    <th className="row-label">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td
                        key={solved[index].id}
                        className={winner === index ? 'mono compare-best' : 'mono'}
                      >
                        {row.format(value)}
                        {winner === index && <span className="compare-best-tag">best</span>}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr>
                <th className="row-label">Setup</th>
                {solved.map((item) => (
                  <td key={item.id} className="compare-setup">
                    {OBJECTIVE_LABEL[item.response.objective]}
                    <br />
                    <span className="muted">{RISK_MODEL_LABEL[item.response.risk_model]}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="compare-block">
        <h3>Risk versus return</h3>
        <div className="planner-chart">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 28, right: 32, bottom: 16, left: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
              <XAxis
                type="number"
                dataKey="volatility"
                name="Volatility"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => percent(value, 0)}
                domain={['dataMin - 0.02', 'dataMax + 0.02']}
                label={{ value: 'Volatility', position: 'insideBottom', offset: -8, fontSize: 11, fill: 'var(--muted)' }}
              />
              <YAxis
                type="number"
                dataKey="expectedReturn"
                name="Expected return"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => percent(value, 0)}
                domain={['dataMin - 0.02', 'dataMax + 0.02']}
                width={54}
              />
              <ZAxis range={[160, 160]} />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '4 4' }} />
              <Legend
                verticalAlign="top"
                height={30}
                iconSize={10}
                formatter={(value: string) => <span className="compare-legend-text">{value}</span>}
              />
              {solved.map((item, index) => (
                <Scatter
                  key={item.id}
                  name={item.label}
                  data={[points[index]]}
                  fill={item.color}
                  shape={item.shape}
                  stroke="var(--bg)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  <LabelList dataKey="label" position="top" offset={10} fontSize={11} fill="var(--text)" />
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="muted compare-note">
          Up and to the left is better, meaning more expected return for less volatility.
        </p>
      </section>

      <section className="compare-block">
        <h3>Holdings</h3>
        <p className="muted compare-note">
          {tickers.length} tickers across {solved.length} portfolios,{' '}
          {shared.length > 0 ? `${shared.length} held by all of them` : 'none held by all of them'}. A blank
          cell means that portfolio does not hold the ticker.
        </p>
        <div className="bt-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Ticker</th>
                {solved.map((item) => (
                  <th key={item.id}>
                    <span className="series-swatch" style={{ background: item.color }} aria-hidden="true" />
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((ticker) => (
                <tr key={ticker}>
                  <th className="row-label">{ticker}</th>
                  {solved.map((item) => {
                    const weight = weightOf(item, ticker)
                    return (
                      <td key={item.id} className="mono compare-weight">
                        {weight === null ? (
                          <span className="compare-absent">—</span>
                        ) : (
                          <>
                            <span
                              className="compare-weight-bar"
                              style={{ width: `${Math.round(weight * 100)}%`, background: item.color }}
                              aria-hidden="true"
                            />
                            <span className="compare-weight-value">{percent(weight, 1)}</span>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="provenance">
        {solved[0].response.provider} data · {solved[0].response.as_of_start} → {solved[0].response.as_of_end}
      </p>
    </div>
  )
}
