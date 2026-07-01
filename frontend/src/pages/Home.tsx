import { useState } from 'react'
import { useMe, useSetPlan } from '../api/queries'
import { useAuth } from '../auth/useAuth'
import { PlanSelection } from '../components/PlanSelection'
import { RiskQuestionnaire } from '../components/RiskQuestionnaire'
import { CheckoutPage } from './CheckoutPage'
import { CoursePage } from './CoursePage'
import { FreePage } from './FreePage'
import { Landing } from './Landing'
import { ProWorkspace } from './ProWorkspace'

const RISK_PROFILE_KEY = 'risk_profile'

export function Home() {
  const { session } = useAuth()
  const me = useMe()
  const setPlan = useSetPlan()
  const [switching, setSwitching] = useState(false)
  const [showRiskQ, setShowRiskQ] = useState(false)
  const [checkout, setCheckout] = useState(false)

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

  if (checkout) {
    return <CheckoutPage onDone={() => setCheckout(false)} onCancel={() => setCheckout(false)} />
  }

  if (!planSelected || switching) {
    return (
      <PlanSelection
        current={planSelected ? plan : undefined}
        pending={setPlan.isPending}
        onCancel={planSelected ? () => setSwitching(false) : undefined}
        onUpgradeToPro={() => setCheckout(true)}
        onChoose={async (choice) => {
          await setPlan.mutateAsync(choice)
          setSwitching(false)
        }}
      />
    )
  }

  if (plan === 'free' && showRiskQ) {
    return (
      <RiskQuestionnaire
        onComplete={(profile) => {
          localStorage.setItem(RISK_PROFILE_KEY, profile)
          setShowRiskQ(false)
        }}
      />
    )
  }

  return (
    <>
      <div className="platform-bar">
        <button type="button" className="switch-plan" onClick={() => setSwitching(true)}>
          Switch platform
        </button>
      </div>
      {plan === 'course' && <CoursePage />}
      {plan === 'free' && <FreePage onOpenRiskQ={() => setShowRiskQ(true)} onUpgrade={() => setCheckout(true)} />}
      {plan === 'pro' && <ProWorkspace />}
    </>
  )
}
