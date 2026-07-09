import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PlanPoint } from '../api/types'
import { money } from '../lib/format'

interface TooltipProps {
  active?: boolean
  payload?: { payload: { year: number; p10: number; p50: number; p90: number } }[]
}

function FanTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="fan-tooltip">
      <div className="fan-tooltip-year">Year {point.year.toFixed(1)}</div>
      <div className="mono">Median {money(point.p50)}</div>
      <div className="mono muted">
        Range {money(point.p10)} to {money(point.p90)}
      </div>
    </div>
  )
}

interface Props {
  timeline: PlanPoint[]
  target?: number | null
  height?: number
}

export function ProjectionFan({ timeline, target = null, height = 300 }: Props) {
  const chartData = timeline.map((point) => ({
    year: point.month / 12,
    p10: point.p10,
    p50: point.p50,
    p90: point.p90,
    bandWidth: point.p90 - point.p10,
  }))

  return (
    <div className="planner-chart">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: number) => `${Math.round(value)}y`}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={money} width={54} />
          <Tooltip content={<FanTooltip />} />
          <Area type="monotone" dataKey="p10" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="bandWidth"
            stackId="band"
            stroke="none"
            fill="var(--accent)"
            fillOpacity={0.2}
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2} dot={false} />
          {target !== null && (
            <ReferenceLine
              y={target}
              stroke="var(--border)"
              strokeDasharray="4 4"
              label={{ value: 'Goal', fontSize: 11, fill: 'var(--muted)', position: 'insideTopRight' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
