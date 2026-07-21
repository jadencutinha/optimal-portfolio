import { useState } from 'react'
import { FeatureHub, type HubFeature } from '../components/FeatureHub'
import { MarketStrip } from '../components/MarketStrip'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { useSurface } from '../lib/useSurface'
import { InvestPlatform } from './InvestPlatform'
import { OptimizerPage } from './OptimizerPage'
import { SideBySidePage } from './SideBySidePage'

const RISK_PROFILE_KEY = 'risk_profile'

type Feature = 'optimizer' | 'sidebyside' | 'saved'

const FREE_FEATURES: HubFeature[] = [
  {
    id: 'optimizer',
    name: 'Optimizer',
    kicker: 'Build',
    description:
      'Construct an optimized portfolio from up to 8 tickers with Max-Sharpe or Min-Variance, and see the efficient frontier.',
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

// Shown locked on Free so the Pro tools are visible rather than hidden.
const LOCKED_FEATURES: HubFeature[] = [
  {
    id: 'assistant',
    name: 'AI Assistant',
    kicker: 'Ask',
    description:
      'Describe your goal in plain English and the assistant picks the strategy, runs it, and explains the result.',
    locked: true,
  },
  {
    id: 'backtest',
    name: 'Backtest',
    kicker: 'Replay',
    description: 'Walk your strategy through history against the index, equal weight, and a 60/40 benchmark.',
    locked: true,
  },
  {
    id: 'behavioral',
    name: 'Behavioral Coach',
    kicker: 'Reflect',
    description: 'Spot the behavior gap and the biases quietly costing you returns.',
    locked: true,
  },
]

interface Props {
  onOpenRiskQ: () => void
  onUpgrade: () => void
  onSwitch: () => void
  initialMode?: 'analyze' | 'invest'
}

export function FreePage({ onOpenRiskQ, onUpgrade, onSwitch, initialMode = 'analyze' }: Props) {
  const savedProfile = localStorage.getItem(RISK_PROFILE_KEY)
  const [feature, setFeature] = useState<Feature>('optimizer')
  const [mode, setMode] = useState<'analyze' | 'invest'>(initialMode)
  const [showHub, setShowHub] = useState(true)

  useSurface('platform', 'free')

  return (
    <div className="free-platform">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="free-header">
        <div>
          <h1>Free platform</h1>
          <p className="lead">
            Core optimization, side-by-side comparison, and saved portfolios, all free. Upgrade to Pro for the full toolkit.
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

      <MarketStrip />

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
          subtitle="Drag the deck, tap a tool to focus it, or use the arrows. Open the centered tool to launch it."
          features={[...FREE_FEATURES, ...LOCKED_FEATURES]}
          initialIndex={[...FREE_FEATURES, ...LOCKED_FEATURES].findIndex((f) => f.id === feature)}
          onSelect={(id) => {
            setFeature(id as Feature)
            setShowHub(false)
          }}
          onLockedSelect={onUpgrade}
        />
      ) : (
        <>
          <div className="workspace-tools">
            <button type="button" className="tour-launch" onClick={() => setShowHub(true)}>
              <span className="tour-launch__arrow" aria-hidden="true">←</span>
              All features
            </button>
          </div>
          <h1 className="tool-title">{FREE_FEATURES.find((f) => f.id === feature)?.name}</h1>
          {feature === 'optimizer' && <OptimizerPage />}
          {feature === 'sidebyside' && <SideBySidePage />}
          {feature === 'saved' && <SavedPortfolios />}
        </>
      )}
    </div>
  )
}
