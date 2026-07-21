import { useEffect, useRef, useState } from 'react'
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
  initialIndex?: number
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
  initialIndex = 0,
}: FeatureHubProps) {
  const [center, setCenter] = useState(
    initialIndex >= 0 && initialIndex < features.length ? initialIndex : 0,
  )
  const [dragPx, setDragPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const selectRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const activeRef = useRef(false)
  const movedRef = useRef(false)
  const dragPxRef = useRef(0)
  const pressedIndexRef = useRef<number | null>(null)

  const clamp = (i: number) => Math.max(0, Math.min(features.length - 1, i))
  const go = (delta: number) => setCenter((c) => clamp(c + delta))

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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

        <div className="fhub__select" ref={selectRef}>
          <button
            type="button"
            className={`fhub__select-trigger${menuOpen ? ' is-open' : ''}`}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="fhub__select-current">
              <span className="fhub__select-kicker">{features[center]?.kicker}</span>
              <span className="fhub__select-name">{features[center]?.name}</span>
            </span>
            <svg className="fhub__select-chevron" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <ul className="fhub__select-menu" role="listbox" aria-label="Select a tool">
              {features.map((feature, i) => (
                <li key={feature.id} role="option" aria-selected={i === center}>
                  <button
                    type="button"
                    className={`fhub__select-option${i === center ? ' is-current' : ''}${
                      feature.locked ? ' is-locked' : ''
                    }`}
                    onClick={() => {
                      setCenter(i)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="fhub__select-option-name">{feature.name}</span>
                    {feature.locked && <span className="fhub__select-badge">{lockedLabel}</span>}
                    {i === center && (
                      <svg className="fhub__select-check" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
                opacity: offset < 0 ? 0.16 : Math.max(0.18, 1 - Math.max(0, offset - 2) * 0.34),
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
