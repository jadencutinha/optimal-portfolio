import { useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { Greeting } from '../components/Greeting'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { AssistantPage } from './AssistantPage'
import { BacktestPage } from './BacktestPage'
import { FactorsPage } from './FactorsPage'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { StressPage } from './StressPage'
import { SweepPage } from './SweepPage'
import { TrackerPage } from './TrackerPage'

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

export function ProWorkspace() {
  const [tab, setTab] = useState<Tab>('optimizer')
  return (
    <div className="pro-workspace">
      <Greeting />
      <div className="tabs">
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
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
    </div>
  )
}
