import type { ExplainResponse } from '../api/types'
import { percent, ratio } from '../lib/format'

const LESSONS = [
  { label: 'Diversification & correlation', where: 'Track 2 · Portfolio construction' },
  { label: 'The efficient frontier', where: 'Track 2 · Mean-variance optimization' },
  { label: 'Risk contribution & risk parity', where: 'Track 3 · Advanced risk models' },
]

interface Props {
  data: ExplainResponse
}

export function Explanation({ data }: Props) {
  const maxRc = Math.max(...data.contributions.map((row) => row.risk_contribution), 0.0001)
  const holdings = data.contributions.length

  return (
    <div className="explanation">
      <h3>Why this portfolio?</h3>
      <p className="muted">
        The optimizer spreads risk across ~{data.effective_holdings.toFixed(1)} of {holdings} holdings
        {data.top_risk_driver ? (
          <>
            {' '}
            and <strong>{data.top_risk_driver}</strong> contributes the most risk.
          </>
        ) : (
          '.'
        )}{' '}
        {data.binding_max_weight
          ? `The per-holding cap is binding on ${data.binding_tickers.join(', ')}. It wanted to hold more.`
          : 'No position cap is binding, so weights are set purely by the risk/return trade-off.'}
      </p>

      <div className="explain-metrics">
        <div className="explain-metric">
          <span className="explain-metric-label">Expected return</span>
          <span className="explain-metric-value">{percent(data.expected_return)}</span>
        </div>
        <div className="explain-metric">
          <span className="explain-metric-label">Volatility</span>
          <span className="explain-metric-value">{percent(data.volatility)}</span>
        </div>
        <div className="explain-metric">
          <span className="explain-metric-label">Sharpe</span>
          <span className="explain-metric-value">{ratio(data.sharpe_ratio)}</span>
        </div>
        <div className="explain-metric">
          <span className="explain-metric-label">Effective holdings</span>
          <span className="explain-metric-value">{data.effective_holdings.toFixed(1)}</span>
        </div>
      </div>

      <table className="explain-table">
        <thead>
          <tr>
            <th>Holding</th>
            <th>Weight</th>
            <th>Share of risk</th>
            <th>Share of return</th>
          </tr>
        </thead>
        <tbody>
          {data.contributions.map((row) => (
            <tr key={row.ticker}>
              <td>
                {row.ticker}
                {row.at_max_bound && <span className="cap-badge">at cap</span>}
              </td>
              <td className="mono">{percent(row.weight, 1)}</td>
              <td>
                <div className="risk-bar-track">
                  <div
                    className="risk-bar-fill"
                    style={{ width: `${(row.risk_contribution / maxRc) * 100}%` }}
                  />
                  <span className="risk-bar-label">{percent(row.risk_contribution, 1)}</span>
                </div>
              </td>
              <td className="mono">{percent(row.return_contribution, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="explain-subhead">What if you changed one thing?</h4>
      <div className="counterfactual-grid">
        {data.counterfactuals.map((cf) => {
          const better = cf.delta_sharpe >= 0
          return (
            <div key={cf.label} className="counterfactual-card">
              <div className="counterfactual-head">
                <span className="counterfactual-label">{cf.label}</span>
                <span className={`counterfactual-delta ${better ? 'up' : 'down'}`}>
                  {better ? '+' : ''}
                  {ratio(cf.delta_sharpe)} Sharpe
                </span>
              </div>
              <p className="counterfactual-desc">{cf.description}</p>
              <p className="mono counterfactual-stats">
                Return {percent(cf.expected_return)} · Vol {percent(cf.volatility)} · Sharpe{' '}
                {ratio(cf.sharpe_ratio)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="explain-lessons">
        <span className="muted">Learn the theory:</span>
        {LESSONS.map((lesson) => (
          <span key={lesson.label} className="lesson-chip" title={lesson.where}>
            {lesson.label}
          </span>
        ))}
      </div>
    </div>
  )
}
