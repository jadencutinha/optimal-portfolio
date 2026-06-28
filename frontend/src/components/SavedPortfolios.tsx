import { useDeletePortfolio, useSavedPortfolios } from '../api/queries'
import { percent, ratio } from '../lib/format'

export function SavedPortfolios() {
  const saved = useSavedPortfolios()
  const remove = useDeletePortfolio()

  if (saved.isLoading) {
    return <p className="muted">Loading your portfolios…</p>
  }
  const list = saved.data ?? []
  if (list.length === 0) {
    return <p className="muted">No saved portfolios yet. Run the optimizer and click “Save portfolio”.</p>
  }

  return (
    <div className="saved-list">
      {list.map((portfolio) => (
        <div key={portfolio.id} className="saved-card">
          <div className="saved-main">
            <h3>{portfolio.name}</h3>
            <p className="muted">
              {portfolio.objective} · {portfolio.risk_model} ·{' '}
              {new Date(portfolio.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="saved-metrics mono">
            {typeof portfolio.metrics.sharpe_ratio === 'number' && (
              <span>Sharpe {ratio(portfolio.metrics.sharpe_ratio)}</span>
            )}
            {typeof portfolio.metrics.expected_return === 'number' && (
              <span>{percent(portfolio.metrics.expected_return)} ret</span>
            )}
            {typeof portfolio.metrics.volatility === 'number' && (
              <span>{percent(portfolio.metrics.volatility)} vol</span>
            )}
          </div>
          <button type="button" className="signin-trigger" onClick={() => remove.mutate(portfolio.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
