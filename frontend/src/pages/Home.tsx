import { useState } from 'react'
import { useMe, useSetPlan } from '../api/queries'
import { useAuth } from '../auth/useAuth'
import { ErrorState } from '../components/ErrorState'
import { Loader } from '../components/Loader'
import { MissionControlHUD } from '../components/MissionControlHUD'
import { PlanSelection } from '../components/PlanSelection'
import { RiskQuestionnaire } from '../components/RiskQuestionnaire'
import { useView } from '../nav/useView'
import { AboutPage } from './AboutPage'
import { CheckoutPage } from './CheckoutPage'
import { CoursePage } from './CoursePage'
import { FreePage } from './FreePage'
import { HomeDashboard } from './HomeDashboard'
import { Landing } from './Landing'
import { ProWorkspace } from './ProWorkspace'

const RISK_PROFILE_KEY = 'risk_profile'

export function Home() {
  const { session } = useAuth()
  const me = useMe()
  const setPlan = useSetPlan()
  const { view, setView } = useView()
  const [managingPlan, setManagingPlan] = useState(false)
  const [showRiskQ, setShowRiskQ] = useState(false)
  const [checkout, setCheckout] = useState(false)

  if (!session) {
    return <Landing />
  }

  if (me.isLoading) {
    return <Loader label="Loading your workspace…" />
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
          setManagingPlan(false)
        }}
        onCancel={() => setCheckout(false)}
      />
    )
  }

  if (!planSelected || managingPlan) {
    return (
      <PlanSelection
        current={planSelected ? plan : undefined}
        pending={setPlan.isPending}
        onCancel={planSelected ? () => setManagingPlan(false) : undefined}
        onUpgradeToPro={() => setCheckout(true)}
        onChoose={async (choice) => {
          await setPlan.mutateAsync(choice)
          setManagingPlan(false)
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

  const goHome = () => setView('home')

  return (
    <>
      <MissionControlHUD plan={plan} />

      {view === 'home' && (
        <HomeDashboard
          plan={plan}
          onAnalyze={() => setView('analyze')}
          onInvest={() => setView('invest')}
          onLearn={() => setView('learn')}
          onAbout={() => setView('about')}
          onManagePlan={() => setManagingPlan(true)}
          onUpgrade={() => setCheckout(true)}
        />
      )}

      {view === 'about' && <AboutPage onBack={goHome} />}

      {view === 'learn' && <CoursePage onSwitch={goHome} learnerName={me.data.email} />}

      {(view === 'analyze' || view === 'invest') &&
        (plan === 'pro' ? (
          <ProWorkspace onSwitch={goHome} initialMode={view === 'invest' ? 'invest' : 'analyze'} />
        ) : (
          <FreePage
            onOpenRiskQ={() => setShowRiskQ(true)}
            onUpgrade={() => setCheckout(true)}
            onSwitch={goHome}
            initialMode={view === 'invest' ? 'invest' : 'analyze'}
          />
        ))}
    </>
  )
}
