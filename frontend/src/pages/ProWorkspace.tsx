import { useState } from 'react'
import { BacktestPage } from './BacktestPage'
import { OptimizerPage } from './OptimizerPage'

export function ProWorkspace() {
  const [tab, setTab] = useState<'optimizer' | 'backtest'>('optimizer')
  return (
    <div className="pro-workspace">
      <div className="tabs">
        <button type="button" className={tab === 'optimizer' ? 'tab active' : 'tab'} onClick={() => setTab('optimizer')}>
          Optimizer
        </button>
        <button type="button" className={tab === 'backtest' ? 'tab active' : 'tab'} onClick={() => setTab('backtest')}>
          Backtest
        </button>
      </div>
      {tab === 'optimizer' ? <OptimizerPage /> : <BacktestPage />}
    </div>
  )
}
