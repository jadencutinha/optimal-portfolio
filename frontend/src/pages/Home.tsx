import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
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
import { EditProfilePage } from './EditProfilePage'
import { GamePage } from './GamePage'
import { FreePage } from './FreePage'
import { HomeDashboard } from './HomeDashboard'
import { Landing } from './Landing'
import { ProWorkspace } from './ProWorkspace'

const RISK_PROFILE_KEY = 'risk_profile'
const WARP_MS = 1100
const WARP_EASE = [0.65, 0, 0.35, 1] as const

export function Home() {
  const { session } = useAuth()
  const me = useMe()
  const setPlan = useSetPlan()
  const { view, overlay, setView, openOverlay, closeOverlay, goHome } = useView()

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

  if (overlay === 'checkout') {
    return <CheckoutPage onDone={goHome} onCancel={closeOverlay} />
  }

  const onboarded = Boolean((session.user.user_metadata ?? {}).onboarded)
  if (!onboarded && !planSelected) {
    return <EditProfilePage mode="onboarding" onDone={() => setView('home')} />
  }

  if (!planSelected || overlay === 'manage-plan') {
    return (
      <PlanSelection
        current={planSelected ? plan : undefined}
        pending={setPlan.isPending}
        onCancel={planSelected ? closeOverlay : undefined}
        onUpgradeToPro={() => openOverlay('checkout')}
        onChoose={async (choice) => {
          await setPlan.mutateAsync(choice)
          goHome()
        }}
      />
    )
  }

  if (plan === 'free' && overlay === 'risk') {
    return (
      <RiskQuestionnaire
        onComplete={(profile) => {
          localStorage.setItem(RISK_PROFILE_KEY, profile)
          closeOverlay()
        }}
      />
    )
  }

  const warp = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return
    document.documentElement.style.setProperty('--warp', '1')
    window.setTimeout(() => {
      document.documentElement.style.setProperty('--warp', '0')
    }, WARP_MS + 150)
  }

  const enterCourse = () => {
    warp()
    setView('learn')
  }

  const leaveCourse = () => {
    warp()
    goHome()
  }

  return (
    <MotionConfig reducedMotion="user">
      <MissionControlHUD plan={plan} />

      <div style={{ position: 'relative' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.5, ease: WARP_EASE } }}
              exit={{
                opacity: 0,
                scale: 0.88,
                position: 'absolute',
                inset: 0,
                width: '100%',
                transition: { duration: 0.5, ease: WARP_EASE },
              }}
            >
              <HomeDashboard
                plan={plan}
                onAnalyze={() => setView('analyze')}
                onInvest={() => setView('invest')}
                onLearn={enterCourse}
                onAbout={() => setView('about')}
                onManagePlan={() => openOverlay('manage-plan')}
                onUpgrade={() => openOverlay('checkout')}
                onCompete={() => setView('game')}
              />
            </motion.div>
          )}

          {view === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.55, ease: WARP_EASE } }}
              exit={{
                opacity: 0,
                scale: 0.92,
                position: 'absolute',
                inset: 0,
                width: '100%',
                transition: { duration: 0.4, ease: WARP_EASE },
              }}
            >
              <CoursePage onSwitch={leaveCourse} learnerName={me.data.email} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {view === 'about' && <AboutPage onBack={goHome} />}

      {view === 'profile' && <EditProfilePage mode="edit" onDone={goHome} onCancel={goHome} />}

      {view === 'game' && <GamePage onExit={goHome} />}

      {(view === 'analyze' || view === 'invest') &&
        (plan === 'pro' ? (
          <ProWorkspace onSwitch={goHome} initialMode={view === 'invest' ? 'invest' : 'analyze'} />
        ) : (
          <FreePage
            onOpenRiskQ={() => openOverlay('risk')}
            onUpgrade={() => openOverlay('checkout')}
            onSwitch={goHome}
            initialMode={view === 'invest' ? 'invest' : 'analyze'}
          />
        ))}
    </MotionConfig>
  )
}
