import { Greeting } from './Greeting'

export function PlatformHeader({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="platform-bar">
      <Greeting />
      <button type="button" className="switch-plan" onClick={onSwitch}>
        Switch platform
      </button>
    </div>
  )
}
