import { useEffect, useState } from 'react'
import { useValidateTickers } from '../api/queries'
import type { UniverseAsset } from '../api/types'

interface Props {
  tickers: string[]
  suggestions: UniverseAsset[]
  onChange: (tickers: string[]) => void
}

export function TickerInput({ tickers, suggestions, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const validate = useValidateTickers()
  const validateMutate = validate.mutate

  useEffect(() => {
    if (tickers.length === 0) {
      setInvalid(new Set())
      return
    }
    const handle = window.setTimeout(() => {
      validateMutate(tickers, {
        onSuccess: (data) => setInvalid(new Set(data.invalid)),
      })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [tickers, validateMutate])

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
          <span
            key={ticker}
            className={`chip ${invalid.has(ticker) ? 'invalid' : ''}`.trim()}
            title={invalid.has(ticker) ? 'No price data found for this ticker' : undefined}
          >
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
      {invalid.size > 0 && (
        <p className="ticker-warning">
          No price data for {Array.from(invalid).join(', ')}. They'll be ignored when you optimize.
        </p>
      )}
    </div>
  )
}
