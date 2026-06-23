import type { WeightAllocation } from '../api/types'
import { percent } from '../lib/format'

export function WeightsTable({ weights }: { weights: WeightAllocation[] }) {
  const max = Math.max(...weights.map((allocation) => allocation.weight), 0.0001)

  return (
    <table className="weights">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Weight</th>
          <th aria-label="allocation bar" />
        </tr>
      </thead>
      <tbody>
        {weights.map((allocation) => (
          <tr key={allocation.ticker}>
            <td className="mono">{allocation.ticker}</td>
            <td className="mono">{percent(allocation.weight)}</td>
            <td className="bar-cell">
              <span className="bar" style={{ width: `${(allocation.weight / max) * 100}%` }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
