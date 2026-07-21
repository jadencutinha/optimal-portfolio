import { Suspense, lazy, useState } from 'react'
import {
  useCancelOrder,
  useCancelOrders,
  useClosePosition,
  useInvest,
  useInvestAccount,
  useInvestHistory,
  useInvestOrders,
  useInvestPositions,
  useLiquidate,
  useMe,
  usePortfolioDetail,
  useRebalance,
  useRebalancePlan,
  useSavedPortfolios,
  useTrade,
} from '../api/queries'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PortfolioChart } from '../components/PortfolioChart'
import { RebalancePanel } from '../components/RebalancePanel'
import { SkeletonCards } from '../components/Skeleton'
import { TradeTicket } from '../components/TradeTicket'
import { extractApiError } from '../lib/errors'
import { useToast } from '../toast/useToast'

const InvestGlobe = lazy(() =>
  import('../components/InvestGlobe').then((module) => ({ default: module.InvestGlobe })),
)

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

interface StatProps {
  label: string
  value: string
  delta?: string
  deltaClass?: string
}

function StatTile({ label, value, delta, deltaClass }: StatProps) {
  return (
    <div className="ist">
      <div className="ist__text">
        <span className="ist__label">{label}</span>
        <div className="ist__value">
          <strong>{value}</strong>
          {delta && <span className={`ist__delta ${deltaClass ?? ''}`}>{delta}</span>}
        </div>
      </div>
    </div>
  )
}

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
  const trade = useTrade()
  const closeOne = useClosePosition()
  const rebalance = useRebalance()
  const toast = useToast()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [amount, setAmount] = useState(1000)
  const detail = usePortfolioDetail(selectedId)

  const [targetId, setTargetId] = useState<number | null>(null)
  const plan = useRebalancePlan(targetId)

  const [confirmingReset, setConfirmingReset] = useState(false)

  const entitlements = (me.data?.entitlements ?? {}) as Record<string, unknown>
  const feeBps = typeof entitlements.trade_fee_bps === 'number' ? entitlements.trade_fee_bps : 0
  const fee = (amount * feeBps) / 10000
  const investable = Math.max(amount - fee, 0)

  const positionList = positions.data ?? []
  const totalPl = positionList.reduce((sum, position) => sum + position.unrealized_pl, 0)
  const costBasis = positionList.reduce((sum, position) => sum + position.cost_basis, 0)
  const totalPlPct = costBasis > 0 ? totalPl / costBasis : 0
  const dayChange = positionList.reduce((sum, position) => sum + position.change_today * position.market_value, 0)
  const invested = account.data?.long_market_value ?? 0
  const dayPct = invested > 0 ? dayChange / invested : 0

  const allOrders = orders.data ?? []
  const openOrders = allOrders.filter((order) => isOpenOrder(order.status))
  const closedOrders = allOrders.filter((order) => !isOpenOrder(order.status))
  const visibleOrders = [...openOrders, ...closedOrders.slice(0, 5)]
  const cancelingId = cancelOne.isPending ? cancelOne.variables : undefined
  const closingSymbol = closeOne.isPending ? closeOne.variables?.symbol : undefined

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

  const onRebalance = () => {
    if (targetId === null) return
    rebalance.mutate(targetId, {
      onSuccess: (summary) => {
        const count = summary.sells.length + summary.buys.length
        toast(`Rebalancing with ${count} order${count === 1 ? '' : 's'}.`, 'success')
      },
      onError: (error) => toast(extractApiError(error, 'Could not rebalance.'), 'error'),
    })
  }

  const onTrade = (symbol: string, side: 'buy' | 'sell', notional: number) => {
    trade.mutate(
      { symbol, side, notional },
      {
        onSuccess: (result) => toast(`${side === 'buy' ? 'Buying' : 'Selling'} ${usd(result.notional)} of ${symbol}.`, 'success'),
        onError: (error) => toast(extractApiError(error, 'Could not place that trade.'), 'error'),
      },
    )
  }

  const onClose = (symbol: string, percentage?: number) => {
    closeOne.mutate(
      { symbol, percentage },
      {
        onSuccess: () =>
          toast(percentage ? `Trimming ${percentage}% of ${symbol}.` : `Closing ${symbol}.`, 'success'),
        onError: (error) => toast(extractApiError(error, `Could not close ${symbol}.`), 'error'),
      },
    )
  }

  const confirmReset = () => {
    liquidate.mutate(undefined, {
      onSuccess: () => {
        toast('Simulator reset to $100,000.', 'success')
        setConfirmingReset(false)
      },
      onError: (error) => {
        toast(extractApiError(error, 'Could not reset the simulator.'), 'error')
        setConfirmingReset(false)
      },
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
      <section className="ihero">
        <Suspense fallback={null}>
          <InvestGlobe gain={dayPct} className="ihero__globe" />
        </Suspense>

        <div className="ihero__content">
          <div className="ihero__head">
            <span className="ihero__pill">Paper account · no real money</span>
            <h2>Invest simulator</h2>
            <p className="muted">
              Practice investing in your optimized portfolios with real market prices and simulated money.
            </p>
          </div>

          {account.isLoading ? (
            <SkeletonCards count={4} />
          ) : account.data ? (
            <div className="ihero__stats">
              <StatTile
                label="Portfolio value"
                value={usd(account.data.portfolio_value)}
                delta={dayChange !== 0 ? `${dayChange > 0 ? '+' : ''}${pct(dayPct)} today` : undefined}
                deltaClass={signClass(dayChange)}
              />
              <StatTile label="Cash available" value={usd(account.data.cash)} />
              <StatTile
                label="Invested"
                value={usd(account.data.long_market_value)}
                delta={`${positionList.length} holding${positionList.length === 1 ? '' : 's'}`}
              />
              <StatTile
                label="Open profit and loss"
                value={usd(totalPl)}
                delta={costBasis > 0 ? `${totalPl >= 0 ? '+' : ''}${pct(totalPlPct)}` : undefined}
                deltaClass={signClass(totalPl)}
              />
            </div>
          ) : null}
        </div>
      </section>

      <PortfolioChart
        points={history.data?.points ?? []}
        window={historyWindow}
        onWindowChange={setHistoryWindow}
        isLoading={history.isLoading}
      />

      <div className="invest-columns">
        <div className="panel invest-buy">
          <h3>Invest in a portfolio</h3>
          {saved.isLoading ? (
            <p className="muted">Loading your saved portfolios…</p>
          ) : (saved.data ?? []).length === 0 ? (
            <p className="muted">Build a portfolio in the Optimizer and save it, then it shows up here to invest in.</p>
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

        <TradeTicket
          feeBps={feeBps}
          cash={account.data?.cash ?? 0}
          isPending={trade.isPending}
          onSubmit={onTrade}
        />
      </div>

      <RebalancePanel
        portfolios={saved.data ?? []}
        selectedId={targetId}
        onSelect={setTargetId}
        plan={plan.data}
        isLoading={plan.isLoading}
        isExecuting={rebalance.isPending}
        onExecute={onRebalance}
      />

      <div className="panel invest-positions">
        <div className="invest-panel-head">
          <h3>Positions</h3>
          {(positionList.length > 0 || openOrders.length > 0) && (
            <button
              type="button"
              className="invest-reset"
              onClick={() => setConfirmingReset(true)}
              disabled={liquidate.isPending}
            >
              {liquidate.isPending ? 'Resetting…' : 'Reset investments'}
            </button>
          )}
        </div>
        {positions.isLoading ? (
          <p className="muted">Loading positions…</p>
        ) : positionList.length === 0 ? (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {positionList.map((position) => (
                  <tr key={position.symbol}>
                    <td>{position.symbol}</td>
                    <td>{position.qty.toFixed(4)}</td>
                    <td>{usd(position.avg_entry_price)}</td>
                    <td>{usd(position.current_price)}</td>
                    <td>{usd(position.market_value)}</td>
                    <td className={signClass(position.unrealized_pl)}>
                      {usd(position.unrealized_pl)} ({pct(position.unrealized_plpc)})
                    </td>
                    <td className="pos-actions">
                      <button
                        type="button"
                        className="pos-btn"
                        onClick={() => onClose(position.symbol, 50)}
                        disabled={closingSymbol === position.symbol}
                      >
                        Trim 50%
                      </button>
                      <button
                        type="button"
                        className="pos-btn is-danger"
                        onClick={() => onClose(position.symbol)}
                        disabled={closingSymbol === position.symbol}
                      >
                        {closingSymbol === position.symbol ? 'Closing…' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {allOrders.length > 0 && (
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
                    <td>
                      <span className={`order-side order-side-${order.side}`}>{order.side}</span>
                    </td>
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

      {confirmingReset && (
        <ConfirmDialog
          title="Reset investments?"
          message="This resets your simulator back to $100,000 and clears every holding and pending order. This cannot be undone."
          confirmLabel="Reset to $100,000"
          cancelLabel="Keep my investments"
          busy={liquidate.isPending}
          onConfirm={confirmReset}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </div>
  )
}
