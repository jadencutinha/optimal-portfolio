import { useEffect, useRef } from 'react'

// Pure CSS dot layers (no canvas, no WebGL) — this is ambient chrome behind
// every page, so it has to be nearly free to run. Parallax is a single
// scroll-linked CSS variable, updated at most once per animation frame.
export function Starfield() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY * 0.06, 48)
        el.style.setProperty('--star-offset', `${offset}px`)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="starfield" ref={ref} aria-hidden="true">
      <div className="starfield__layer starfield__layer--far" />
      <div className="starfield__layer starfield__layer--near" />
    </div>
  )
}
