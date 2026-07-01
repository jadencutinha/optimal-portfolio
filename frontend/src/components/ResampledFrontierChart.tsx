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
import type { ResampledFrontierResponse } from '../api/types'

const SAMPLE_COLOR = '#4991c4'
const RESAMPLED_COLOR = '#e09743'

const toPoints = (points: ResampledFrontierResponse['sample']) =>
  points.map((point) => ({
    x: Number((point.volatility * 100).toFixed(2)),
    y: Number((point.expected_return * 100).toFixed(2)),
  }))

export function ResampledFrontierChart({ data }: { data: ResampledFrontierResponse }) {
  const sample = toPoints(data.sample)
  const resampled = toPoints(data.resampled)

  return (
    <div className="frontier-chart">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
          <XAxis
            type="number"
            dataKey="x"
            unit="%"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -14, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            unit="%"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1', 'dataMax + 1']}
            label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <ZAxis range={[45, 45]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number) => `${value.toFixed(2)}%`} />
          <Scatter data={sample} fill={SAMPLE_COLOR} line={{ stroke: SAMPLE_COLOR, strokeWidth: 1.5 }} />
          <Scatter data={resampled} fill={RESAMPLED_COLOR} line={{ stroke: RESAMPLED_COLOR, strokeWidth: 2 }} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="legend">
        <span>
          <i className="dot" style={{ background: SAMPLE_COLOR }} /> Classic frontier
        </span>
        <span>
          <i className="dot" style={{ background: RESAMPLED_COLOR }} /> Resampled (Michaud)
        </span>
        <span className="muted">{data.resamples} resamples · more stable, less overfit</span>
      </div>
    </div>
  )
}
