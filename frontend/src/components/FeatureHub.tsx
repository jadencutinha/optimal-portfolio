import { useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

export interface HubFeature {
  id: string
  name: string
  kicker: string
  description: string
  locked?: boolean
}

interface FeatureHubProps {
  title: string
  subtitle?: string
  features: HubFeature[]
  onSelect: (id: string) => void
  onLockedSelect?: (id: string) => void
  lockedLabel?: string
}

const ANCHOR_PX = 44
const STEP_PX = 290
const DRAG_THRESHOLD = 6

export function FeatureHub({
  title,
  subtitle,
  features,
  onSelect,
  onLockedSelect,
  lockedLabel = 'Pro only',
}: FeatureHubProps) {
  const [center, setCenter] = useState(0)
  const [dragPx, setDragPx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const startXRef = useRef(0)
  const activeRef = useRef(false)
  const movedRef = useRef(false)
  const dragPxRef = useRef(0)
  const pressedIndexRef = useRef<number | null>(null)

  const clamp = (i: number) => Math.max(0, Math.min(features.length - 1, i))
  const go = (delta: number) => setCenter((c) => clamp(c + delta))

  const activate = (index: number) => {
    const feature = features[index]
    if (feature.locked) onLockedSelect?.(feature.id)
    else onSelect(feature.id)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    activeRef.current = true
    movedRef.current = false
    startXRef.current = event.clientX
    dragPxRef.current = 0
    const target = event.target as HTMLElement
    const card = target.closest?.('[data-fh-index]')
    pressedIndexRef.current = card ? Number(card.getAttribute('data-fh-index')) : null
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return
    const dx = event.clientX - startXRef.current
    if (!movedRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      movedRef.current = true
      setDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    if (movedRef.current) {
      dragPxRef.current = dx
      setDragPx(dx)
    }
  }

  const releaseCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return
    activeRef.current = false
    const steps = movedRef.current ? Math.round(-dragPxRef.current / STEP_PX) : 0
    if (movedRef.current) {
      setDragging(false)
      setDragPx(0)
      releaseCapture(event)
    }
    dragPxRef.current = 0
    if (steps !== 0) {
      setCenter((c) => clamp(c + steps))
      return
    }
    if (pressedIndexRef.current != null) activate(pressedIndexRef.current)
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return
    activeRef.current = false
    if (movedRef.current) {
      setDragging(false)
      setDragPx(0)
      releaseCapture(event)
    }
    movedRef.current = false
    dragPxRef.current = 0
    pressedIndexRef.current = null
  }

  return (
    <div className="fhub">
      <div className="fhub__head">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>

      <div className="fhub__stage">
        <div
          className="fhub__viewport"
          role="listbox"
          aria-label={title}
          tabIndex={0}
          style={{ touchAction: 'pan-y', cursor: dragging ? 'grabbing' : 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') go(1)
            if (event.key === 'ArrowLeft') go(-1)
          }}
        >
          <div className="fhub__track">
            {features.map((feature, i) => {
              const offset = i - center
              const abs = Math.abs(offset)
              const isCenter = offset === 0
              const rotateY = Math.max(Math.min(-offset * 9, 26), -26)
              const style: CSSProperties = {
                transform: `translateX(${ANCHOR_PX + offset * STEP_PX + dragPx}px) translateY(-50%) translateZ(${-abs * 30}px) rotateY(${rotateY}deg) scale(${isCenter ? 1 : 0.94})`,
                opacity: offset < 0 ? 0.2 : Math.max(0.5, 1 - offset * 0.14),
                zIndex: 100 - abs,
                transition: dragging ? 'none' : undefined,
              }
              const locked = Boolean(feature.locked)
              const className = [
                'fhub__card',
                isCenter ? 'is-center' : '',
                locked ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')

              const label = locked
                ? `${feature.name} is ${lockedLabel}. Upgrade to unlock.`
                : `Open ${feature.name}`

              return (
                <button
                  key={feature.id}
                  type="button"
                  data-fh-index={i}
                  className={className}
                  style={style}
                  aria-selected={isCenter}
                  aria-label={label}
                  onClick={(event) => {
                    if (event.detail !== 0) return
                    activate(i)
                  }}
                >
                  <span className="fhub__glass" aria-hidden="true" />
                  {locked && (
                    <span className="fhub__lock" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" />
                        <path
                          d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      {lockedLabel}
                    </span>
                  )}
                  <span className="fhub__card-body">
                    <span className="fhub__kicker">{feature.kicker}</span>
                    <span className="fhub__name">{feature.name}</span>
                    <p className="fhub__desc">{feature.description}</p>
                    <span className="fhub__cta">{locked ? 'Unlock with Pro →' : 'Open →'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="fhub__arrow fhub__arrow--left"
          onClick={() => go(-1)}
          disabled={center === 0}
          aria-label="Previous feature"
        >
          ‹
        </button>
        <button
          type="button"
          className="fhub__arrow fhub__arrow--right"
          onClick={() => go(1)}
          disabled={center === features.length - 1}
          aria-label="Next feature"
        >
          ›
        </button>
      </div>
    </div>
  )
}
