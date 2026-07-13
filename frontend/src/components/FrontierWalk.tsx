import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { FrontierResponse, PortfolioMetrics } from '../api/types'

const W = 760
const H = 400
const PAD = { left: 62, right: 26, top: 22, bottom: 44 }

const pct = (value: number) => `${(value * 100).toFixed(1)}%`
const pct2 = (value: number) => `${(value * 100).toFixed(2)}%`

interface Walker {
  volatility: number
  expected_return: number
  sharpe_ratio: number
  weights: Record<string, number>
}

interface Props {
  frontier: FrontierResponse
  portfolio: PortfolioMetrics
  onAdopt: (index: number) => void
}

export function FrontierWalk({ frontier, portfolio, onAdopt }: Props) {
  const points = frontier.points
  const svgRef = useRef<SVGSVGElement>(null)
  const [t, setT] = useState(() => {
    const tangency = frontier.tangency_index
    return points.length > 1 ? tangency / (points.length - 1) : 0
  })
  const [dragging, setDragging] = useState(false)

  // A stable ticker order, so bars never jump around as you drag.
  const tickers = useMemo(() => {
    const peak = new Map<string, number>()
    points.forEach((point) => {
      point.weights.forEach((allocation) => {
        peak.set(allocation.ticker, Math.max(peak.get(allocation.ticker) ?? 0, allocation.weight))
      })
    })
    return [...peak.entries()].sort((a, b) => b[1] - a[1]).map(([ticker]) => ticker)
  }, [points])

  const scale = useMemo(() => {
    const vols = points.map((point) => point.volatility)
    const rets = points.map((point) => point.expected_return)
    const minV = Math.min(...vols, portfolio.volatility)
    const maxV = Math.max(...vols, portfolio.volatility)
    const minR = Math.min(...rets, portfolio.expected_return)
    const maxR = Math.max(...rets, portfolio.expected_return)
    const padV = Math.max((maxV - minV) * 0.12, 0.004)
    const padR = Math.max((maxR - minR) * 0.12, 0.004)
    const v0 = minV - padV
    const v1 = maxV + padV
    const r0 = minR - padR
    const r1 = maxR + padR
    return {
      x: (v: number) => PAD.left + ((v - v0) / (v1 - v0)) * (W - PAD.left - PAD.right),
      y: (r: number) => H - PAD.bottom - ((r - r0) / (r1 - r0)) * (H - PAD.top - PAD.bottom),
      v0,
      v1,
      r0,
      r1,
    }
  }, [points, portfolio])

  // The frontier is only 25 points, so interpolate between them for a smooth walk.
  const walker: Walker = useMemo(() => {
    const span = points.length - 1
    const exact = Math.min(Math.max(t, 0), 1) * span
    const lo = Math.floor(exact)
    const hi = Math.min(lo + 1, span)
    const frac = exact - lo
    const a = points[lo]
    const b = points[hi]
    const mix = (x: number, y: number) => x + (y - x) * frac

    const weights: Record<string, number> = {}
    tickers.forEach((ticker) => {
      const wa = a.weights.find((item) => item.ticker === ticker)?.weight ?? 0
      const wb = b.weights.find((item) => item.ticker === ticker)?.weight ?? 0
      weights[ticker] = mix(wa, wb)
    })

    return {
      volatility: mix(a.volatility, b.volatility),
      expected_return: mix(a.expected_return, b.expected_return),
      sharpe_ratio: mix(a.sharpe_ratio, b.sharpe_ratio),
      weights,
    }
  }, [t, points, tickers])

  const path = useMemo(
    () => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(p.volatility)} ${scale.y(p.expected_return)}`).join(' '),
    [points, scale],
  )

  const area = useMemo(() => {
    const first = points[0]
    const last = points[points.length - 1]
    return `${path} L ${scale.x(last.volatility)} ${H - PAD.bottom} L ${scale.x(first.volatility)} ${H - PAD.bottom} Z`
  }, [path, points, scale])

  // Walk to whatever point on the curve is nearest the pointer.
  const seek = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    const px = ((event.clientX - box.left) / box.width) * W
    const py = ((event.clientY - box.top) / box.height) * H

    let best = 0
    let bestDist = Infinity
    const steps = 400
    for (let i = 0; i <= steps; i += 1) {
      const candidate = i / steps
      const exact = candidate * (points.length - 1)
      const lo = Math.floor(exact)
      const hi = Math.min(lo + 1, points.length - 1)
      const frac = exact - lo
      const v = points[lo].volatility + (points[hi].volatility - points[lo].volatility) * frac
      const r = points[lo].expected_return + (points[hi].expected_return - points[lo].expected_return) * frac
      const dx = scale.x(v) - px
      const dy = scale.y(r) - py
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = candidate
      }
    }
    setT(best)
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 0.05 : 0.01
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      setT((value) => Math.min(value + step, 1))
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      setT((value) => Math.max(value - step, 0))
    }
  }

  const nearestIndex = Math.round(t * (points.length - 1))
  const wx = scale.x(walker.volatility)
  const wy = scale.y(walker.expected_return)

  const marker = (index: number, label: string, kind: string) => {
    const point = points[index]
    if (!point) return null
    return (
      <g key={kind} className={`fwalk__marker is-${kind}`}>
        <circle cx={scale.x(point.volatility)} cy={scale.y(point.expected_return)} r={4.5} />
        <text x={scale.x(point.volatility)} y={scale.y(point.expected_return) - 12} textAnchor="middle">
          {label}
        </text>
      </g>
    )
  }

  return (
    <div className={dragging ? 'fwalk is-dragging' : 'fwalk'}>
      <div className="fwalk__stats">
        <div className="fwalk__stat">
          <span>Expected return</span>
          <strong className="gain">{pct2(walker.expected_return)}</strong>
        </div>
        <div className="fwalk__stat">
          <span>Volatility</span>
          <strong>{pct2(walker.volatility)}</strong>
        </div>
        <div className="fwalk__stat">
          <span>Sharpe</span>
          <strong className="fwalk__sharpe">{walker.sharpe_ratio.toFixed(3)}</strong>
        </div>
        <button type="button" className="primary fwalk__adopt" onClick={() => onAdopt(nearestIndex)}>
          Use this portfolio
        </button>
      </div>

      <svg
        ref={svgRef}
        className="fwalk__chart"
        viewBox={`0 0 ${W} ${H}`}
        role="slider"
        tabIndex={0}
        aria-label="Walk along the efficient frontier"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(t * 100)}
        aria-valuetext={`Expected return ${pct2(walker.expected_return)}, volatility ${pct2(walker.volatility)}`}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          seek(event)
        }}
        onPointerMove={(event) => {
          if (dragging) seek(event)
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId)
          setDragging(false)
        }}
      >
        <defs>
          <linearGradient id="fwalkArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
          <filter id="fwalkGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="fwalk__grid">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = PAD.top + f * (H - PAD.top - PAD.bottom)
            const value = scale.r1 - f * (scale.r1 - scale.r0)
            return (
              <g key={f}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} />
                <text x={PAD.left - 10} y={y + 4} textAnchor="end">
                  {pct(value)}
                </text>
              </g>
            )
          })}
          {[0, 0.5, 1].map((f) => {
            const x = PAD.left + f * (W - PAD.left - PAD.right)
            const value = scale.v0 + f * (scale.v1 - scale.v0)
            return (
              <text key={f} x={x} y={H - PAD.bottom + 20} textAnchor="middle">
                {pct(value)}
              </text>
            )
          })}
        </g>

        <text className="fwalk__axis" x={(W + PAD.left) / 2} y={H - 8} textAnchor="middle">
          Volatility (risk)
        </text>

        <path className="fwalk__area" d={area} fill="url(#fwalkArea)" />
        <path className="fwalk__curve" d={path} filter="url(#fwalkGlow)" />

        {marker(frontier.min_variance_index, 'Min risk', 'minvar')}
        {marker(frontier.tangency_index, 'Max Sharpe', 'tangency')}

        <g className="fwalk__yours">
          <circle cx={scale.x(portfolio.volatility)} cy={scale.y(portfolio.expected_return)} r={5} />
          <text x={scale.x(portfolio.volatility)} y={scale.y(portfolio.expected_return) + 20} textAnchor="middle">
            Yours
          </text>
        </g>

        <g className="fwalk__walker" filter="url(#fwalkGlow)">
          <line x1={wx} y1={wy} x2={wx} y2={H - PAD.bottom} className="fwalk__drop" />
          <line x1={PAD.left} y1={wy} x2={wx} y2={wy} className="fwalk__drop" />
          <circle cx={wx} cy={wy} r={11} className="fwalk__halo" />
          <circle cx={wx} cy={wy} r={6} className="fwalk__core" />
        </g>
      </svg>

      <p className="fwalk__hint">Drag the star along the curve, or use the arrow keys. Every point is optimal.</p>

      <div className="fwalk__weights">
        {tickers.map((ticker) => {
          const weight = walker.weights[ticker] ?? 0
          return (
            <div key={ticker} className={weight < 0.005 ? 'fwalk__bar is-empty' : 'fwalk__bar'}>
              <span className="fwalk__ticker">{ticker}</span>
              <div className="fwalk__track">
                <div className="fwalk__fill" style={{ width: `${weight * 100}%` }} />
              </div>
              <span className="fwalk__pct">{pct(weight)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
