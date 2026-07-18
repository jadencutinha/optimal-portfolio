import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GameResponse } from '../api/types'
import { GAME_COLORS } from '../lib/series'
import { Confetti } from './Confetti'

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function GameArena({ result, actions }: { result: GameResponse; actions?: ReactNode }) {
  const [phase, setPhase] = useState<'racing' | 'done'>('racing')
  const [monthIndex, setMonthIndex] = useState(0)

  useEffect(() => {
    setPhase('racing')
    setMonthIndex(0)
    const months = result.months
    const stepMs = Math.max(18, 4200 / months)
    let month = 0
    const id = window.setInterval(() => {
      month += 1
      setMonthIndex(month)
      if (month >= months) {
        window.clearInterval(id)
        setPhase('done')
      }
    }, stepMs)
    return () => window.clearInterval(id)
  }, [result])

  const shownMonth = phase === 'done' ? result.months : monthIndex

  const chartData = useMemo(
    () =>
      Array.from({ length: shownMonth + 1 }, (_, month) => {
        const row: Record<string, number> = { month }
        result.players.forEach((player, i) => {
          row[`p${i}`] = player.path[month]?.value ?? player.start_value
        })
        return row
      }),
    [result, shownMonth],
  )

  const standings = useMemo(
    () =>
      result.players
        .map((player, index) => ({
          player,
          index,
          current: player.path[Math.min(shownMonth, result.months)]?.value ?? player.start_value,
        }))
        .sort((a, b) => b.current - a.current),
    [result, shownMonth],
  )

  const winner = result.players[result.winner_index]

  return (
    <div className="game-arena">
      <div className="game-chart">
        <div className="game-chart__timer">
          Year {(shownMonth / 12).toFixed(1)} of {result.years}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, result.months]}
              tickFormatter={(month) => `${Math.round(Number(month) / 12)}y`}
              stroke="#8a8f98"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
              stroke="#8a8f98"
              tick={{ fontSize: 11 }}
              width={52}
            />
            <Tooltip
              formatter={(value: number) => usd(Number(value))}
              labelFormatter={(month) => `Year ${(Number(month) / 12).toFixed(1)}`}
              contentStyle={{
                background: 'rgba(12,12,16,0.94)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 10,
                color: '#f4f1ea',
              }}
            />
            {result.players.map((player, i) => (
              <Line
                key={player.name + i}
                dataKey={`p${i}`}
                name={player.name}
                stroke={GAME_COLORS[i % GAME_COLORS.length]}
                dot={false}
                strokeWidth={2.4}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ol className="game-board">
        {standings.map((entry, rank) => (
          <li
            key={entry.index}
            className={rank === 0 ? 'is-lead' : ''}
            style={{ '--pc': GAME_COLORS[entry.index % GAME_COLORS.length] } as CSSProperties}
          >
            <span className="game-board__rank">{rank + 1}</span>
            <span className="game-board__dot" aria-hidden="true" />
            <span className="game-board__name">{entry.player.name}</span>
            <span className="game-board__val">{usd(entry.current)}</span>
          </li>
        ))}
      </ol>

      {phase === 'done' && (
        <>
          <Confetti />
          <div className="game-winner">
            <span className="game-winner__crown" aria-hidden="true">
              🏆
            </span>
            <h3>{winner.name} wins!</h3>
            <p>
              Typically ends at {usd(winner.median_final)} from {usd(result.start_value)} ·{' '}
              {(winner.cagr * 100).toFixed(1)}% a year · won {(winner.win_probability * 100).toFixed(0)}% of{' '}
              {result.meta?.simulations ?? ''} runs
              {winner.best_ticker ? ` · top pick ${winner.best_ticker}` : ''}
            </p>

            {result.awards.length > 0 && (
              <div className="game-awards">
                {result.awards.map((award) => (
                  <div key={award.category} className="game-award">
                    <span className="game-award__label">{award.label}</span>
                    <span
                      className="game-award__winner"
                      style={{ color: GAME_COLORS[award.player_index % GAME_COLORS.length] }}
                    >
                      {result.players[award.player_index]?.name}
                    </span>
                    <span className="game-award__detail">{award.detail}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="game-breakdown">
              <div className="game-breakdown__row game-breakdown__head">
                <span>Player</span>
                <span>Win odds</span>
                <span>Typical</span>
                <span>Range (10–90%)</span>
                <span>Volatility</span>
                <span>Grew</span>
              </div>
              {result.players.map((player, i) => (
                <div key={player.name + i} className="game-breakdown__row">
                  <span style={{ color: GAME_COLORS[i % GAME_COLORS.length], fontWeight: 700 }}>{player.name}</span>
                  <span>{(player.win_probability * 100).toFixed(0)}%</span>
                  <span>{usd(player.median_final)}</span>
                  <span>
                    {usd(player.p10_final)} – {usd(player.p90_final)}
                  </span>
                  <span>{(player.volatility * 100).toFixed(0)}%</span>
                  <span>{(player.resilience * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {actions && <div className="game-winner__actions">{actions}</div>}

            {result.meta && (
              <div className="game-proof">
                <span className="game-proof__badge">
                  {result.meta.data_source === 'real' ? '● Real market data' : '● Synthetic fallback'} ·{' '}
                  {result.meta.simulations} simulations
                </span>
                <p>{result.meta.method}</p>
                <p>{result.meta.source}</p>
                <p>{result.meta.credibility}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
