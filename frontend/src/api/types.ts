export type Objective = 'min_variance' | 'max_sharpe' | 'target_return' | 'target_risk'
export type RiskModel = 'sample' | 'ledoit_wolf' | 'ewma'

export interface UniverseAsset {
  ticker: string
  name: string
  sector: string
}

export interface UniverseResponse {
  assets: UniverseAsset[]
}

export interface AssetBound {
  ticker: string
  min_weight?: number | null
  max_weight?: number | null
}

export interface SectorCap {
  sector: string
  max_weight?: number | null
  min_weight?: number | null
}

export interface OptimizeRequest {
  tickers: string[]
  objective: Objective
  risk_model: RiskModel
  target_return?: number | null
  target_risk?: number | null
  lookback_days?: number | null
  min_weight: number
  max_weight: number
  asset_bounds?: AssetBound[]
  sector_caps?: SectorCap[]
}

export interface WeightAllocation {
  ticker: string
  weight: number
  sector?: string | null
}

export interface PortfolioMetrics {
  expected_return: number
  volatility: number
  sharpe_ratio: number
}

export interface OptimizeResponse {
  objective: Objective
  provider: string
  risk_model: RiskModel
  as_of_start: string
  as_of_end: string
  n_assets: number
  solver_status: string
  risk_free_rate: number
  covariance_shrinkage: number | null
  weights: WeightAllocation[]
  metrics: PortfolioMetrics
  run_id: number | null
}

export interface FrontierPoint {
  expected_return: number
  volatility: number
  sharpe_ratio: number
  weights: WeightAllocation[]
}

export interface FrontierResponse {
  provider: string
  risk_model: RiskModel
  as_of_start: string
  as_of_end: string
  risk_free_rate: number
  points: FrontierPoint[]
  min_variance_index: number
  tangency_index: number
}

export interface FrontierParams {
  tickers: string[]
  lookback_days: number
  min_weight: number
  max_weight: number
  risk_model: RiskModel
  points: number
}
