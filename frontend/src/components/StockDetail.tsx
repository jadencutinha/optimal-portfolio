import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usePrices } from '../api/queries'
import type { TickerPrices, UniverseAsset } from '../api/types'
import { percent } from '../lib/format'
import { TRADING_DAYS, correlation, logReturns, maxDrawdown, stdev } from '../lib/stats'

interface Props {
  ticker: string
  asset?: UniverseAsset
  basket: string[]
  onClose: () => void
}

function seriesFor(data: TickerPrices[] | undefined, ticker: string) {
  return data?.find((entry) => entry.ticker === ticker)
}

export function StockDetail({ ticker, asset, basket, onClose }: Props) {
  const others = basket.filter((symbol) => symbol !== ticker)
  const request = useMemo(() => [ticker, ...others], [ticker, others])
  const prices = usePrices(request, true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const self = seriesFor(prices.data?.series, ticker)

  const stats = useMemo(() => {
    if (!self || self.points.length < 20) return null
    const own = logReturns(self.points)
    const vol = stdev(own) * Math.sqrt(TRADING_DAYS)
    const drawdown = maxDrawdown(self.points)

    const correlations = others
      .map((symbol) => {
        const other = seriesFor(prices.data?.series, symbol)
        if (!other || other.points.length < 20) return null
        return { symbol, value: correlation(own, logReturns(other.points)) }
      })
      .filter((item): item is { symbol: string; value: number } => item !== null)

    const average =
      correlations.length > 0
        ? correlations.reduce((sum, item) => sum + item.value, 0) / correlations.length
        : null

    const highest = correlations.slice().sort((a, b) => b.value - a.value)[0] ?? null

    return { vol, drawdown, average, highest, correlations }
  }, [self, others, prices.data])

  const chart = useMemo(
    () => (self ? self.points.map((point) => ({ date: point.date, close: point.close })) : []),
    [self],
  )

  const diversifies = stats?.average !== null && stats?.average !== undefined && stats.average < 0.5

  return createPortal(
    <div className="modal-overlay stock-overlay" onClick={onClose}>
      <aside
        className="stock-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${ticker} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <header className="stock-drawer__head">
          <span className="stock-drawer__ticker">{ticker}</span>
          <h2>{asset?.name ?? ticker}</h2>
          {asset && <span className="stock-drawer__sector">{asset.sector}</span>}
        </header>

        <p className="stock-drawer__framing">
          What matters is how this fits the rest of your basket, not how it has performed. Past
          returns are the worst predictor of future ones.
        </p>

        {prices.isLoading && <p className="muted">Loading price history…</p>}
        {prices.isError && <p className="ticker-warning">Couldn't load price history for {ticker}.</p>}

        {stats && (
          <>
            <section className="stock-fit">
              <h3>How it fits your basket</h3>
              {others.length === 0 ? (
                <p className="muted stock-fit__empty">
                  Add another holding and we'll show how this one moves against it.
                </p>
              ) : (
                <>
                  <div className="stock-fit__grid">
                    <div className={diversifies ? 'stock-fit__stat is-good' : 'stock-fit__stat is-warn'}>
                      <span className="stock-fit__label">Avg correlation to your basket</span>
                      <span className="stock-fit__value">
                        {stats.average === null ? '—' : stats.average.toFixed(2)}
                      </span>
                      <span className="stock-fit__note">
                        {stats.average === null
                          ? ''
                          : diversifies
                            ? 'Moves fairly independently, so it can lower portfolio risk.'
                            : 'Moves closely with what you already hold, so it adds less diversification.'}
                      </span>
                    </div>
                    {stats.highest && (
                      <div className="stock-fit__stat">
                        <span className="stock-fit__label">Most similar holding</span>
                        <span className="stock-fit__value">{stats.highest.symbol}</span>
                        <span className="stock-fit__note">
                          Correlation {stats.highest.value.toFixed(2)}. The closer to 1.00, the more
                          these two are the same bet.
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            <section className="stock-risk">
              <div className="stock-risk__item">
                <span className="stock-fit__label">Annualized volatility</span>
                <span className="stock-fit__value">{percent(stats.vol)}</span>
              </div>
              <div className="stock-risk__item">
                <span className="stock-fit__label">Worst drawdown</span>
                <span className="stock-fit__value loss">{percent(stats.drawdown)}</span>
              </div>
            </section>
          </>
        )}

        {chart.length > 0 && (
          <section className="stock-chart">
            <h3>Price history</h3>
            <div className="stock-chart__frame">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
                    contentStyle={{
                      background: '#121215',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#d4af37"
                    strokeWidth={1.6}
                    fill="url(#stockFill)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="stock-chart__caption">
              Shape only. The optimizer never looks at this line to decide a weight.
            </p>
          </section>
        )}
      </aside>
    </div>,
    document.body,
  )
}
