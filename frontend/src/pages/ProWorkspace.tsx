import { useEffect, useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { Tour } from '../components/Tour'
import { PRO_TOUR } from '../lib/tours'
import { AssistantPage } from './AssistantPage'
import { BacktestPage } from './BacktestPage'
import { InvestPlatform } from './InvestPlatform'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { SideBySidePage } from './SideBySidePage'
import { StressPage } from './StressPage'

const TOUR_KEY = 'tour_pro_seen'

type Tab =
  | 'optimizer'
  | 'assistant'
  | 'planner'
  | 'sidebyside'
  | 'backtest'
  | 'stress'
  | 'behavioral'
  | 'saved'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'planner', label: 'Planner' },
  { id: 'sidebyside', label: 'Side by Side' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'stress', label: 'Stress Test' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'saved', label: 'My Portfolios' },
]

export function ProWorkspace({ onSwitch }: { onSwitch: () => void }) {
  const [tab, setTab] = useState<Tab>('optimizer')
  const [mode, setMode] = useState<'analyze' | 'invest'>('analyze')
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
      ) : (
        <>
          <div className="workspace-tools">
            <button type="button" className="tour-launch" onClick={() => setTour(true)}>
              Take a tour
            </button>
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
          {tab === 'assistant' && <AssistantPage />}
          {tab === 'planner' && <PlannerPage />}
          {tab === 'sidebyside' && <SideBySidePage />}
          {tab === 'backtest' && <BacktestPage />}
          {tab === 'stress' && <StressPage />}
          {tab === 'behavioral' && <BehavioralCoach />}
          {tab === 'saved' && <SavedPortfolios />}
        </>
      )}
      {tour && <Tour steps={PRO_TOUR} onClose={closeTour} />}
    </div>
  )
}
