import { useState } from 'react'
import { BehavioralCoach } from '../components/BehavioralCoach'
import { SavedPortfolios } from '../components/SavedPortfolios'
import { BacktestPage } from './BacktestPage'
import { OptimizerPage } from './OptimizerPage'
import { SweepPage } from './SweepPage'

type Tab = 'optimizer' | 'backtest' | 'compare' | 'behavioral' | 'saved'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'compare', label: 'Compare' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'saved', label: 'My Portfolios' },
]

export function ProWorkspace() {
  const [tab, setTab] = useState<Tab>('optimizer')
  return (
    <div className="pro-workspace">
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
      {tab === 'backtest' && <BacktestPage />}
      {tab === 'compare' && <SweepPage />}
      {tab === 'behavioral' && <BehavioralCoach />}
      {tab === 'saved' && <SavedPortfolios />}
    </div>
  )
}
