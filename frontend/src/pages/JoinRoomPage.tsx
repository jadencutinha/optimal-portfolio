import { useState } from 'react'
import type { ReactNode } from 'react'
import { useJoinRoom, useRoom, useSetReady, useSetRoomPicks, useUniverse } from '../api/queries'
import { GameArena } from '../components/GameArena'
import { GameCountdown } from '../components/GameCountdown'
import { TickerInput } from '../components/TickerInput'
import { extractApiError } from '../lib/errors'
import { useSurface } from '../lib/useSurface'
import { useToast } from '../toast/useToast'

export function JoinRoomPage({ code }: { code: string }) {
  useSurface('platform')
  const room = useRoom(code)
  const join = useJoinRoom()
  const savePicks = useSetRoomPicks()
  const setReady = useSetReady()
  const universe = useUniverse()
  const toast = useToast()

  const [name, setName] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [tickers, setTickers] = useState<string[]>([])

  const suggestions = universe.data?.assets ?? []
  const state = room.data
  const me = state?.players.find((player) => player.id === playerId)

  const toggleReady = () => {
    if (!playerId) return
    setReady.mutate(
      { code, player_id: playerId, ready: !me?.ready },
      { onSuccess: () => room.refetch(), onError: (error) => toast(extractApiError(error, 'Could not ready up.'), 'error') },
    )
  }

  const onJoin = () => {
    if (!name.trim()) return
    join.mutate(
      { code, name: name.trim() },
      {
        onSuccess: (data) => {
          setPlayerId(data.player_id)
          room.refetch()
        },
        onError: (error) => toast(extractApiError(error, 'Could not join. Check the code.'), 'error'),
      },
    )
  }

  const updateTickers = (next: string[]) => {
    setTickers(next)
    if (playerId) savePicks.mutate({ code, player_id: playerId, tickers: next })
  }

  const shell = (children: ReactNode) => (
    <div className="join-page">
      <div className="join-brand">
        <span className="game-eyebrow">Stock Showdown</span>
        <h2>Join game {code}</h2>
      </div>
      {children}
    </div>
  )

  if (room.isError || (!room.isLoading && !state)) {
    return shell(<p className="game-note">That game code was not found. Ask the host for the current code.</p>)
  }

  if (!state) {
    return shell(<p className="game-note">Loading game…</p>)
  }

  if (state.status === 'done' && state.result) {
    return shell(<GameArena result={state.result} />)
  }

  if (!playerId) {
    return shell(
      <div className="join-card">
        <label className="profile-input">
          <span>Your name</span>
          <input
            type="text"
            value={name}
            autoFocus
            maxLength={40}
            placeholder="e.g. Sam"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onJoin()}
          />
        </label>
        <button type="button" className="game-start" disabled={!name.trim() || join.isPending} onClick={onJoin}>
          {join.isPending ? 'Joining…' : 'Join the game'}
        </button>
        <p className="game-note">
          {state.players.length} player{state.players.length === 1 ? '' : 's'} in the lobby. No account needed.
        </p>
      </div>,
    )
  }

  const seconds = state.status === 'countdown' ? state.seconds_remaining ?? 0 : null
  const readyCount = state.players.filter((player) => player.ready).length

  return shell(
    <div className="join-card">
      {seconds !== null && seconds > 0 && <GameCountdown seconds={seconds} />}
      {(state.status === 'running' || (seconds === 0 && readyCount >= 2)) && (
        <div className="game-starting">
          <span className="join-spinner" aria-hidden="true" />
          Starting the race…
        </div>
      )}
      {seconds === 0 && readyCount < 2 && (
        <div className="game-starting">
          <span className="join-spinner" aria-hidden="true" />
          Waiting for at least two players to ready up…
        </div>
      )}
      <p className="join-hello">You are in. Pick 3 to 5 stocks, then hit ready.</p>
      <TickerInput tickers={tickers} suggestions={suggestions} onChange={updateTickers} />

      <button
        type="button"
        className={me?.ready ? 'game-ready is-ready' : 'game-ready'}
        disabled={tickers.length < 1}
        onClick={toggleReady}
      >
        {me?.ready ? '✓ Ready — tap to undo' : "I'm ready"}
      </button>

      <ul className="join-players">
        {state.players.map((player) => (
          <li key={player.id}>
            <span className={player.ready ? 'join-dot is-ready' : 'join-dot'} aria-hidden="true" />
            {player.name}
            {player.is_host ? ' (host)' : ''}
            <span className="join-players__status">
              {player.ready ? 'Ready' : player.pick_count > 0 ? `${player.pick_count} picks` : 'choosing…'}
            </span>
          </li>
        ))}
      </ul>
    </div>,
  )
}
