import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { InvestBenchmark } from '../api/types'
import { money } from '../lib/format'

const WINDOWS = ['1M', '3M', '6M', 'YTD', '1Y'] as const

const PORTFOLIO_COLOR = '#e09743'
const BENCHMARK_COLOR = '#4d9bff'

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const pct = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`

interface Props {
  data: InvestBenchmark | undefined
  window: string
  onWindowChange: (window: string) => void
  isLoading: boolean
  isError: boolean
}

interface TipProps {
  active?: boolean
  payload?: { payload: { label: string; portfolio: number; benchmark: number } }[]
}

function ChartTooltip({ active, payload }: TipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  const lead = point.portfolio - point.benchmark
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{point.label}</div>
      <div className="bench-tip-row">
        <span style={{ color: PORTFOLIO_COLOR }}>You</span>
        <strong>{usd(point.portfolio)}</strong>
      </div>
      <div className="bench-tip-row">
        <span style={{ color: BENCHMARK_COLOR }}>S&amp;P 500</span>
        <strong>{usd(point.benchmark)}</strong>
      </div>
      <div className={lead >= 0 ? 'gain' : 'loss'}>
        {lead >= 0 ? 'Ahead by ' : 'Behind by '}
        {usd(Math.abs(lead))}
      </div>
    </div>
  )
}

export function BenchmarkChart({ data, window, onWindowChange, isLoading, isError }: Props) {
  const chartData = useMemo(
    () =>
      (data?.points ?? []).map((point) => ({
        label: new Date(point.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolio: point.portfolio,
        benchmark: point.benchmark,
      })),
    [data],
  )

  const winning = (data?.alpha ?? 0) >= 0

  return (
    <div className="panel bench">
      <div className="chart-head">
        <div>
          <span className="invest-stat-label">You vs the index</span>
          <div className="bench-headline">
            {data && chartData.length > 1 ? (
              <span className={winning ? 'gain' : 'loss'}>
                {winning ? 'Beating' : 'Trailing'} the S&amp;P 500 by {pct(Math.abs(data.alpha))}
              </span>
            ) : (
              <span className="muted">Waiting for enough history</span>
            )}
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
        <p className="muted">Loading the comparison…</p>
      ) : isError ? (
        <p className="muted chart-empty">
          The index comparison needs price history that is not available right now. Try again shortly.
        </p>
      ) : chartData.length < 2 ? (
        <p className="muted chart-empty">
          Not enough overlapping history yet. This fills in once your account has traded across a few sessions.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.14} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={44} />
              <YAxis tick={{ fontSize: 12 }} width={68} domain={['auto', 'auto']} tickFormatter={(v) => money(Number(v))} />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" height={28} iconType="plainline" />
              <Line
                type="monotone"
                name="Your portfolio"
                dataKey="portfolio"
                stroke={PORTFOLIO_COLOR}
                strokeWidth={2.4}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                name="S&P 500 buy and hold"
                dataKey="benchmark"
                stroke={BENCHMARK_COLOR}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {data && (
            <div className="chart-stats">
              <div>
                <span className="invest-stat-label">Your return</span>
                <strong className={data.portfolio_return >= 0 ? 'gain' : 'loss'}>{pct(data.portfolio_return)}</strong>
              </div>
              <div>
                <span className="invest-stat-label">S&amp;P 500</span>
                <strong className={data.benchmark_return >= 0 ? 'gain' : 'loss'}>{pct(data.benchmark_return)}</strong>
              </div>
              <div>
                <span className="invest-stat-label">Alpha</span>
                <strong className={winning ? 'gain' : 'loss'}>{pct(data.alpha)}</strong>
              </div>
              <div>
                <span className="invest-stat-label">Tracking error</span>
                <strong>{(data.tracking_error * 100).toFixed(2)}%</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
