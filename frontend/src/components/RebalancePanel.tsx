import type { InvestDriftRow, InvestRebalancePlan, PortfolioSummary } from '../api/types'

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const pct = (value: number) => `${(value * 100).toFixed(1)}%`

interface Props {
  portfolios: PortfolioSummary[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  plan: InvestRebalancePlan | undefined
  isLoading: boolean
  isExecuting: boolean
  onExecute: () => void
}

function DriftBar({ row }: { row: InvestDriftRow }) {
  const scale = Math.max(row.current_weight, row.target_weight, 0.01)
  return (
    <div className="drift-row">
      <div className="drift-symbol">
        <strong>{row.symbol}</strong>
        <span className={`drift-tag drift-tag-${row.action}`}>{row.action}</span>
      </div>

      <div className="drift-bars">
        <div className="drift-bar">
          <span className="drift-bar-label">now</span>
          <div className="drift-track">
            <div className="drift-fill is-current" style={{ width: `${(row.current_weight / scale) * 100}%` }} />
          </div>
          <span className="drift-bar-value">{pct(row.current_weight)}</span>
        </div>
        <div className="drift-bar">
          <span className="drift-bar-label">target</span>
          <div className="drift-track">
            <div className="drift-fill is-target" style={{ width: `${(row.target_weight / scale) * 100}%` }} />
          </div>
          <span className="drift-bar-value">{pct(row.target_weight)}</span>
        </div>
      </div>

      <div className={`drift-delta ${row.action === 'buy' ? 'gain' : row.action === 'sell' ? 'loss' : 'muted'}`}>
        {row.action === 'hold' ? 'on target' : `${row.delta > 0 ? '+' : '−'}${usd(Math.abs(row.delta))}`}
      </div>
    </div>
  )
}

export function RebalancePanel({
  portfolios,
  selectedId,
  onSelect,
  plan,
  isLoading,
  isExecuting,
  onExecute,
}: Props) {
  const trades = plan?.rows.filter((row) => row.action !== 'hold') ?? []

  return (
    <div className="panel rebalance">
      <div className="invest-panel-head">
        <div>
          <h3>Rebalance to target</h3>
          <p className="muted rebalance-sub">
            Your holdings drift as prices move. Pick a saved portfolio and bring your account back to its optimal
            weights.
          </p>
        </div>
        {plan && plan.total_value > 0 && (
          <div className="rebalance-drift">
            <span className="invest-stat-label">Max drift</span>
            <strong className={plan.max_drift > 0.05 ? 'loss' : 'gain'}>{pct(plan.max_drift)}</strong>
          </div>
        )}
      </div>

      {portfolios.length === 0 ? (
        <p className="muted">Save a portfolio in the Optimizer and it becomes a rebalance target here.</p>
      ) : (
        <>
          <label className="invest-field rebalance-picker">
            <span>Target portfolio</span>
            <select
              value={selectedId ?? ''}
              onChange={(event) => onSelect(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Select a saved portfolio</option>
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </label>

          {selectedId === null ? (
            <p className="muted">Choose a target to see how far your holdings have drifted.</p>
          ) : isLoading ? (
            <p className="muted">Measuring drift…</p>
          ) : !plan ? null : plan.message ? (
            <p className="muted">{plan.message}</p>
          ) : (
            <>
              <div className="drift-list">
                {plan.rows.map((row) => (
                  <DriftBar key={row.symbol} row={row} />
                ))}
              </div>

              <div className="rebalance-actions">
                <div className="rebalance-summary">
                  <span>
                    {trades.length} trade{trades.length === 1 ? '' : 's'} to realign{' '}
                    {usd(plan.total_value)}
                  </span>
                  {plan.fee > 0 && <span className="muted">Gas fee of {usd(plan.fee)} on the buys.</span>}
                </div>
                <button type="button" className="primary" onClick={onExecute} disabled={isExecuting || !plan.tradable}>
                  {isExecuting ? 'Placing orders…' : 'Rebalance now'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
