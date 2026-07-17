import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  depth: number
  hue: number
  phase: number
  tw: number
}

interface Shooter {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
}

const STAR_COUNT = 170

// A full-viewport canvas star field for the course pages. Stars drift with
// scroll and lean toward the cursor for parallax depth, twinkle softly, and a
// shooting star crosses now and then. All motion is disabled for users who
// prefer reduced motion, where it paints a single static frame instead.
export function GalaxyBackdrop({ variant = 'landing' }: { variant?: 'landing' | 'track' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const wrap = (v: number, m: number) => ((v % m) + m) % m
    const tint = (hue: number) =>
      hue < 0.62 ? '255,255,255' : hue < 0.85 ? '255,224,150' : '150,196,236'

    let W = window.innerWidth
    let H = window.innerHeight
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const depth = rand(0.15, 1)
      return {
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + depth * 1.4,
        depth,
        hue: Math.random(),
        phase: rand(0, Math.PI * 2),
        tw: rand(0.6, 1.8),
      }
    })

    let shooters: Shooter[] = []
    let nextShoot = rand(2.5, 6)

    let scrollY = window.scrollY || 0
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        scrollY = window.scrollY || 0
        ticking = false
      })
    }

    let mx = 0
    let my = 0
    let tmx = 0
    let tmy = 0
    const onMove = (e: PointerEvent) => {
      tmx = (e.clientX / W) * 2 - 1
      tmy = (e.clientY / H) * 2 - 1
    }

    const drawStar = (s: Star, time: number) => {
      const px = wrap(s.x * W + mx * s.depth * 18, W)
      const py = wrap(s.y * H - scrollY * s.depth * 0.12 + my * s.depth * 18, H)
      const twinkle = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(time * s.tw + s.phase)
      const alpha = (0.28 + 0.55 * twinkle) * (0.45 + s.depth * 0.55)
      const rgb = tint(s.hue)
      if (s.depth > 0.8) {
        ctx.beginPath()
        ctx.arc(px, py, s.r * 2.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb},${alpha * 0.12})`
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(px, py, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb},${alpha})`
      ctx.fill()
    }

    const drawShooter = (sh: Shooter) => {
      const fade = Math.sin(Math.PI * (sh.life / sh.max))
      const tailX = sh.x - sh.vx * 0.14
      const tailY = sh.y - sh.vy * 0.14
      const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY)
      grad.addColorStop(0, `rgba(255,240,205,${0.9 * fade})`)
      grad.addColorStop(1, 'rgba(255,240,205,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sh.x, sh.y)
      ctx.lineTo(tailX, tailY)
      ctx.stroke()
    }

    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) {
        last = now
        return
      }
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const time = now / 1000

      mx += (tmx - mx) * 0.05
      my += (tmy - my) * 0.05

      ctx.clearRect(0, 0, W, H)
      for (const s of stars) drawStar(s, time)

      nextShoot -= dt
      if (nextShoot <= 0 && shooters.length < 2) {
        nextShoot = rand(4, 9)
        const fromLeft = Math.random() > 0.5
        const speed = rand(540, 780)
        shooters.push({
          x: fromLeft ? rand(0, W * 0.35) : rand(W * 0.65, W),
          y: rand(0, H * 0.5),
          vx: (fromLeft ? 1 : -1) * speed,
          vy: rand(0.3, 0.6) * speed,
          life: 0,
          max: rand(0.7, 1.2),
        })
      }
      shooters = shooters.filter((sh) => sh.life < sh.max)
      for (const sh of shooters) {
        sh.life += dt
        sh.x += sh.vx * dt
        sh.y += sh.vy * dt
        drawShooter(sh)
      }
    }

    window.addEventListener('resize', resize)
    if (reduced) {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) drawStar(s, 0)
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
    }
  }, [variant])

  return (
    <div className={`galaxy-backdrop galaxy-backdrop--${variant}`} aria-hidden="true">
      <canvas ref={canvasRef} className="galaxy-backdrop__stars" />
    </div>
  )
}
