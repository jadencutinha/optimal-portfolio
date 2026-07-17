import { useEffect, useRef } from 'react'

const PALETTE = ['#d4af37', '#f0d98c', '#2fd6a4', '#6fb3dd', '#e8705f', '#ffffff']

export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()

    const parts = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.5,
      w: (5 + Math.random() * 6) * dpr,
      h: (8 + Math.random() * 9) * dpr,
      vx: (-1 + Math.random() * 2) * dpr,
      vy: (2 + Math.random() * 3.5) * dpr,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }))

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const part of parts) {
        part.x += part.vx
        part.y += part.vy
        part.vy += 0.035 * dpr
        part.rot += part.vr
        ctx.save()
        ctx.translate(part.x, part.y)
        ctx.rotate(part.rot)
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 4200)
        ctx.fillStyle = part.color
        ctx.fillRect(-part.w / 2, -part.h / 2, part.w, part.h)
        ctx.restore()
      }
      if (elapsed < 4400) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />
}
