import { useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { Greeting } from '../components/Greeting'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { AssistantPage } from './AssistantPage'
import { BacktestPage } from './BacktestPage'
import { OptimizerPage } from './OptimizerPage'
import { PlannerPage } from './PlannerPage'
import { StressPage } from './StressPage'
import { SweepPage } from './SweepPage'

type Tab = 'optimizer' | 'assistant' | 'planner' | 'backtest' | 'compare' | 'stress' | 'behavioral' | 'saved'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'planner', label: 'Planner' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'compare', label: 'Compare' },
  { id: 'stress', label: 'Stress Test' },
  { id: 'behavioral', label: 'Behavioral' },
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
      {tab === 'behavioral' && <BehavioralCoach />}
      {tab === 'saved' && <SavedPortfolios />}
    </div>
  )
}
