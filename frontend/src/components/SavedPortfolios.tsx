import { useState } from 'react'
import { downloadPortfolioPdf, useDeletePortfolio, usePortfolioDetail, useSavedPortfolios } from '../api/queries'
import type { PortfolioSummary } from '../api/types'
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
        <Skeleton height="96px" radius="14px" />
        <Skeleton height="96px" radius="14px" />
        <Skeleton height="96px" radius="14px" />
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
        <SavedPortfolioCard key={portfolio.id} portfolio={portfolio} onDelete={deletePortfolio} />
      ))}
    </div>
  )
}

function SavedPortfolioCard({
  portfolio,
  onDelete,
}: {
  portfolio: PortfolioSummary
  onDelete: (id: number, name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const detail = usePortfolioDetail(expanded ? portfolio.id : null)
  const toast = useToast()

  const download = async () => {
    setDownloading(true)
    try {
      const blob = await downloadPortfolioPdf(portfolio.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${portfolio.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'portfolio'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      toast('Report downloaded', 'success')
    } catch {
      toast('Could not generate the report.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const weights = detail.data
    ? Object.entries(detail.data.weights).sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="saved-card">
      <div className="saved-card-head">
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
      </div>

      <div className="saved-actions">
        <button type="button" className="signin-trigger" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Hide' : 'View'}
        </button>
        <button type="button" className="signin-trigger" onClick={download} disabled={downloading}>
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
        <button type="button" className="signin-trigger" onClick={() => onDelete(portfolio.id, portfolio.name)}>
          Delete
        </button>
      </div>

      {expanded && (
        <div className="saved-detail">
          {detail.isLoading && <Skeleton height="80px" radius="10px" />}
          {detail.isError && <p className="error">Couldn't load the holdings.</p>}
          {detail.data && (
            <table className="explain-table">
              <thead>
                <tr>
                  <th>Holding</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {weights.map(([ticker, weight]) => (
                  <tr key={ticker}>
                    <td>{ticker}</td>
                    <td className="mono">{percent(weight, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
