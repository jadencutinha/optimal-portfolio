import { Greeting } from './Greeting'

export function PlatformHeader({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="platform-bar">
      <Greeting />
      <button type="button" className="switch-plan" onClick={onSwitch}>
        <svg className="switch-plan__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 11.2 12 4l8 7.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10.4V19a1 1 0 0 0 1 1h3.5v-4.5h3V20H17a1 1 0 0 0 1-1v-8.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Home</span>
      </button>
    </div>
  )
}
