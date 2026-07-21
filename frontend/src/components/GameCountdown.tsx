import { useEffect, useState } from 'react'

export function GameCountdown({ seconds }: { seconds: number }) {
  const [display, setDisplay] = useState(seconds)

  // Resync to the authoritative server value, but only correct real drift so the
  // local ticker below carries the smooth per-second count without flickering.
  useEffect(() => {
    setDisplay((prev) => (Math.abs(prev - seconds) > 1 ? seconds : prev))
  }, [seconds])

  useEffect(() => {
    const id = window.setInterval(() => {
      setDisplay((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const urgent = display <= 5

  return (
    <div
      className={urgent ? 'game-countdown-timer is-urgent' : 'game-countdown-timer'}
      role="timer"
      aria-live="assertive"
    >
      <span className="game-countdown-timer__label">Race starts in</span>
      <span className="game-countdown-timer__num">{display}</span>
      <span className="game-countdown-timer__unit">{display === 1 ? 'second' : 'seconds'}</span>
    </div>
  )
}
