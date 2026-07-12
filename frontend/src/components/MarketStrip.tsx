import { useQuotes } from '../api/queries'

const WATCHLIST = ['SPY', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM']

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

const pct = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`

function stamp(iso: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function MarketStrip({ symbols = WATCHLIST }: { symbols?: string[] }) {
  const board = useQuotes(symbols)

  if (board.isError || (board.data && board.data.quotes.length === 0)) return null

  const asOf = stamp(board.data?.as_of ?? null)

  return (
    <section className="mstrip" aria-label="Live market prices">
      <div className="mstrip__head">
        <span className="mstrip__live">
          <span className="mstrip__dot" aria-hidden="true" />
          Live market
        </span>
        {board.data && (
          <span className="mstrip__source">
            {board.data.feed} via {board.data.source}
            {asOf && ` · as of ${asOf}`}
          </span>
        )}
      </div>

      <div className="mstrip__rail">
        {board.isLoading
          ? symbols.slice(0, 6).map((symbol) => (
              <div key={symbol} className="mquote is-loading">
                <span className="mquote__symbol">{symbol}</span>
                <span className="mquote__price">—</span>
              </div>
            ))
          : (board.data?.quotes ?? []).map((quote) => (
              <div key={quote.symbol} className="mquote">
                <span className="mquote__symbol">{quote.symbol}</span>
                <span className="mquote__price">{usd(quote.price)}</span>
                <span className={quote.change >= 0 ? 'mquote__move gain' : 'mquote__move loss'}>
                  {quote.change >= 0 ? '▲' : '▼'} {pct(quote.change_pct)}
                </span>
              </div>
            ))}
      </div>
    </section>
  )
}
