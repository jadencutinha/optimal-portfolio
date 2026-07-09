import { useContext } from 'react'
import { LastOptimizationContext } from './context'

export function useLastOptimization() {
  const context = useContext(LastOptimizationContext)
  if (!context) {
    throw new Error('useLastOptimization must be used within a LastOptimizationProvider')
  }
  return context
}
