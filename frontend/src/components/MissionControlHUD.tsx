import { loadStreak, loadXP } from '../lib/courseProgress'
import { useAnimatedNumber } from '../lib/useAnimatedNumber'

type Plan = 'course' | 'free' | 'pro'

const PLAN_LABEL: Record<Plan, string> = {
  course: 'COURSE',
  free: 'FREE',
  pro: 'PRO',
}

export function MissionControlHUD({ plan }: { plan: Plan }) {
  const xp = useAnimatedNumber(loadXP())
  const streak = loadStreak()
  const streakDays = useAnimatedNumber(streak.current)

  return (
    <div className="hud-bar" role="status" aria-label="Mission control telemetry">
      <div className="hud-bar__signal" aria-hidden="true" />
      <div className="hud-bar__group">
        <span className="hud-bar__label">TIER</span>
        <span className="hud-bar__value hud-bar__value--plan">{PLAN_LABEL[plan]}</span>
      </div>
      <div className="hud-bar__sep" aria-hidden="true" />
      <div className="hud-bar__group">
        <span className="hud-bar__label">XP</span>
        <span className="hud-bar__value">{xp.toLocaleString()}</span>
      </div>
      <div className="hud-bar__sep" aria-hidden="true" />
      <div className="hud-bar__group">
        <span className="hud-bar__label">STREAK</span>
        <span className="hud-bar__value">
          {streakDays} {streakDays === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  )
}
