import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCreateRoom,
  useGameSimulate,
  useRoom,
  useSetReady,
  useSetRoomPicks,
  useStartRoom,
  useUniverse,
} from '../api/queries'
import type { GameResponse } from '../api/types'
import { GameArena } from '../components/GameArena'
import { GameCountdown } from '../components/GameCountdown'
import { TickerInput } from '../components/TickerInput'
import { extractApiError } from '../lib/errors'
import { GAME_COLORS } from '../lib/series'
import { useSurface } from '../lib/useSurface'
import { useToast } from '../toast/useToast'

const YEARS_OPTIONS = [5, 10, 15, 20]

interface Player {
  id: string
  name: string
  tickers: string[]
}

let counter = 0
const makePlayer = (index: number, tickers: string[]): Player => {
  counter += 1
  return { id: `player-${counter}`, name: `Player ${index}`, tickers }
}

export function GamePage({ onExit }: { onExit: () => void }) {
  useSurface('platform')
  const universe = useUniverse()
  const toast = useToast()
  const queryClient = useQueryClient()
  const suggestions = universe.data?.assets ?? []

  const [mode, setMode] = useState<'local' | 'online'>('local')
  const [years, setYears] = useState(10)

  // Local (hotseat)
  const [players, setPlayers] = useState<Player[]>(() => [
    makePlayer(1, ['AAPL', 'MSFT', 'NVDA']),
    makePlayer(2, ['AMZN', 'GOOGL', 'TSLA']),
  ])
  const simulate = useGameSimulate()
  const [localResult, setLocalResult] = useState<GameResponse | null>(null)

  // Online (room code)
  const [hostName, setHostName] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const [hostTickers, setHostTickers] = useState<string[]>(['AAPL', 'MSFT', 'NVDA'])
  const createRoom = useCreateRoom()
  const savePicks = useSetRoomPicks()
  const setReady = useSetReady()
  const startRoom = useStartRoom()
  const room = useRoom(mode === 'online' ? code : null)

  const setPlayer = (id: string, patch: Partial<Player>) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const canStartLocal = players.every((p) => p.name.trim() && p.tickers.length >= 1) && !simulate.isPending

  const runLocal = () => {
    setLocalResult(null)
    simulate.mutate(
      {
        years,
        seed: Math.floor(Math.random() * 1_000_000_000),
        players: players.map((p) => ({ name: p.name.trim() || 'Player', tickers: p.tickers })),
      },
      {
        onSuccess: (data) => setLocalResult(data),
        onError: (error) => toast(extractApiError(error, 'Could not run the simulation.'), 'error'),
      },
    )
  }

  const onCreateRoom = () => {
    createRoom.mutate(
      { host_name: hostName.trim() || 'Host', years },
      {
        onSuccess: (data) => {
          setCode(data.code)
          setHostId(data.player_id)
          queryClient.setQueryData(['room', data.code], data.room)
          savePicks.mutate({ code: data.code, player_id: data.player_id, tickers: hostTickers })
        },
        onError: (error) => toast(extractApiError(error, 'Could not create the game.'), 'error'),
      },
    )
  }

  const saveHostPicks = (next: string[]) => {
    setHostTickers(next)
    if (code && hostId) savePicks.mutate({ code, player_id: hostId, tickers: next })
  }

  const copyLink = () => {
    if (!code) return
    const link = `${window.location.origin}/play/${code}`
    navigator.clipboard?.writeText(link).then(
      () => toast('Invite link copied.', 'success'),
      () => toast(link, 'success'),
    )
  }

  const roomState = room.data
  const showingLocalResult = mode === 'local' && localResult
  const showingOnlineResult = mode === 'online' && roomState?.status === 'done' && roomState.result
  const me = roomState?.players.find((p) => p.id === hostId)
  const countdown = roomState?.status === 'countdown' ? roomState.seconds_remaining ?? 0 : null

  const startedRef = useRef(false)
  useEffect(() => {
    if (roomState?.status !== 'countdown') {
      startedRef.current = false
      return
    }
    if (
      !startedRef.current &&
      code &&
      hostId &&
      roomState.seconds_remaining != null &&
      roomState.seconds_remaining <= 0
    ) {
      startedRef.current = true
      startRoom.mutate(
        { code, player_id: hostId },
        {
          onSuccess: (data) => queryClient.setQueryData(['room', code], data),
          onError: (error) => {
            startedRef.current = false
            toast(extractApiError(error, 'Could not start the game.'), 'error')
          },
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.status, roomState?.seconds_remaining, code, hostId])

  const toggleReady = () => {
    if (!code || !hostId) return
    setReady.mutate(
      { code, player_id: hostId, ready: !me?.ready },
      { onSuccess: (data) => queryClient.setQueryData(['room', code], data) },
    )
  }

  return (
    <div className="game-page">
      <header className="game-head">
        <button type="button" className="switch-plan game-home" onClick={onExit}>
          <svg className="switch-plan__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 11.2 12 4l8 7.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 10.4V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1v-8.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Home</span>
        </button>
        <div className="game-head__text">
          <span className="game-eyebrow">Stock Showdown</span>
          <h2>Compete with friends</h2>
          <p>
            Each player drafts a few stocks. We simulate {years} years forward from real market history, then crown a
            champion.
          </p>
        </div>
      </header>

      {showingLocalResult && (
        <GameArena
          result={localResult}
          actions={
            <>
              <button type="button" className="game-start" onClick={runLocal}>
                ↻ Rematch
              </button>
              <button type="button" className="game-add" onClick={() => setLocalResult(null)}>
                New game
              </button>
            </>
          }
        />
      )}

      {showingOnlineResult && roomState?.result && (
        <GameArena
          result={roomState.result}
          actions={
            <button
              type="button"
              className="game-add"
              onClick={() => {
                setCode(null)
                setHostId(null)
              }}
            >
              New game
            </button>
          }
        />
      )}

      {!showingLocalResult && !showingOnlineResult && (
        <>
          <div className="game-modes">
            <button
              type="button"
              className={mode === 'local' ? 'is-active' : ''}
              onClick={() => setMode('local')}
            >
              On this device
            </button>
            <button
              type="button"
              className={mode === 'online' ? 'is-active' : ''}
              onClick={() => setMode('online')}
            >
              Online with friends
            </button>
          </div>

          {(mode === 'local' || !code) && (
            <label className="game-years">
              <span>Simulate</span>
              <select value={years} onChange={(event) => setYears(Number(event.target.value))}>
                {YEARS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} years
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === 'local' && (
            <div className="game-setup">
              <div className="game-players">
                {players.map((player, i) => (
                  <div key={player.id} className="game-player" style={{ '--pc': GAME_COLORS[i] } as CSSProperties}>
                    <div className="game-player__head">
                      <span className="game-player__dot" aria-hidden="true" />
                      <input
                        className="game-player__name"
                        value={player.name}
                        maxLength={40}
                        onChange={(event) => setPlayer(player.id, { name: event.target.value })}
                      />
                      {players.length > 2 && (
                        <button
                          type="button"
                          className="game-player__remove"
                          onClick={() => setPlayers((prev) => prev.filter((p) => p.id !== player.id))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="game-player__hint">Pick 3 to 5 stocks</p>
                    <TickerInput
                      tickers={player.tickers}
                      suggestions={suggestions}
                      onChange={(tickers) => setPlayer(player.id, { tickers })}
                    />
                  </div>
                ))}
              </div>
              <div className="game-setup__actions">
                {players.length < 4 && (
                  <button
                    type="button"
                    className="game-add"
                    onClick={() => setPlayers((prev) => [...prev, makePlayer(prev.length + 1, [])])}
                  >
                    + Add player
                  </button>
                )}
                <button type="button" className="game-start" disabled={!canStartLocal} onClick={runLocal}>
                  {simulate.isPending ? 'Simulating…' : '▶ Start the race'}
                </button>
              </div>
            </div>
          )}

          {mode === 'online' && !code && (
            <div className="game-setup">
              <div className="game-player" style={{ '--pc': GAME_COLORS[0] } as CSSProperties}>
                <div className="game-player__head">
                  <span className="game-player__dot" aria-hidden="true" />
                  <input
                    className="game-player__name"
                    value={hostName}
                    maxLength={40}
                    placeholder="Your name (host)"
                    onChange={(event) => setHostName(event.target.value)}
                  />
                </div>
                <p className="game-player__hint">Your picks (you can change them in the lobby)</p>
                <TickerInput tickers={hostTickers} suggestions={suggestions} onChange={setHostTickers} />
              </div>
              <div className="game-setup__actions">
                <button
                  type="button"
                  className="game-start"
                  disabled={createRoom.isPending}
                  onClick={onCreateRoom}
                >
                  {createRoom.isPending ? 'Creating…' : '＋ Create game'}
                </button>
              </div>
              <p className="game-note">
                You get a short code and link. Friends open it on their phones, type a name, and pick their stocks. No
                sign up needed.
              </p>
            </div>
          )}

          {mode === 'online' && code && (
            <div className="game-lobby">
              <div className="game-lobby__code">
                <span className="game-lobby__label">Game code</span>
                <strong>{code}</strong>
                <button type="button" className="game-add" onClick={copyLink}>
                  Copy invite link
                </button>
              </div>
              <p className="game-lobby__link">{`${window.location.origin}/play/${code}`}</p>

              <div className="game-player" style={{ '--pc': GAME_COLORS[0] } as CSSProperties}>
                <div className="game-player__head">
                  <span className="game-player__dot" aria-hidden="true" />
                  <span className="game-player__name game-player__name--static">
                    {hostName.trim() || 'Host'} (you)
                  </span>
                </div>
                <p className="game-player__hint">Your picks</p>
                <TickerInput tickers={hostTickers} suggestions={suggestions} onChange={saveHostPicks} />
                <button
                  type="button"
                  className={me?.ready ? 'game-ready is-ready' : 'game-ready'}
                  disabled={hostTickers.length < 1}
                  onClick={toggleReady}
                >
                  {me?.ready ? '✓ Ready — tap to undo' : "I'm ready"}
                </button>
              </div>

              <ol className="game-board">
                {roomState?.players.map((player, i) => (
                  <li key={player.id} style={{ '--pc': GAME_COLORS[i % GAME_COLORS.length] } as CSSProperties}>
                    <span className={player.ready ? 'join-dot is-ready' : 'join-dot'} aria-hidden="true" />
                    <span className="game-board__name">
                      {player.name}
                      {player.is_host ? ' (host)' : ''}
                    </span>
                    <span className="game-board__val">
                      {player.ready ? '✓ Ready' : player.pick_count > 0 ? `${player.pick_count} picks` : 'choosing…'}
                    </span>
                  </li>
                ))}
              </ol>

              {countdown !== null ? (
                <GameCountdown seconds={countdown} />
              ) : (
                <p className="game-note">
                  Everyone locks their picks and hits ready, then a 20 second countdown starts the race
                  automatically.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
