import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'
import type { WeightAllocation } from '../api/types'
import { METALLIC_SERIES } from '../lib/series'

interface Slice {
  name: string
  value: number
}

function ActiveShape(props: {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  fill?: string
}) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = '#d4af37',
  } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 9}
        startAngle={startAngle}
        endAngle={endAngle}
        cornerRadius={5}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 13}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        cornerRadius={5}
        fill={fill}
        opacity={0.55}
      />
    </g>
  )
}

export function AllocationChart({ weights }: { weights: WeightAllocation[] }) {
  const [active, setActive] = useState<number | undefined>(undefined)

  const data: Slice[] = weights
    .map((allocation) => ({
      name: allocation.ticker,
      value: Number((allocation.weight * 100).toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)

  const focus = data[active ?? 0]

  return (
    <div className="alloc-chart">
      <div className="alloc-chart__viz" onMouseLeave={() => setActive(undefined)}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <defs>
              {METALLIC_SERIES.map((color, index) => (
                <linearGradient key={color} id={`alloc-grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={74}
              outerRadius={108}
              paddingAngle={2.5}
              cornerRadius={4}
              stroke="rgba(10,12,16,0.65)"
              strokeWidth={1.5}
              activeIndex={active}
              activeShape={ActiveShape}
              onMouseEnter={(_, index) => setActive(index)}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={`url(#alloc-grad-${index % METALLIC_SERIES.length})`} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="alloc-chart__center" aria-hidden="true">
          <span className="alloc-chart__pct">{focus ? `${focus.value.toFixed(1)}%` : ''}</span>
          <span className="alloc-chart__name">{focus ? focus.name : ''}</span>
          <span className="alloc-chart__sub">of {data.length} holdings</span>
        </div>
      </div>

      <div className="alloc-chart__legend">
        {data.map((entry, index) => (
          <button
            type="button"
            key={entry.name}
            className={active === index ? 'alloc-chip is-active' : 'alloc-chip'}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(undefined)}
          >
            <span
              className="alloc-chip__dot"
              style={{ background: METALLIC_SERIES[index % METALLIC_SERIES.length] }}
            />
            <span className="alloc-chip__name">{entry.name}</span>
            <span className="alloc-chip__pct">{entry.value.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}
