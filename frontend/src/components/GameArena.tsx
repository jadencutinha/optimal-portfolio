import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GamePlayerResult, GameResponse } from '../api/types'
import { GAME_COLORS, metallicAt } from '../lib/series'
import { Confetti } from './Confetti'

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function winnerReason(result: GameResponse): string {
  const winner = result.players[result.winner_index]
  const runnerUp = result.players
    .filter((_, i) => i !== result.winner_index)
    .sort((a, b) => b.median_final - a.median_final)[0]
  const picks = winner.resolved_tickers.length ? winner.resolved_tickers : winner.tickers
  const winPct = Math.round(winner.win_probability * 100)
  const cagr = (winner.cagr * 100).toFixed(1)
  const vol = Math.round(winner.volatility * 100)

  const sentences: string[] = []
  sentences.push(
    `${winner.name}'s even split across ${picks.join(', ')} typically compounds to ${usd(
      winner.median_final,
    )}, about ${cagr}% a year.`,
  )
  sentences.push(
    `That took first place in ${winPct}% of the ${result.meta?.simulations ?? ''} simulated runs${
      runnerUp ? `, ahead of ${runnerUp.name}'s ${usd(runnerUp.median_final)}` : ''
    }.`,
  )
  if (winner.best_ticker) {
    sentences.push(
      `Its strongest holding, ${winner.best_ticker}, did most of the heavy lifting, while spreading across ${picks.length} names held volatility near ${vol}% a year.`,
    )
  } else {
    sentences.push(
      `Spreading across ${picks.length} names held volatility near ${vol}% a year while still leading on the upside.`,
    )
  }
  return sentences.join(' ')
}

type Phase = 'countdown' | 'lineup' | 'racing' | 'done'

function Portfolio({
  player,
  color,
  highlight,
  featured,
}: {
  player: GamePlayerResult
  color: string
  highlight?: boolean
  featured?: boolean
}) {
  const resolved = player.resolved_tickers
  const weight = resolved.length ? 100 / resolved.length : 0
  const segTickers = resolved.length ? resolved : player.tickers

  return (
    <div
      className={['game-portfolio', highlight ? 'is-winner' : '', featured ? 'is-featured' : '']
        .filter(Boolean)
        .join(' ')}
      style={{ '--pc': color } as CSSProperties}
    >
      <div className="game-portfolio__head">
        <span className="game-portfolio__dot" aria-hidden="true" />
        <span className="game-portfolio__name">{player.name}</span>
        {highlight && (
          <span className="game-portfolio__crown" aria-hidden="true">
            🏆
          </span>
        )}
      </div>

      <div className="game-alloc-bar">
        {segTickers.map((ticker, i) => (
          <span
            key={ticker}
            className="game-alloc-seg"
            style={{
              flexGrow: 1,
              background: resolved.length ? metallicAt(i) : 'rgba(255,255,255,0.12)',
            }}
            title={resolved.length ? `${ticker} · ${weight.toFixed(0)}%` : ticker}
          />
        ))}
      </div>

      <ul className="game-alloc-legend">
        {player.tickers.map((ticker) => {
          const on = resolved.includes(ticker)
          const idx = segTickers.indexOf(ticker)
          return (
            <li key={ticker} className={on ? undefined : 'is-off'}>
              <span
                className="game-alloc-dot"
                style={{ background: on ? metallicAt(idx) : 'rgba(255,255,255,0.16)' }}
                aria-hidden="true"
              />
              <span className="game-alloc-ticker">{ticker}</span>
              <span className="game-alloc-pct">{on ? `${weight.toFixed(0)}%` : 'no data'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function GameArena({ result, actions }: { result: GameResponse; actions?: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('countdown')
  const [count, setCount] = useState(3)
  const [monthIndex, setMonthIndex] = useState(0)

  useEffect(() => {
    setPhase('countdown')
    setCount(3)
    setMonthIndex(0)
    const timers: number[] = []
    timers.push(window.setTimeout(() => setCount(2), 750))
    timers.push(window.setTimeout(() => setCount(1), 1500))
    timers.push(window.setTimeout(() => setPhase('lineup'), 2250))
    timers.push(window.setTimeout(() => setPhase('racing'), 5250))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [result])

  useEffect(() => {
    if (phase !== 'racing') return
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
  }, [phase, result])

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

  if (phase === 'countdown') {
    return (
      <div className="game-arena">
        <div className="game-countdown">
          <span className="game-countdown__label">Get ready</span>
          <span key={count} className="game-countdown__num">
            {count}
          </span>
        </div>
      </div>
    )
  }

  if (phase === 'lineup') {
    return (
      <div className="game-arena">
        <div className="game-lineup">
          <div className="game-lineup__head">
            <span className="game-eyebrow">On the starting line</span>
            <h3>Who picked what</h3>
            <p>Each portfolio is split evenly across its picks. The race starts in a moment.</p>
          </div>
          <div className="game-portfolios">
            {result.players.map((player, i) => (
              <Portfolio
                key={player.name + i}
                player={player}
                color={GAME_COLORS[i % GAME_COLORS.length]}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
            <span className="game-winner__eyebrow">Champion</span>
            <h3>{winner.name} wins!</h3>
            <p className="game-winner__why">{winnerReason(result)}</p>

            <div className="game-winner__alloc">
              <Portfolio
                player={winner}
                color={GAME_COLORS[result.winner_index % GAME_COLORS.length]}
                highlight
                featured
              />
            </div>

            {result.players.length > 1 && (
              <div className="game-portfolios game-portfolios--result">
                <div className="game-portfolios__head">The other portfolios</div>
                <div className="game-portfolios__grid">
                  {result.players.map((player, i) =>
                    i === result.winner_index ? null : (
                      <Portfolio
                        key={player.name + i}
                        player={player}
                        color={GAME_COLORS[i % GAME_COLORS.length]}
                      />
                    ),
                  )}
                </div>
              </div>
            )}

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
