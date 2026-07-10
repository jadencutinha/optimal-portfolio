import type { Objective, RiskModel } from '../api/types'

export const ADVANCED_OBJECTIVES = new Set<Objective>([
  'risk_parity',
  'max_diversification',
  'cvar',
  'cost_aware',
  'target_return',
  'target_risk',
  'hrp',
])

export const ADVANCED_RISK = new Set<RiskModel>(['ledoit_wolf', 'ewma', 'factor'])

export const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'max_sharpe', label: 'Maximum Sharpe' },
  { value: 'min_variance', label: 'Minimum Variance' },
  { value: 'risk_parity', label: 'Risk Parity' },
  { value: 'max_diversification', label: 'Max Diversification' },
  { value: 'cvar', label: 'Minimum CVaR' },
  { value: 'cost_aware', label: 'Net-of-cost' },
  { value: 'hrp', label: 'Hierarchical Risk Parity' },
  { value: 'target_return', label: 'Target Return' },
  { value: 'target_risk', label: 'Target Risk' },
]

export const RISK_MODELS: { value: RiskModel; label: string }[] = [
  { value: 'sample', label: 'Sample covariance' },
  { value: 'ledoit_wolf', label: 'Ledoit-Wolf shrinkage' },
  { value: 'ewma', label: 'EWMA' },
  { value: 'factor', label: 'Factor model (PCA)' },
]

export const LOOKBACKS: { value: number; label: string }[] = [
  { value: 252, label: '1 year' },
  { value: 504, label: '2 years' },
  { value: 756, label: '3 years' },
  { value: 1260, label: '5 years' },
]

export const OBJECTIVE_LABEL = Object.fromEntries(
  OBJECTIVES.map((option) => [option.value, option.label]),
) as Record<Objective, string>

export const RISK_MODEL_LABEL = Object.fromEntries(
  RISK_MODELS.map((option) => [option.value, option.label]),
) as Record<RiskModel, string>
