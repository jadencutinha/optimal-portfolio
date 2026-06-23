import type { OptimizeResponse } from '../api/types'
import { percent, ratio } from '../lib/format'

export function StatCards({ result }: { result: OptimizeResponse }) {
  const stats = [
    { label: 'Expected Return', value: percent(result.metrics.expected_return), hint: 'annualized' },
    { label: 'Volatility', value: percent(result.metrics.volatility), hint: 'annualized' },
    { label: 'Sharpe Ratio', value: ratio(result.metrics.sharpe_ratio), hint: `rf ${percent(result.risk_free_rate)}` },
  ]

  return (
    <div className="stat-cards">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <span className="stat-label">{stat.label}</span>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-hint">{stat.hint}</span>
        </div>
      ))}
    </div>
  )
}
