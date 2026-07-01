import { useDeletePortfolio, useSavedPortfolios } from '../api/queries'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'
import { percent, ratio } from '../lib/format'
import { useToast } from '../toast/useToast'

export function SavedPortfolios() {
  const saved = useSavedPortfolios()
  const remove = useDeletePortfolio()
  const toast = useToast()

  if (saved.isLoading) {
    return (
      <div className="saved-list">
        <Skeleton height="72px" radius="14px" />
        <Skeleton height="72px" radius="14px" />
        <Skeleton height="72px" radius="14px" />
      </div>
    )
  }
  const list = saved.data ?? []
  if (list.length === 0) {
    return (
      <EmptyState
        icon="💾"
        title="No saved portfolios yet"
        description="Run the optimizer and click “Save portfolio” to keep it here."
      />
    )
  }

  const deletePortfolio = (id: number, name: string) => {
    remove.mutate(id, {
      onSuccess: () => toast(`Deleted "${name}"`, 'info'),
      onError: () => toast('Could not delete that portfolio.', 'error'),
    })
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
          <button
            type="button"
            className="signin-trigger"
            onClick={() => deletePortfolio(portfolio.id, portfolio.name)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
