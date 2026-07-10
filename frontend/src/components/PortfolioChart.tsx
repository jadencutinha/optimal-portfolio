import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { InvestHistoryPoint } from '../api/types'
import { money } from '../lib/format'

const WINDOWS = ['1D', '1W', '1M', '3M', 'YTD', '1Y'] as const

const GAIN = '#1baf7a'
const LOSS = '#c0392b'

const usd = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const labelFor = (timestamp: number, window: string) => {
  const date = new Date(timestamp * 1000)
  if (window === '1D') return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (window === '1W') return date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  points: InvestHistoryPoint[]
  window: string
  onWindowChange: (window: string) => void
  isLoading: boolean
}

interface TipProps {
  active?: boolean
  payload?: { payload: { label: string; equity: number; delta: number } }[]
}

function ChartTooltip({ active, payload }: TipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{point.label}</div>
      <div className="chart-tip-value">{usd(point.equity)}</div>
      <div className={point.delta >= 0 ? 'gain' : 'loss'}>
        {point.delta >= 0 ? '+' : ''}
        {usd(point.delta)} since start
      </div>
    </div>
  )
}

export function PortfolioChart({ points, window, onWindowChange, isLoading }: Props) {
  const funded = useMemo(() => {
    const first = points.findIndex((point) => point.equity > 0)
    return first >= 0 ? points.slice(first) : []
  }, [points])

  const stats = useMemo(() => {
    if (funded.length === 0) {
      return { start: 0, end: 0, change: 0, changePct: 0, high: 0, low: 0 }
    }
    const equities = funded.map((point) => point.equity)
    const start = equities[0]
    const end = equities[equities.length - 1]
    return {
      start,
      end,
      change: end - start,
      changePct: start > 0 ? (end - start) / start : 0,
      high: Math.max(...equities),
      low: Math.min(...equities),
    }
  }, [funded])

  const chartData = useMemo(
    () =>
      funded.map((point) => ({
        label: labelFor(point.timestamp, window),
        equity: point.equity,
        delta: point.equity - stats.start,
      })),
    [funded, window, stats.start],
  )

  const positive = stats.change >= 0
  const lineColor = positive ? GAIN : LOSS
  const pad = Math.max((stats.high - stats.low) * 0.12, stats.high * 0.001, 1)

  return (
    <div className="panel invest-chart">
      <div className="chart-head">
        <div>
          <span className="invest-stat-label">Portfolio value</span>
          <div className="chart-value">{usd(stats.end)}</div>
          <div className={`chart-change ${positive ? 'gain' : 'loss'}`}>
            {positive ? '▲' : '▼'} {usd(Math.abs(stats.change))} ({(stats.changePct * 100).toFixed(2)}%){' '}
            <span className="muted">this {window === 'YTD' ? 'year' : 'range'}</span>
          </div>
        </div>
        <div className="chart-ranges">
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              className={window === option ? 'range-btn active' : 'range-btn'}
              onClick={() => onWindowChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading history…</p>
      ) : chartData.length < 2 ? (
        <p className="muted chart-empty">
          Not enough history for this range yet. It fills in as your portfolio ages and you place trades. Try 1D to
          see today.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={40} />
              <YAxis
                tick={{ fontSize: 12 }}
                width={64}
                domain={[stats.low - pad, stats.high + pad]}
                tickFormatter={(value) => money(Number(value))}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={stats.start} stroke="var(--muted)" strokeDasharray="4 4" opacity={0.6} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#equityFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="chart-stats">
            <div>
              <span className="invest-stat-label">Start</span>
              <strong>{usd(stats.start)}</strong>
            </div>
            <div>
              <span className="invest-stat-label">High</span>
              <strong>{usd(stats.high)}</strong>
            </div>
            <div>
              <span className="invest-stat-label">Low</span>
              <strong>{usd(stats.low)}</strong>
            </div>
            <div>
              <span className="invest-stat-label">Data points</span>
              <strong>{chartData.length}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
