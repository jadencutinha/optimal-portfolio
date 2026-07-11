import { useState } from 'react'
import { FeatureHub, type HubFeature } from '../components/FeatureHub'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { useSurface } from '../lib/useSurface'
import { InvestPlatform } from './InvestPlatform'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { SideBySidePage } from './SideBySidePage'

const RISK_PROFILE_KEY = 'risk_profile'

type Feature = 'optimizer' | 'planner' | 'sidebyside' | 'saved'

const FREE_FEATURES: HubFeature[] = [
  {
    id: 'optimizer',
    name: 'Optimizer',
    kicker: 'Build',
    description:
      'Construct an optimized portfolio from up to 8 tickers with Max-Sharpe or Min-Variance, and see the efficient frontier.',
  },
  {
    id: 'planner',
    name: 'Goal Planner',
    kicker: 'Project',
    description: 'Project your wealth with Monte Carlo simulations and see your odds of hitting a savings goal.',
  },
  {
    id: 'sidebyside',
    name: 'Side by Side',
    kicker: 'Compare',
    description: 'Optimize a few portfolios at once and compare their risk, return, and holdings.',
  },
  {
    id: 'saved',
    name: 'My Portfolios',
    kicker: 'Library',
    description: 'Save up to 3 portfolios, reopen them, and export a PDF report.',
  },
]

interface Props {
  onOpenRiskQ: () => void
  onUpgrade: () => void
  onSwitch: () => void
}

export function FreePage({ onOpenRiskQ, onUpgrade, onSwitch }: Props) {
  const savedProfile = localStorage.getItem(RISK_PROFILE_KEY)
  const [feature, setFeature] = useState<Feature>('optimizer')
  const [mode, setMode] = useState<'analyze' | 'invest'>('analyze')
  const [showHub, setShowHub] = useState(true)

  useSurface('platform')

  return (
    <div className="free-platform">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="free-header">
        <div>
          <h1>Free platform</h1>
          <p className="lead">
            Core optimization, goal planning, and saved portfolios, all free. Upgrade to Pro for the full toolkit.
          </p>
        </div>
        <div className="free-header-actions">
          <button type="button" className="primary upgrade-btn" onClick={onUpgrade}>
            Upgrade to Pro
          </button>
          <button type="button" className="tour-launch" onClick={onOpenRiskQ}>
            {savedProfile ? `Risk profile · ${savedProfile}` : 'Take risk assessment'}
          </button>
        </div>
      </div>

      <div className="platform-mode">
        <button
          type="button"
          className={mode === 'analyze' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => setMode('analyze')}
        >
          Analyze
        </button>
        <button
          type="button"
          className={mode === 'invest' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => setMode('invest')}
        >
          Invest
        </button>
      </div>

      {mode === 'invest' ? (
        <InvestPlatform />
      ) : showHub ? (
        <FeatureHub
          title="Your free toolkit"
          subtitle="Use the arrows to browse your tools. Hover a card to see what it does, then open it."
          features={FREE_FEATURES}
          onSelect={(id) => {
            setFeature(id as Feature)
            setShowHub(false)
          }}
        />
      ) : (
        <>
          <div className="workspace-tools">
            <button type="button" className="tour-launch" onClick={() => setShowHub(true)}>
              ← All features
            </button>
          </div>
          {feature === 'optimizer' && <OptimizerPage />}
          {feature === 'planner' && <PlannerPage />}
          {feature === 'sidebyside' && <SideBySidePage />}
          {feature === 'saved' && <SavedPortfolios />}
        </>
      )}
    </div>
  )
}
