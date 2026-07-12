import { useEffect, useRef, useState } from 'react'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Eases a displayed number toward `target` whenever it changes — for
// telemetry-style HUD readouts that count up/down instead of jumping.
export function useAnimatedNumber(target: number, durationMs = 700): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number>()

  useEffect(() => {
    if (reduceMotion()) {
      setDisplay(target)
      fromRef.current = target
      return
    }

    const from = fromRef.current
    if (from === target) return

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs])

  return display
}
