import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

export interface TourStep {
  selector: string
  title: string
  body: string
}

const TIP_WIDTH = 300

export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]

  useLayoutEffect(() => {
    let cancelled = false
    const target = document.querySelector(step.selector) as HTMLElement | null
    if (!target) {
      setRect(null)
      return
    }
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const measure = () => {
      if (!cancelled) setRect(target.getBoundingClientRect())
    }
    measure()
    const timer = window.setTimeout(measure, 300)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step.selector])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isLast = index === steps.length - 1
  const next = () => (isLast ? onClose() : setIndex(index + 1))

  const tipStyle: CSSProperties = { width: TIP_WIDTH }
  if (rect) {
    const placeBelow = rect.bottom + 180 < window.innerHeight
    tipStyle.left = Math.min(Math.max(rect.left, 12), window.innerWidth - TIP_WIDTH - 12)
    if (placeBelow) tipStyle.top = rect.bottom + 14
    else tipStyle.bottom = window.innerHeight - rect.top + 14
  } else {
    tipStyle.left = '50%'
    tipStyle.top = '50%'
    tipStyle.transform = 'translate(-50%, -50%)'
  }

  return createPortal(
    <div className="tour" role="dialog" aria-modal="true">
      <div className={`tour-backdrop ${rect ? '' : 'solid'}`.trim()} />
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <div className="tour-tip" style={tipStyle}>
        <div className="tour-tip-step">
          Step {index + 1} of {steps.length}
        </div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-tip-actions">
          <button type="button" className="tour-skip" onClick={onClose}>
            Skip all
          </button>
          <button type="button" className="primary tour-next" onClick={next}>
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
