import { useEffect, useState } from 'react'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { Tour } from '../components/Tour'
import { FREE_TOUR } from '../lib/tours'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'

const RISK_PROFILE_KEY = 'risk_profile'
const TOUR_KEY = 'tour_free_seen'

type Tab = 'optimizer' | 'planner' | 'saved'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'planner', label: 'Planner' },
  { id: 'saved', label: 'My Portfolios' },
]

interface Props {
  onOpenRiskQ: () => void
  onUpgrade: () => void
  onSwitch: () => void
}

export function FreePage({ onOpenRiskQ, onUpgrade, onSwitch }: Props) {
  const savedProfile = localStorage.getItem(RISK_PROFILE_KEY)
  const [tab, setTab] = useState<Tab>('optimizer')
  const [tour, setTour] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const timer = window.setTimeout(() => setTour(true), 600)
      return () => window.clearTimeout(timer)
    }
  }, [])

  const closeTour = () => {
    setTour(false)
    localStorage.setItem(TOUR_KEY, '1')
  }

  return (
    <div className="free-platform">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="free-header">
        <div>
          <h1>Free platform</h1>
          <p className="lead">
            Core optimization, goal planning, and saved portfolios — free. Upgrade to Pro for the full toolkit.
          </p>
        </div>
        <div className="free-header-actions">
          <button type="button" className="primary upgrade-btn" data-tour="upgrade" onClick={onUpgrade}>
            Upgrade to Pro
          </button>
          <button type="button" className="tour-launch" onClick={() => setTour(true)}>
            Take a tour
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            data-tour={option.id}
            className={tab === option.id ? 'tab active' : 'tab'}
            onClick={() => setTab(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === 'optimizer' && <OptimizerPage />}
      {tab === 'planner' && <PlannerPage />}
      {tab === 'saved' && <SavedPortfolios />}

      <div className="landing-grid free-extras">
        <section>
          <h3>Your plan includes</h3>
          <ul>
            <li>Up to 8 tickers, Max-Sharpe &amp; Min-Variance</li>
            <li>Efficient frontier &amp; the “Why this portfolio?” explainer</li>
            <li>Monte Carlo goal planner</li>
            <li>Save up to 3 portfolios with PDF export</li>
          </ul>
        </section>
        <section>
          <h3>Locked — upgrade to Pro</h3>
          <ul>
            <li>AI natural-language assistant</li>
            <li>Backtesting, strategy comparison &amp; historical stress tests</li>
            <li>Factor analysis, rebalance tracking &amp; alerts</li>
            <li>Shrinkage/EWMA/factor models, advanced objectives &amp; unlimited saves</li>
          </ul>
        </section>
      </div>

      <div className="risk-profile-bar">
        {savedProfile ? (
          <div className="risk-profile-saved">
            <span className="muted">Your risk profile:</span>
            <span className="risk-profile-badge">{savedProfile}</span>
            <button type="button" className="retake-btn" onClick={onOpenRiskQ}>
              Retake assessment
            </button>
          </div>
        ) : (
          <button type="button" className="primary risk-q-btn" onClick={onOpenRiskQ}>
            Take risk assessment
          </button>
        )}
      </div>

      {tour && <Tour steps={FREE_TOUR} onClose={closeTour} />}
    </div>
  )
}
