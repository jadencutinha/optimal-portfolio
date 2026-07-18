import { Wave } from './ui/wave'

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
        <Wave className="pl__wave" aria-hidden="true" />
        <div className="pl__text">{label}</div>
      </div>
    </div>
  )
}
