import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SuccessPoint } from '../api/types'

interface TooltipProps {
  active?: boolean
  payload?: { payload: { year: number; prob: number } }[]
}

function OddsTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="fan-tooltip">
      <div className="fan-tooltip-year">Year {point.year.toFixed(1)}</div>
      <div className="mono">{Math.round(point.prob)}% reached by now</div>
    </div>
  )
}

interface Props {
  points: SuccessPoint[]
  confidence: number
  medianMonths: number | null
  years: number
}

export function OddsOverTime({ points, confidence, medianMonths, years }: Props) {
  const data = points.map((point) => ({ year: point.month / 12, prob: point.prob * 100 }))

  return (
    <div className="planner-odds">
      <div className="planner-odds-head">
        <h4>Odds of reaching your goal over time</h4>
        <span className="muted">
          {medianMonths !== null
            ? `Even odds around year ${Math.round(medianMonths / 12)}`
            : `Under even odds within ${years} years`}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value)}y`}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => `${value}%`}
            width={44}
          />
          <Tooltip content={<OddsTooltip />} />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent)"
            fillOpacity={0.16}
            isAnimationActive={false}
          />
          <ReferenceLine
            y={confidence * 100}
            stroke="var(--border)"
            strokeDasharray="4 4"
            label={{
              value: `${Math.round(confidence * 100)}% target`,
              fontSize: 11,
              fill: 'var(--muted)',
              position: 'insideTopRight',
            }}
          />
          {medianMonths !== null && (
            <ReferenceLine x={medianMonths / 12} stroke="var(--accent)" strokeOpacity={0.4} strokeDasharray="4 4" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
