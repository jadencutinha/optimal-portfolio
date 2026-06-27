import { useState } from 'react'
import { useMe, useSetPlan } from '../api/queries'
import { useAuth } from '../auth/useAuth'
import { Greeting } from '../components/Greeting'
import { PlanSelection } from '../components/PlanSelection'
import { CoursePage } from './CoursePage'
import { FreePage } from './FreePage'
import { Landing } from './Landing'
import { OptimizerPage } from './OptimizerPage'

export function Home() {
  const { session } = useAuth()
  const me = useMe()
  const setPlan = useSetPlan()
  const [switching, setSwitching] = useState(false)

  if (!session) {
    return <Landing />
  }

  if (me.isLoading) {
    return <p className="muted">Loading your workspace…</p>
  }

  if (me.isError || !me.data) {
    return (
      <div className="workspace-error">
        <p className="error">We couldn't load your account.</p>
        <button type="button" className="signin-trigger" onClick={() => me.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const { plan, plan_selected: planSelected } = me.data

  if (!planSelected || switching) {
    return (
      <PlanSelection
        current={planSelected ? plan : undefined}
        pending={setPlan.isPending}
        onCancel={planSelected ? () => setSwitching(false) : undefined}
        onChoose={async (choice) => {
          await setPlan.mutateAsync(choice)
          setSwitching(false)
        }}
      />
    )
  }

  return (
    <>
      <div className="platform-bar">
        <Greeting />
        <button type="button" className="switch-plan" onClick={() => setSwitching(true)}>
          Switch platform
        </button>
      </div>
      {plan === 'course' && <CoursePage />}
      {plan === 'free' && <FreePage />}
      {plan === 'pro' && <OptimizerPage />}
    </>
  )
}
