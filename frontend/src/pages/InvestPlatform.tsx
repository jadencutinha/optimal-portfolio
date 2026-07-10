import { useState } from 'react'
import {
  useCancelOrder,
  useCancelOrders,
  useInvest,
  useInvestAccount,
  useInvestHistory,
  useInvestOrders,
  useInvestPositions,
  useLiquidate,
  useMe,
  usePortfolioDetail,
  useSavedPortfolios,
} from '../api/queries'
import { EmptyState } from '../components/EmptyState'
import { PortfolioChart } from '../components/PortfolioChart'
import { SkeletonCards } from '../components/Skeleton'
import { extractApiError } from '../lib/errors'
import { useToast } from '../toast/useToast'

const usd = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const pct = (value: number) => `${(value * 100).toFixed(2)}%`

const signClass = (value: number) => (value > 0 ? 'gain' : value < 0 ? 'loss' : '')

const CLOSED_ORDER_STATES = ['filled', 'canceled', 'expired', 'rejected', 'done_for_day']
const isOpenOrder = (status: string) => !CLOSED_ORDER_STATES.includes(status)

export function InvestPlatform() {
  const me = useMe()
  const account = useInvestAccount()
  const positions = useInvestPositions()
  const [historyWindow, setHistoryWindow] = useState('1D')
  const history = useInvestHistory(historyWindow)
  const orders = useInvestOrders()
  const saved = useSavedPortfolios()
  const invest = useInvest()
  const liquidate = useLiquidate()
  const cancelAll = useCancelOrders()
  const cancelOne = useCancelOrder()
  const toast = useToast()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [amount, setAmount] = useState(1000)
  const detail = usePortfolioDetail(selectedId)

  const entitlements = (me.data?.entitlements ?? {}) as Record<string, unknown>
  const feeBps = typeof entitlements.trade_fee_bps === 'number' ? entitlements.trade_fee_bps : 0
  const fee = (amount * feeBps) / 10000
  const investable = Math.max(amount - fee, 0)

  const totalPl = (positions.data ?? []).reduce((sum, position) => sum + position.unrealized_pl, 0)
  const allOrders = orders.data ?? []
  const openOrders = allOrders.filter((order) => isOpenOrder(order.status))
  const closedOrders = allOrders.filter((order) => !isOpenOrder(order.status))
  const visibleOrders = [...openOrders, ...closedOrders.slice(0, 5)]
  const cancelingId = cancelOne.isPending ? cancelOne.variables : undefined

  const onInvest = () => {
    if (!detail.data) {
      toast('Pick a portfolio to invest in first.', 'error')
      return
    }
    if (amount <= 0) {
      toast('Enter an amount greater than zero.', 'error')
      return
    }
    invest.mutate(
      { weights: detail.data.weights, amount },
      {
        onSuccess: (summary) => {
          const placed = summary.orders.filter((order) => order.status !== 'skipped' && order.status !== 'error').length
          const failed = summary.orders.filter((order) => order.status === 'error').length
          let message = `Placed ${placed} order${placed === 1 ? '' : 's'} investing ${usd(summary.invested)}`
          if (summary.fee > 0) message += ` after a ${usd(summary.fee)} fee`
          toast(message, failed > 0 ? 'error' : 'success')
        },
        onError: (error) => toast(extractApiError(error, 'Could not place the orders.'), 'error'),
      },
    )
  }

  const onReset = () => {
    if (!window.confirm('Sell all positions and reset the simulator? This closes every holding.')) return
    liquidate.mutate(undefined, {
      onSuccess: (result) => toast(`Closing ${result.closed} position${result.closed === 1 ? '' : 's'}.`, 'success'),
      onError: (error) => toast(extractApiError(error, 'Could not reset the simulator.'), 'error'),
    })
  }

  const onCancelAll = () => {
    cancelAll.mutate(undefined, {
      onSuccess: (result) =>
        toast(`Canceling ${result.canceled} pending order${result.canceled === 1 ? '' : 's'}.`, 'success'),
      onError: (error) => toast(extractApiError(error, 'Could not cancel the orders.'), 'error'),
    })
  }

  const onCancelOne = (orderId: string) => {
    cancelOne.mutate(orderId, {
      onSuccess: () => toast('Order canceled.', 'success'),
      onError: (error) => toast(extractApiError(error, 'Could not cancel that order.'), 'error'),
    })
  }

  if (account.isError) {
    return (
      <div className="invest-platform">
        <EmptyState
          title="Investing is not connected"
          description={extractApiError(account.error, 'The brokerage connection is not configured yet.')}
        />
      </div>
    )
  }

  return (
    <div className="invest-platform">
      <div className="invest-hero">
        <div>
          <h2>Invest simulator</h2>
          <p className="muted">
            Practice investing in your optimized portfolios with real market prices and simulated money.
          </p>
        </div>
        <span className="invest-pill">Paper account · no real money</span>
      </div>

      {account.isLoading ? (
        <SkeletonCards count={4} />
      ) : account.data ? (
        <div className="invest-stats">
          <div className="invest-stat">
            <span className="invest-stat-label">Portfolio value</span>
            <strong>{usd(account.data.portfolio_value)}</strong>
          </div>
          <div className="invest-stat">
            <span className="invest-stat-label">Cash available</span>
            <strong>{usd(account.data.cash)}</strong>
          </div>
          <div className="invest-stat">
            <span className="invest-stat-label">Invested</span>
            <strong>{usd(account.data.long_market_value)}</strong>
          </div>
          <div className="invest-stat">
            <span className="invest-stat-label">Open profit and loss</span>
            <strong className={signClass(totalPl)}>{usd(totalPl)}</strong>
          </div>
        </div>
      ) : null}

      <PortfolioChart
        points={history.data?.points ?? []}
        window={historyWindow}
        onWindowChange={setHistoryWindow}
        isLoading={history.isLoading}
      />

      <div className="panel invest-buy">
        <h3>Invest in a portfolio</h3>
        {saved.isLoading ? (
          <p className="muted">Loading your saved portfolios…</p>
        ) : (saved.data ?? []).length === 0 ? (
          <p className="muted">
            Build a portfolio in the Optimizer and save it, then it shows up here to invest in.
          </p>
        ) : (
          <div className="invest-buy-row">
            <label className="invest-field">
              <span>Portfolio</span>
              <select
                value={selectedId ?? ''}
                onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Select a saved portfolio</option>
                {(saved.data ?? []).map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="invest-field">
              <span>Amount (USD)</span>
              <input
                type="number"
                min={1}
                step={100}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <div className="invest-fee">
              {feeBps > 0 ? (
                <span>
                  Gas fee {pct(feeBps / 10000)} ({usd(fee)}). {usd(investable)} invested.
                </span>
              ) : (
                <span className="gain">No trading fee on Pro. Full {usd(amount)} invested.</span>
              )}
            </div>
            <button
              type="button"
              className="primary"
              disabled={!detail.data || amount <= 0 || invest.isPending}
              onClick={onInvest}
            >
              {invest.isPending ? 'Placing orders…' : 'Invest'}
            </button>
          </div>
        )}
      </div>

      <div className="panel invest-positions">
        <div className="invest-panel-head">
          <h3>Positions</h3>
          {(positions.data ?? []).length > 0 && (
            <button type="button" className="signin-trigger" onClick={onReset} disabled={liquidate.isPending}>
              {liquidate.isPending ? 'Resetting…' : 'Sell everything'}
            </button>
          )}
        </div>
        {positions.isLoading ? (
          <p className="muted">Loading positions…</p>
        ) : (positions.data ?? []).length === 0 ? (
          <div>
            <p className="muted">No positions yet. Invest in a portfolio above to get started.</p>
            {openOrders.length > 0 && (
              <p className="muted">
                {openOrders.length} order{openOrders.length === 1 ? '' : 's'} waiting. Market orders placed while the
                market is closed fill when it next opens.
              </p>
            )}
          </div>
        ) : (
          <div className="invest-table-wrap">
            <table className="invest-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg cost</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Profit and loss</th>
                </tr>
              </thead>
              <tbody>
                {(positions.data ?? []).map((position) => (
                  <tr key={position.symbol}>
                    <td>{position.symbol}</td>
                    <td>{position.qty.toFixed(4)}</td>
                    <td>{usd(position.avg_entry_price)}</td>
                    <td>{usd(position.current_price)}</td>
                    <td>{usd(position.market_value)}</td>
                    <td className={signClass(position.unrealized_pl)}>
                      {usd(position.unrealized_pl)} ({pct(position.unrealized_plpc)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(orders.data ?? []).length > 0 && (
        <div className="panel invest-orders">
          <div className="invest-panel-head">
            <h3>Recent orders</h3>
            {openOrders.length > 0 && (
              <button type="button" className="signin-trigger" onClick={onCancelAll} disabled={cancelAll.isPending}>
                {cancelAll.isPending ? 'Canceling…' : `Cancel pending (${openOrders.length})`}
              </button>
            )}
          </div>
          <div className="invest-table-wrap">
            <table className="invest-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.symbol}</td>
                    <td>{order.side}</td>
                    <td>{order.notional !== null ? usd(order.notional) : `${order.qty ?? 0} sh`}</td>
                    <td>
                      <span className={`invest-status invest-status-${order.status}`}>{order.status}</span>
                    </td>
                    <td>
                      {isOpenOrder(order.status) && (
                        <button
                          type="button"
                          className="invest-cancel"
                          onClick={() => onCancelOne(order.id)}
                          disabled={cancelingId === order.id}
                        >
                          {cancelingId === order.id ? 'Canceling…' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {openOrders.length > 0 && (
            <p className="muted invest-note">
              A canceled order can take a moment to move out of pending, especially outside market hours.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
