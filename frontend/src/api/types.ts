export type Objective = 'min_variance' | 'max_sharpe' | 'target_return' | 'target_risk'

export interface UniverseAsset {
  ticker: string
  name: string
  sector: string
}

export interface UniverseResponse {
  assets: UniverseAsset[]
}

export interface OptimizeRequest {
  tickers: string[]
  objective: Objective
  target_return?: number | null
  target_risk?: number | null
  lookback_days?: number | null
  min_weight: number
  max_weight: number
}

export interface WeightAllocation {
  ticker: string
  weight: number
}

export interface PortfolioMetrics {
  expected_return: number
  volatility: number
  sharpe_ratio: number
}

export interface OptimizeResponse {
  objective: Objective
  provider: string
  as_of_start: string
  as_of_end: string
  n_assets: number
  solver_status: string
  risk_free_rate: number
  weights: WeightAllocation[]
  metrics: PortfolioMetrics
  run_id: number | null
}
