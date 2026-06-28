import { useState } from 'react'
import { BacktestPage } from './BacktestPage'
import { OptimizerPage } from './OptimizerPage'
import { SweepPage } from './SweepPage'

type Tab = 'optimizer' | 'backtest' | 'compare'

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimizer', label: 'Optimizer' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'compare', label: 'Compare' },
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
    </div>
  )
}
