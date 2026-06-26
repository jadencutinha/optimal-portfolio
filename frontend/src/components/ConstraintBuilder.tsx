import { useState } from 'react'
import type { AssetBound, SectorCap, UniverseAsset } from '../api/types'

interface Props {
  tickers: string[]
  universe: UniverseAsset[]
  sectorCaps: SectorCap[]
  assetBounds: AssetBound[]
  onSectorCaps: (value: SectorCap[]) => void
  onAssetBounds: (value: AssetBound[]) => void
}

export function ConstraintBuilder(props: Props) {
  const sectorByTicker = new Map(props.universe.map((asset) => [asset.ticker, asset.sector]))
  const sectors = Array.from(
    new Set(props.tickers.map((ticker) => sectorByTicker.get(ticker)).filter((value): value is string => Boolean(value))),
  ).sort()

  const [sector, setSector] = useState('')
  const [sectorPct, setSectorPct] = useState(40)
  const [ticker, setTicker] = useState('')
  const [tickerPct, setTickerPct] = useState(25)

  const addSectorCap = () => {
    const chosen = sector || sectors[0]
    if (!chosen) return
    const next = props.sectorCaps.filter((cap) => cap.sector !== chosen)
    props.onSectorCaps([...next, { sector: chosen, max_weight: sectorPct / 100 }])
  }

  const addAssetBound = () => {
    const chosen = ticker || props.tickers[0]
    if (!chosen) return
    const next = props.assetBounds.filter((bound) => bound.ticker !== chosen)
    props.onAssetBounds([...next, { ticker: chosen, max_weight: tickerPct / 100 }])
  }

  return (
    <div className="constraints">
      <h3>Constraints</h3>

      <div className="constraint-row">
        <select value={sector || sectors[0] || ''} onChange={(event) => setSector(event.target.value)}>
          {sectors.length === 0 && <option value="">No sectors</option>}
          {sectors.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={100}
          value={sectorPct}
          onChange={(event) => setSectorPct(Number(event.target.value))}
        />
        <span className="suffix">% max</span>
        <button type="button" onClick={addSectorCap} disabled={sectors.length === 0}>
          Add sector cap
        </button>
      </div>

      {props.sectorCaps.length > 0 && (
        <div className="chips">
          {props.sectorCaps.map((cap) => (
            <span key={cap.sector} className="chip">
              {cap.sector} ≤ {Math.round((cap.max_weight ?? 0) * 100)}%
              <button
                type="button"
                aria-label={`Remove ${cap.sector} cap`}
                onClick={() => props.onSectorCaps(props.sectorCaps.filter((item) => item.sector !== cap.sector))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="constraint-row">
        <select value={ticker || props.tickers[0] || ''} onChange={(event) => setTicker(event.target.value)}>
          {props.tickers.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={100}
          value={tickerPct}
          onChange={(event) => setTickerPct(Number(event.target.value))}
        />
        <span className="suffix">% max</span>
        <button type="button" onClick={addAssetBound} disabled={props.tickers.length === 0}>
          Add asset bound
        </button>
      </div>

      {props.assetBounds.length > 0 && (
        <div className="chips">
          {props.assetBounds.map((bound) => (
            <span key={bound.ticker} className="chip">
              {bound.ticker} ≤ {Math.round((bound.max_weight ?? 0) * 100)}%
              <button
                type="button"
                aria-label={`Remove ${bound.ticker} bound`}
                onClick={() => props.onAssetBounds(props.assetBounds.filter((item) => item.ticker !== bound.ticker))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
