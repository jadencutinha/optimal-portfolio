import { useState } from 'react'
import type { UniverseAsset } from '../api/types'

interface Props {
  tickers: string[]
  suggestions: UniverseAsset[]
  onChange: (tickers: string[]) => void
}

export function TickerInput({ tickers, suggestions, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const symbol = raw.trim().toUpperCase()
    if (symbol && !tickers.includes(symbol)) {
      onChange([...tickers, symbol])
    }
    setDraft('')
  }

  const remove = (symbol: string) => onChange(tickers.filter((ticker) => ticker !== symbol))

  const available = suggestions.filter((asset) => !tickers.includes(asset.ticker))

  return (
    <div className="field">
      <label>Tickers</label>
      <div className="chips">
        {tickers.map((ticker) => (
          <span key={ticker} className="chip">
            {ticker}
            <button type="button" onClick={() => remove(ticker)} aria-label={`Remove ${ticker}`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="ticker-entry">
        <input
          value={draft}
          placeholder="Add a ticker, e.g. AAPL"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add(draft)
            }
          }}
        />
        <button type="button" onClick={() => add(draft)}>
          Add
        </button>
      </div>
      {available.length > 0 && (
        <div className="suggestions">
          {available.slice(0, 12).map((asset) => (
            <button
              key={asset.ticker}
              type="button"
              className="suggestion"
              title={`${asset.name} · ${asset.sector}`}
              onClick={() => add(asset.ticker)}
            >
              {asset.ticker}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
