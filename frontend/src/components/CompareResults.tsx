import {
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
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

function GlowMarker(props: {
  cx?: number
  cy?: number
  fill?: string
  payload?: { radius?: number }
}) {
  const { cx = 0, cy = 0, fill = '#d4af37', payload } = props
  const r = payload?.radius ?? 12
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 11} fill={fill} opacity={0.13} />
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={fill} strokeOpacity={0.45} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
      <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.42} fill="#ffffff" opacity={0.4} />
    </g>
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

  const sharpes = points.map((point) => point.sharpe)
  const minSharpe = Math.min(...sharpes)
  const maxSharpe = Math.max(...sharpes)
  const radiusFor = (sharpe: number) =>
    maxSharpe === minSharpe ? 13 : 10 + ((sharpe - minSharpe) / (maxSharpe - minSharpe)) * 8
  const plotted = points.map((point) => ({ ...point, radius: radiusFor(point.sharpe) }))
  const avgVol = points.reduce((sum, point) => sum + point.volatility, 0) / points.length
  const avgReturn = points.reduce((sum, point) => sum + point.expectedReturn, 0) / points.length

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
        <div className="compare-scatter">
          <span className="compare-scatter__better" aria-hidden="true">
            Better ↖
          </span>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 30, right: 34, bottom: 22, left: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.2} vertical horizontal />
              <XAxis
                type="number"
                dataKey="volatility"
                name="Volatility"
                tick={{ fontSize: 12, fill: 'var(--muted)' }}
                tickFormatter={(value: number) => percent(value, 0)}
                domain={['dataMin - 0.02', 'dataMax + 0.02']}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                label={{ value: 'Volatility', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--muted)' }}
              />
              <YAxis
                type="number"
                dataKey="expectedReturn"
                name="Expected return"
                tick={{ fontSize: 12, fill: 'var(--muted)' }}
                tickFormatter={(value: number) => percent(value, 0)}
                domain={['dataMin - 0.02', 'dataMax + 0.02']}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
                width={54}
                label={{ value: 'Return', angle: -90, position: 'insideLeft', offset: 16, fontSize: 11, fill: 'var(--muted)' }}
              />
              {points.length > 1 && (
                <>
                  <ReferenceLine x={avgVol} stroke="var(--muted)" strokeDasharray="4 5" strokeOpacity={0.28} />
                  <ReferenceLine y={avgReturn} stroke="var(--muted)" strokeDasharray="4 5" strokeOpacity={0.28} />
                </>
              )}
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '4 4', stroke: 'var(--gold)' }} />
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
                  data={[plotted[index]]}
                  fill={item.color}
                  legendType="circle"
                  shape={GlowMarker}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="label"
                    position="top"
                    offset={16}
                    fontSize={12}
                    fontWeight={700}
                    fill="var(--text)"
                  />
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="muted compare-note">
          Up and to the left is better, meaning more expected return for less volatility. Marker size
          scales with each portfolio's Sharpe ratio.
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
