import type { OptimizeResponse } from '../api/types'
import { percent, ratio } from '../lib/format'
import { Tooltip } from './ToolTip'

export function StatCards({ result }: { result: OptimizeResponse }) {
  const stats = [
    { label: 'Expected Return', 
      value: percent(result.metrics.expected_return), 
      hint: 'annualized' 
    },
    { label: 'Volatility', 
      value: percent(result.metrics.volatility), 
      hint: 'annualized', 
      tooltip: 'Volatility measures how much the value of your portfolio may go up and down over time. A higher number means higher risk.'
    },
    { label: 'Sharpe Ratio', 
      value: ratio(result.metrics.sharpe_ratio), 
      hint: `rf ${percent(result.risk_free_rate)}`,
      tooltip: 'Sharpe Ratio compares your return to the amount of risk you are taking. A higher value means better returns for the level of risk.'
    },
  ]

  return (
    <div className="stat-cards">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          {stat.tooltip ? (
            <Tooltip text={stat.tooltip}>
              <span className="stat-label">{stat.label}</span>
            </Tooltip>
            ): (<span className="stat-label">{stat.label}</span>)
          }
          <span className="stat-value">{stat.value}</span>
          <span className="stat-hint">{stat.hint}</span>
        </div>
      ))}
    </div>
  )
}
