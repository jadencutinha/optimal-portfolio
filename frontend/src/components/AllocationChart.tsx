import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { WeightAllocation } from '../api/types'
import { METALLIC_SERIES } from '../lib/series'

const COLORS = METALLIC_SERIES

export function AllocationChart({ weights }: { weights: WeightAllocation[] }) {
  const data = weights.map((allocation) => ({
    name: allocation.ticker,
    value: Number((allocation.weight * 100).toFixed(2)),
  }))

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={112} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
