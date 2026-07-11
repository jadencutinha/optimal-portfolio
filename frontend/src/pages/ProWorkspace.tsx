import { useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { FeatureHub, type HubFeature } from '../components/FeatureHub'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { useSurface } from '../lib/useSurface'
import { AssistantPage } from './AssistantPage'
import { BacktestPage } from './BacktestPage'
import { InvestPlatform } from './InvestPlatform'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { SideBySidePage } from './SideBySidePage'
import { StressPage } from './StressPage'

type Feature =
  | 'optimizer'
  | 'assistant'
  | 'planner'
  | 'sidebyside'
  | 'backtest'
  | 'stress'
  | 'behavioral'
  | 'saved'

const PRO_FEATURES: HubFeature[] = [
  {
    id: 'optimizer',
    name: 'Optimizer',
    kicker: 'Build',
    description:
      'Construct a mathematically optimal portfolio from your tickers, with objectives, constraints, and the efficient frontier.',
  },
  {
    id: 'assistant',
    name: 'AI Assistant',
    kicker: 'Ask',
    description:
      'Describe your goal in plain English and the assistant picks the strategy, runs it, and explains the result.',
  },
  {
    id: 'planner',
    name: 'Goal Planner',
    kicker: 'Project',
    description: 'Run thousands of Monte Carlo simulations to see your odds of reaching a savings goal.',
  },
  {
    id: 'sidebyside',
    name: 'Side by Side',
    kicker: 'Compare',
    description: 'Optimize several portfolios at once and compare their risk, return, and holdings side by side.',
  },
  {
    id: 'backtest',
    name: 'Backtest',
    kicker: 'Replay',
    description: 'Walk your strategy through history against the index, equal weight, and a 60/40 benchmark.',
  },
  {
    id: 'stress',
    name: 'Stress Test',
    kicker: 'Shock',
    description: 'See how your portfolio would have held up in 2008, the COVID crash, and the 2022 rate shock.',
  },
  {
    id: 'behavioral',
    name: 'Behavioral Coach',
    kicker: 'Reflect',
    description: 'Spot the behavior gap and the biases quietly costing you returns.',
  },
  {
    id: 'saved',
    name: 'My Portfolios',
    kicker: 'Library',
    description: 'Reopen your saved portfolios and export detailed PDF reports.',
  },
]

export function ProWorkspace({ onSwitch }: { onSwitch: () => void }) {
  const [feature, setFeature] = useState<Feature>('optimizer')
  const [mode, setMode] = useState<'analyze' | 'invest'>('analyze')
  const [showHub, setShowHub] = useState(true)

  useSurface('platform', 'pro')

  return (
    <div className="pro-workspace">
      <PlatformHeader onSwitch={onSwitch} />
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
          title="Your Pro toolkit"
          subtitle="Use the arrows to browse your tools. Hover a card to see what it does, then open it."
          features={PRO_FEATURES}
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
          {feature === 'assistant' && <AssistantPage />}
          {feature === 'planner' && <PlannerPage />}
          {feature === 'sidebyside' && <SideBySidePage />}
          {feature === 'backtest' && <BacktestPage />}
          {feature === 'stress' && <StressPage />}
          {feature === 'behavioral' && <BehavioralCoach />}
          {feature === 'saved' && <SavedPortfolios />}
        </>
      )}
    </div>
  )
}
