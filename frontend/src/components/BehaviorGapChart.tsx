import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BehaviorGapResponse } from '../api/types'
import { money } from '../lib/format'
import { SERIES_COLORS } from '../lib/series'

const DISCIPLINED = SERIES_COLORS[0]
const BEHAVIORAL = SERIES_COLORS[1]

interface TooltipProps {
  active?: boolean
  label?: string | number
  payload?: { name: string; value: number; color: string }[]
}

function GapTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="fan-tooltip">
      <div className="fan-tooltip-year">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="mono">
          {entry.name} {money(entry.value)}
        </div>
      ))}
    </div>
  )
}

export function BehaviorGapChart({ result }: { result: BehaviorGapResponse }) {
  const byDate = new Map<string, { date: string; disciplined?: number; behavioral?: number }>()
  result.disciplined.curve.forEach((point) => {
    byDate.set(point.date, { date: point.date, disciplined: point.value })
  })
  result.behavioral.curve.forEach((point) => {
    const existing = byDate.get(point.date) ?? { date: point.date }
    existing.behavioral = point.value
    byDate.set(point.date, existing)
  })
  const data = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))

  const panics = new Set(result.behavioral.panic_dates)
  const panicPoints = data.filter((point) => panics.has(point.date) && point.behavioral !== undefined)

  return (
    <div className="planner-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            minTickGap={48}
            tickFormatter={(value: string) => value.slice(0, 7)}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={money} width={58} />
          <Tooltip content={<GapTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            iconSize={10}
            formatter={(value: string) => <span className="compare-legend-text">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="disciplined"
            name="Disciplined"
            stroke={DISCIPLINED}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="behavioral"
            name="Your instincts"
            stroke={BEHAVIORAL}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {panicPoints.map((point) => (
            <ReferenceDot
              key={point.date}
              x={point.date}
              y={point.behavioral as number}
              r={5}
              fill={BEHAVIORAL}
              stroke="var(--bg)"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {panicPoints.length > 0 && (
        <p className="muted compare-note">
          Each marked point is a moment your stated rule would have made you sell.
        </p>
      )}
    </div>
  )
}
