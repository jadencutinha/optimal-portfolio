import type { CSSProperties } from 'react'

interface LoaderProps {
  label?: string
  fullscreen?: boolean
}

export function Loader({ label = 'Loading…', fullscreen = true }: LoaderProps) {
  return (
    <div
      className={fullscreen ? 'app-loader' : 'app-loader app-loader--inline'}
      role="status"
      aria-live="polite"
    >
      <div className="pl">
        <div className="pl__dots" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="pl__dot" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <div className="pl__text">{label}</div>
      </div>
    </div>
  )
}
