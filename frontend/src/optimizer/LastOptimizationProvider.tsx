import { useMemo, useState, type ReactNode } from 'react'
import { LastOptimizationContext, type LastOptimization } from './context'

export function LastOptimizationProvider({ children }: { children: ReactNode }) {
  const [lastRun, setLastRun] = useState<LastOptimization | null>(null)
  const value = useMemo(() => ({ lastRun, setLastRun }), [lastRun])
  return <LastOptimizationContext.Provider value={value}>{children}</LastOptimizationContext.Provider>
}
