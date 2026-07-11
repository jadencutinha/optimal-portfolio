import { useState } from 'react'

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const PRESETS = [100, 500, 1000, 5000]

interface Props {
  feeBps: number
  cash: number
  isPending: boolean
  onSubmit: (symbol: string, side: 'buy' | 'sell', notional: number) => void
}

export function TradeTicket({ feeBps, cash, isPending, onSubmit }: Props) {
  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState(500)

  const fee = side === 'buy' ? (amount * feeBps) / 10000 : 0
  const net = Math.max(amount - fee, 0)
  const ready = symbol.trim().length > 0 && amount > 0 && !isPending
  const overCash = side === 'buy' && amount > cash

  const submit = () => {
    if (!ready) return
    onSubmit(symbol.trim().toUpperCase(), side, amount)
    setSymbol('')
  }

  return (
    <div className="panel ticket">
      <div className="invest-panel-head">
        <div>
          <h3>Trade ticket</h3>
          <p className="muted rebalance-sub">Buy or sell a single ticker in dollars. Fractional shares are fine.</p>
        </div>
      </div>

      <div className="ticket-side">
        <button
          type="button"
          className={side === 'buy' ? 'ticket-side-btn is-buy is-active' : 'ticket-side-btn'}
          onClick={() => setSide('buy')}
          aria-pressed={side === 'buy'}
        >
          Buy
        </button>
        <button
          type="button"
          className={side === 'sell' ? 'ticket-side-btn is-sell is-active' : 'ticket-side-btn'}
          onClick={() => setSide('sell')}
          aria-pressed={side === 'sell'}
        >
          Sell
        </button>
      </div>

      <div className="ticket-grid">
        <label className="invest-field">
          <span>Ticker</span>
          <input
            type="text"
            value={symbol}
            placeholder="AAPL"
            maxLength={12}
            autoCapitalize="characters"
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
          />
        </label>
        <label className="invest-field">
          <span>Amount (USD)</span>
          <input
            type="number"
            min={1}
            step={50}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="ticket-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={amount === preset ? 'ticket-preset is-active' : 'ticket-preset'}
            onClick={() => setAmount(preset)}
          >
            {usd(preset)}
          </button>
        ))}
      </div>

      <div className="ticket-foot">
        <div className="ticket-note">
          {side === 'buy' && fee > 0 ? (
            <span>
              Gas fee {usd(fee)}. {usd(net)} reaches the market.
            </span>
          ) : side === 'buy' ? (
            <span className="gain">No trading fee on Pro.</span>
          ) : (
            <span>Selling {usd(amount)} of {symbol.trim().toUpperCase() || 'your position'}.</span>
          )}
          {overCash && <span className="loss">That is more than your {usd(cash)} in cash.</span>}
        </div>
        <button
          type="button"
          className={side === 'sell' ? 'primary is-sell' : 'primary'}
          onClick={submit}
          disabled={!ready}
        >
          {isPending ? 'Placing…' : side === 'buy' ? 'Buy' : 'Sell'}
        </button>
      </div>
    </div>
  )
}
