import { useEffect, useMemo, useState } from 'react'
import { useValidateTickers } from '../api/queries'
import type { UniverseAsset } from '../api/types'
import { extractApiError } from '../lib/errors'
import { metallicAt } from '../lib/series'
import { StockDetail } from './StockDetail'

interface Props {
  tickers: string[]
  suggestions: UniverseAsset[]
  onChange: (tickers: string[]) => void
}

export function TickerInput({ tickers, suggestions, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [inspecting, setInspecting] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const validate = useValidateTickers()
  const validateMutate = validate.mutate

  useEffect(() => {
    if (tickers.length === 0) {
      setInvalid(new Set())
      setUnavailable(null)
      return
    }
    const handle = window.setTimeout(() => {
      validateMutate(tickers, {
        onSuccess: (data) => {
          setInvalid(new Set(data.invalid))
          setUnavailable(null)
        },
        onError: (error) => {
          setInvalid(new Set())
          setUnavailable(extractApiError(error, "Couldn't check these tickers right now."))
        },
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

  const toggle = (symbol: string) => {
    if (tickers.includes(symbol)) remove(symbol)
    else onChange([...tickers, symbol])
  }

  const byTicker = useMemo(
    () => new Map(suggestions.map((asset) => [asset.ticker, asset])),
    [suggestions],
  )

  const sectors = useMemo(() => {
    const map = new Map<string, UniverseAsset[]>()
    suggestions.forEach((asset) => {
      const list = map.get(asset.sector) ?? []
      list.push(asset)
      map.set(asset.sector, list)
    })
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Index') return 1
      if (b === 'Index') return -1
      return a.localeCompare(b)
    })
  }, [suggestions])

  const mix = useMemo(() => {
    const counts = new Map<string, number>()
    tickers.forEach((ticker) => {
      const sector = byTicker.get(ticker)?.sector ?? 'Other'
      counts.set(sector, (counts.get(sector) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [tickers, byTicker])

  const heaviest = mix[0]
  const concentrated = tickers.length >= 3 && heaviest && heaviest[1] / tickers.length > 0.6

  const matches = useMemo(() => {
    const pool = suggestions.filter((asset) => !tickers.includes(asset.ticker))
    const query = draft.trim().toLowerCase()
    if (!query) {
      const sortKey = (name: string) => name.replace(/^the\s+/i, '')
      return [...pool].sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))
    }
    return pool
      .filter(
        (asset) => asset.ticker.toLowerCase().startsWith(query) || asset.name.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const aStarts = a.ticker.toLowerCase().startsWith(query) ? 0 : 1
        const bStarts = b.ticker.toLowerCase().startsWith(query) ? 0 : 1
        return aStarts - bStarts || a.name.localeCompare(b.name)
      })
  }, [draft, suggestions, tickers])

  const commit = () => {
    const query = draft.trim()
    if (!query) return
    add(matches.length > 0 ? matches[0].ticker : query)
  }

  return (
    <div className="field">
      <label>Tickers</label>
      <div className="chips">
        {tickers.map((ticker) => {
          const asset = byTicker.get(ticker)
          return (
            <span
              key={ticker}
              className={`chip ${invalid.has(ticker) ? 'invalid' : ''}`.trim()}
              title={
                invalid.has(ticker)
                  ? 'No price data found for this ticker'
                  : asset
                    ? `${asset.name} · ${asset.sector}`
                    : undefined
              }
            >
              <button
                type="button"
                className="chip__inspect"
                onClick={() => setInspecting(ticker)}
                aria-label={`View details for ${ticker}`}
              >
                {ticker}
              </button>
              <button type="button" onClick={() => remove(ticker)} aria-label={`Remove ${ticker}`}>
                ×
              </button>
            </span>
          )
        })}
      </div>

      {mix.length > 0 && (
        <div className={concentrated ? 'ticker-mix is-concentrated' : 'ticker-mix'}>
          <div className="ticker-mix__head">
            <span className="ticker-mix__label">Your mix</span>
            <span className="ticker-mix__summary">
              {mix.length} sector{mix.length === 1 ? '' : 's'} · {tickers.length} holding
              {tickers.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="ticker-mix__bars">
            {mix.map(([sector, count], index) => (
              <span
                key={sector}
                className="ticker-mix__bar"
                style={{ flexGrow: count, background: metallicAt(index) }}
                title={`${sector} · ${count} of ${tickers.length}`}
              />
            ))}
          </div>

          <ul className="ticker-mix__legend">
            {mix.map(([sector, count], index) => (
              <li key={sector}>
                <span
                  className="ticker-mix__dot"
                  style={{ background: metallicAt(index) }}
                  aria-hidden="true"
                />
                {sector}
                <span className="ticker-mix__n">{count}</span>
              </li>
            ))}
          </ul>

          {concentrated && (
            <p className="ticker-mix__warning">
              {Math.round((heaviest[1] / tickers.length) * 100)}% of your picks are {heaviest[0]}.
              Spreading across sectors usually lowers risk for the same return.
            </p>
          )}
        </div>
      )}

      <div className="ticker-entry">
        <div className="ticker-search">
          <input
            value={draft}
            placeholder="Search a company or ticker, e.g. Apple or AAPL"
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commit()
              }
            }}
          />
          {focused && matches.length > 0 && (
            <ul className="ticker-suggest">
              {matches.map((asset) => (
                <li key={asset.ticker}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add(asset.ticker)}
                  >
                    <span className="ticker-suggest__ticker">{asset.ticker}</span>
                    <span className="ticker-suggest__name">{asset.name}</span>
                    <span className="ticker-suggest__sector">{asset.sector}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={commit}>
          Add
        </button>
      </div>

      {sectors.length > 0 && (
        <>
          <button
            type="button"
            className="ticker-browse-toggle"
            aria-expanded={browsing}
            onClick={() => setBrowsing((value) => !value)}
          >
            {browsing ? 'Hide sectors' : 'Browse by sector'}
          </button>

          {browsing && (
            <div className="sector-browser">
              {sectors.map(([sector, assets]) => {
                const picked = assets.filter((asset) => tickers.includes(asset.ticker)).length
                return (
                  <section key={sector} className="sector-group">
                    <header className="sector-group__head">
                      <span className="sector-group__name">{sector}</span>
                      <span className="sector-group__count">
                        {picked > 0 ? `${picked} of ${assets.length} picked` : `${assets.length}`}
                      </span>
                    </header>
                    <div className="sector-group__assets">
                      {assets.map((asset) => {
                        const on = tickers.includes(asset.ticker)
                        return (
                          <div key={asset.ticker} className={on ? 'asset-row is-on' : 'asset-row'}>
                            <button
                              type="button"
                              className="asset-row__pick"
                              aria-pressed={on}
                              onClick={() => toggle(asset.ticker)}
                            >
                              <span className="asset-row__ticker">{asset.ticker}</span>
                              <span className="asset-row__name">{asset.name}</span>
                              <span className="asset-row__mark" aria-hidden="true">
                                {on ? '✓' : '+'}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="asset-row__info"
                              onClick={() => setInspecting(asset.ticker)}
                              aria-label={`View details for ${asset.ticker}`}
                            >
                              ⓘ
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}

      {unavailable && <p className="ticker-warning">{unavailable}</p>}
      {!unavailable && invalid.size > 0 && (
        <p className="ticker-warning">
          No price data for {Array.from(invalid).join(', ')}. They'll be ignored when you optimize.
        </p>
      )}

      {inspecting && (
        <StockDetail
          ticker={inspecting}
          asset={byTicker.get(inspecting)}
          basket={tickers}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  )
}
