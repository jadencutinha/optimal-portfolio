import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BacktestResponse, StrategyResult } from '../api/types'
import { downloadCsv } from '../lib/csv'
import { percent, ratio } from '../lib/format'

const COLORS = ['#2e7d32', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899']

const colorFor = (index: number) => COLORS[index % COLORS.length]

type Row = Record<string, number | string>

function merge(strategies: StrategyResult[], value: (s: StrategyResult, i: number) => { date: string; v: number }[]): Row[] {
  const rows = new Map<string, Row>()
  strategies.forEach((strategy, index) => {
    value(strategy, index).forEach((point) => {
      const row = rows.get(point.date) ?? { date: point.date }
      row[strategy.name] = point.v
      rows.set(point.date, row)
    })
  })
  return Array.from(rows.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function SeriesChart({
  data,
  names,
  format,
}: {
  data: Row[]
  names: string[]
  format: (value: number) => string
}) {
  return (
    <div className="bt-chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: string) => String(value).slice(0, 7)}
            minTickGap={56}
          />
          <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={format} />
          <Tooltip formatter={(value: number) => format(value)} labelFormatter={(label) => String(label)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {names.map((name, index) => (
            <Line key={name} type="monotone" dataKey={name} stroke={colorFor(index)} dot={false} strokeWidth={1.8} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BacktestResults({ result }: { result: BacktestResponse }) {
  const { strategies } = result
  const names = strategies.map((strategy) => strategy.name)

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['Strategy', 'CAGR', 'Volatility', 'Sharpe', 'Sortino', 'MaxDD', 'Calmar', 'Turnover', 'Alpha', 'Beta', 'IR'],
    ]
    strategies.forEach((strategy) => {
      const stats = strategy.stats
      const rel = strategy.relative
      rows.push([
        strategy.name,
        stats.cagr,
        stats.annual_volatility,
        stats.sharpe_ratio,
        stats.sortino_ratio,
        stats.max_drawdown,
        stats.calmar_ratio,
        stats.avg_turnover,
        rel ? rel.alpha : '',
        rel ? rel.beta : '',
        rel ? rel.information_ratio : '',
      ])
    })
    downloadCsv('backtest-results.csv', rows)
  }

  const equity = merge(strategies, (s) => s.curve.map((p) => ({ date: p.date, v: p.equity })))
  const drawdown = merge(strategies, (s) => s.curve.map((p) => ({ date: p.date, v: p.drawdown })))
  const rolling = merge(strategies, (s) => s.rolling_sharpe.map((p) => ({ date: p.date, v: p.sharpe })))

  return (
    <div className="backtest-results">
      <p className="provenance">
        {result.provider} data · {result.as_of_start} → {result.as_of_end} · {result.rebalance} rebalancing ·{' '}
        {result.cost_bps} bps cost
      </p>
      <div className="result-actions">
        <button type="button" className="signin-trigger" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <h3>Growth of $1</h3>
      <SeriesChart data={equity} names={names} format={(v) => v.toFixed(2)} />

      <h3>Drawdown</h3>
      <SeriesChart data={drawdown} names={names} format={(v) => percent(v, 0)} />

      <h3>Rolling Sharpe (63-day)</h3>
      <SeriesChart data={rolling} names={names} format={(v) => v.toFixed(2)} />

      <h3>Metrics</h3>
      <div className="bt-table-wrap">
        <table className="weights backtest-metrics">
          <thead>
            <tr>
              <th>Strategy</th>
              <th>CAGR</th>
              <th>Vol</th>
              <th>Sharpe</th>
              <th>Sortino</th>
              <th>Max DD</th>
              <th>Calmar</th>
              <th>Turnover</th>
              <th>Alpha</th>
              <th>Beta</th>
              <th>IR</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, index) => (
              <tr key={strategy.name}>
                <td>
                  <i className="dot" style={{ background: colorFor(index) }} /> {strategy.name}
                </td>
                <td className="mono">{percent(strategy.stats.cagr)}</td>
                <td className="mono">{percent(strategy.stats.annual_volatility)}</td>
                <td className="mono">{ratio(strategy.stats.sharpe_ratio)}</td>
                <td className="mono">{ratio(strategy.stats.sortino_ratio)}</td>
                <td className="mono">{percent(strategy.stats.max_drawdown)}</td>
                <td className="mono">{ratio(strategy.stats.calmar_ratio)}</td>
                <td className="mono">{percent(strategy.stats.avg_turnover)}</td>
                <td className="mono">{strategy.relative ? percent(strategy.relative.alpha) : '—'}</td>
                <td className="mono">{strategy.relative ? ratio(strategy.relative.beta) : '—'}</td>
                <td className="mono">{strategy.relative ? ratio(strategy.relative.information_ratio) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
