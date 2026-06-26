import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { FrontierResponse, PortfolioMetrics } from '../api/types'

interface Props {
  frontier: FrontierResponse
  portfolio?: PortfolioMetrics
  selectedIndex: number | null
  onSelect: (index: number) => void
}

interface Datum {
  index: number
  x: number
  y: number
}

export function FrontierChart({ frontier, portfolio, selectedIndex, onSelect }: Props) {
  const data: Datum[] = frontier.points.map((point, index) => ({
    index,
    x: Number((point.volatility * 100).toFixed(2)),
    y: Number((point.expected_return * 100).toFixed(2)),
  }))

  const minVariance = [data[frontier.min_variance_index]]
  const tangency = [data[frontier.tangency_index]]
  const selected = selectedIndex !== null ? [data[selectedIndex]] : []
  const yours = portfolio
    ? [{ x: Number((portfolio.volatility * 100).toFixed(2)), y: Number((portfolio.expected_return * 100).toFixed(2)) }]
    : []

  return (
    <div className="frontier-chart">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 4 }}>
          <CartesianGrid stroke="#a8d5aa" strokeOpacity={0.4} />
          <XAxis
            type="number"
            dataKey="x"
            name="Volatility"
            unit="%"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -14, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Return"
            unit="%"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <ZAxis range={[55, 55]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => `${value.toFixed(2)}%`} />
          <Scatter
            data={data}
            fill="#2e7d32"
            line={{ stroke: '#2e7d32', strokeWidth: 1.5 }}
            onClick={(_, index) => onSelect(index)}
          />
          <Scatter data={minVariance} fill="#1b5e20" shape="diamond" />
          <Scatter data={tangency} fill="#f59e0b" shape="star" />
          {yours.length > 0 && <Scatter data={yours} fill="#c0392b" shape="cross" />}
          {selected.length > 0 && <Scatter data={selected} fill="#1b5e20" shape="circle" />}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="legend">
        <span>
          <i className="dot mv" /> Min variance
        </span>
        <span>
          <i className="dot tan" /> Max Sharpe
        </span>
        <span>
          <i className="dot opt" /> Your portfolio
        </span>
        <span className="muted">Click a point to inspect its weights</span>
      </div>
    </div>
  )
}
