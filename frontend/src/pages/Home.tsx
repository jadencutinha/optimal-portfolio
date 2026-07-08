import { useState } from 'react'
import { useMe, useSetPlan } from '../api/queries'
import { useAuth } from '../auth/useAuth'
import { ErrorState } from '../components/ErrorState'
import { Skeleton } from '../components/Skeleton'
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
    return (
      <div className="workspace-skeleton">
        <Skeleton width="240px" height="30px" />
        <div className="skeleton-panels">
          <Skeleton height="180px" radius="16px" />
          <Skeleton height="180px" radius="16px" />
        </div>
        <Skeleton height="260px" radius="16px" />
      </div>
    )
  }

  if (me.isError || !me.data) {
    return <ErrorState message="We couldn't load your account." onRetry={() => me.refetch()} />
  }

  const { plan, plan_selected: planSelected } = me.data

  if (checkout) {
    return (
      <CheckoutPage
        onDone={() => {
          setCheckout(false)
          setSwitching(false)
        }}
        onCancel={() => setCheckout(false)}
      />
    )
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

  const onSwitch = () => setSwitching(true)

  return (
    <>
      {plan === 'course' && <CoursePage onSwitch={onSwitch} learnerName={me.data.email} />}
      {plan === 'free' && (
        <FreePage
          onOpenRiskQ={() => setShowRiskQ(true)}
          onUpgrade={() => setCheckout(true)}
          onSwitch={onSwitch}
        />
      )}
      {plan === 'pro' && <ProWorkspace onSwitch={onSwitch} />}
    </>
  )
}
