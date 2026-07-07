import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { WeightAllocation } from '../api/types'
import { percent, ratio } from '../lib/format'
import { Tooltip as CustomTooltip } from './ToolTip'

interface Props {
  title: string
  weights: WeightAllocation[]
  expectedReturn: number
  volatility: number
  sharpe: number
}

const SECTOR_COLORS = ['#2e7d32', '#1b5e20', '#66bb6a', '#f59e0b', '#a855f7', '#14b8a6', '#ef4444', '#3b82f6', '#ec4899']

export function PortfolioDetail({ title, weights, expectedReturn, volatility, sharpe }: Props) {
  const bySector = new Map<string, number>()
  for (const allocation of weights) {
    const sector = allocation.sector ?? 'Unknown'
    bySector.set(sector, (bySector.get(sector) ?? 0) + allocation.weight)
  }
  const sectorData = Array.from(bySector.entries())
    .map(([name, value]) => ({ name, value: Number((value * 100).toFixed(2)) }))
    .sort((a, b) => b.value - a.value)

  const hhi = weights.reduce((sum, allocation) => sum + allocation.weight * allocation.weight, 0)
  const effectiveHoldings = hhi > 0 ? 1 / hhi : 0
  const largest = weights.reduce((max, allocation) => Math.max(max, allocation.weight), 0)

  return (
    <div className="portfolio-detail">
      <h3>{title}</h3>
      <div className="detail-grid">
        <div className="detail-chart">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={90} paddingAngle={2}>
                {sectorData.map((entry, index) => (
                  <Cell key={entry.name} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="detail-stats">
          <dl>
            <div>
              <dt>Expected return</dt>
              <dd className="mono">{percent(expectedReturn)}</dd>
            </div>
            <div>
              <dt>Volatility</dt>
              <dd className="mono">{percent(volatility)}</dd>
            </div>
            <div>
              <dt>Sharpe ratio</dt>
              <dd className="mono">{ratio(sharpe)}</dd>
            </div>
            <div>
              <CustomTooltip text="placeholder">
                <dt>Concentration (HHI)</dt>
              </CustomTooltip>
              <dd className="mono">{ratio(hhi, 3)}</dd>
            </div>
            <div>
              <CustomTooltip text="placeholder">
                <dt>Effective holdings</dt>
              </CustomTooltip>
              <dd className="mono">{ratio(effectiveHoldings, 1)}</dd>
            </div>
            <div>
              <dt>Largest position</dt>
              <dd className="mono">{percent(largest)}</dd>
            </div>
            <div>
              <dt>Sectors</dt>
              <dd className="mono">{sectorData.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="sector-breakdown">
        {sectorData.map((entry, index) => (
          <span key={entry.name} className="sector-pill">
            <i className="dot" style={{ background: SECTOR_COLORS[index % SECTOR_COLORS.length] }} />
            {entry.name} · {entry.value.toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  )
}
