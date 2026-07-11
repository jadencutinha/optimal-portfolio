import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

interface GlareCardProps {
  children: ReactNode
  className?: string
}

export function GlareCard({ children, className }: GlareCardProps) {
  const isPointerInside = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const state = useRef({
    glare: { x: 50, y: 50 },
    background: { x: 50, y: 50 },
    rotate: { x: 0, y: 0 },
  })

  const containerStyle = {
    '--m-x': '50%',
    '--m-y': '50%',
    '--r-x': '0deg',
    '--r-y': '0deg',
    '--bg-x': '50%',
    '--bg-y': '50%',
    '--duration': '300ms',
    '--foil-size': '100%',
    '--opacity': '0',
    '--radius': '22px',
    '--easing': 'ease',
  } as CSSProperties

  const update = () => {
    const el = ref.current
    if (!el) return
    const { background, rotate, glare } = state.current
    el.style.setProperty('--m-x', `${glare.x}%`)
    el.style.setProperty('--m-y', `${glare.y}%`)
    el.style.setProperty('--r-x', `${rotate.x}deg`)
    el.style.setProperty('--r-y', `${rotate.y}deg`)
    el.style.setProperty('--bg-x', `${background.x}%`)
    el.style.setProperty('--bg-y', `${background.y}%`)
  }

  return (
    <div
      ref={ref}
      style={containerStyle}
      className="glare-card"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const px = (100 / rect.width) * (event.clientX - rect.left)
        const py = (100 / rect.height) * (event.clientY - rect.top)
        const dx = px - 50
        const dy = py - 50
        const { background, rotate, glare } = state.current
        background.x = 50 + px / 4 - 12.5
        background.y = 50 + py / 3 - 16.67
        rotate.x = -(dx / 3.5) * 0.4
        rotate.y = (dy / 2) * 0.4
        glare.x = px
        glare.y = py
        update()
      }}
      onPointerEnter={() => {
        isPointerInside.current = true
        const el = ref.current
        if (!el) return
        setTimeout(() => {
          if (isPointerInside.current) el.style.setProperty('--duration', '0s')
        }, 300)
      }}
      onPointerLeave={() => {
        isPointerInside.current = false
        const el = ref.current
        if (!el) return
        el.style.removeProperty('--duration')
        el.style.setProperty('--r-x', '0deg')
        el.style.setProperty('--r-y', '0deg')
      }}
    >
      <div className="glare-card__rotator">
        <div className="glare-card__bg" aria-hidden="true" />
        <div className="glare-card__glare" aria-hidden="true" />
        <div className="glare-card__foil" aria-hidden="true" />
        <div className={className ? `glare-card__content ${className}` : 'glare-card__content'}>{children}</div>
      </div>
    </div>
  )
}
