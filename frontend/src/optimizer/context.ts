import { createContext } from 'react'
import type { Objective, RiskModel } from '../api/types'

export interface LastOptimization {
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  objective: Objective
  riskModel: RiskModel
  tickers: string[]
}

export interface LastOptimizationContextValue {
  lastRun: LastOptimization | null
  setLastRun: (run: LastOptimization) => void
}

export const LastOptimizationContext = createContext<LastOptimizationContextValue | null>(null)
