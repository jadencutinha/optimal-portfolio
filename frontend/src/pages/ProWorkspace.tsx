import { useEffect, useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { PlatformHeader } from '../components/PlatformHeader'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { Tour } from '../components/Tour'
import { PRO_TOUR } from '../lib/tours'
import { AssistantPage } from './AssistantPage'
import { BacktestPage } from './BacktestPage'
import { FactorsPage } from './FactorsPage'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { StressPage } from './StressPage'
import { SweepPage } from './SweepPage'
import { TrackerPage } from './TrackerPage'

const TOUR_KEY = 'tour_pro_seen'

type Tab =
  | 'optimizer'
  | 'assistant'
  | 'planner'
  | 'backtest'
  | 'compare'
  | 'stress'
  | 'factors'
  | 'behavioral'
  | 'tracker'
  | 'saved'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'planner', label: 'Planner' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'compare', label: 'Compare' },
  { id: 'stress', label: 'Stress Test' },
  { id: 'factors', label: 'Factors' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'saved', label: 'My Portfolios' },
]

export function ProWorkspace({ onSwitch }: { onSwitch: () => void }) {
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
    <div className="pro-workspace">
      <PlatformHeader onSwitch={onSwitch} />
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
      {tab === 'backtest' && <BacktestPage />}
      {tab === 'compare' && <SweepPage />}
      {tab === 'stress' && <StressPage />}
      {tab === 'factors' && <FactorsPage />}
      {tab === 'behavioral' && <BehavioralCoach />}
      {tab === 'tracker' && <TrackerPage />}
      {tab === 'saved' && <SavedPortfolios />}
      {tour && <Tour steps={PRO_TOUR} onClose={closeTour} />}
    </div>
  )
}
