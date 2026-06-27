export type Objective =
  | 'min_variance'
  | 'max_sharpe'
  | 'target_return'
  | 'target_risk'
  | 'risk_parity'
  | 'max_diversification'
  | 'cvar'
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
  cvar_alpha?: number
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

export type Plan = 'free' | 'pro' | 'course'

export interface MeResponse {
  id: string
  email: string | null
  plan: Plan
  plan_selected: boolean
  entitlements: Record<string, unknown>
}

export interface FrontierParams {
  tickers: string[]
  lookback_days: number
  min_weight: number
  max_weight: number
  risk_model: RiskModel
  points: number
}

export type BacktestObjective = 'min_variance' | 'max_sharpe'
export type RebalanceCadence = 'monthly' | 'quarterly' | 'annual'
export type BenchmarkName = 'index' | 'equal_weight' | 'sixty_forty'

export interface BacktestRequest {
  tickers: string[]
  objective: BacktestObjective
  risk_model: RiskModel
  history_days?: number | null
  estimation_window: number
  rebalance: RebalanceCadence
  cost_bps: number
  turnover_budget?: number | null
  no_trade_band: number
  min_weight: number
  max_weight: number
  benchmarks: BenchmarkName[]
}

export interface CurvePoint {
  date: string
  equity: number
  drawdown: number
}

export interface RollingPoint {
  date: string
  sharpe: number
}

export interface StrategyStats {
  total_return: number
  cagr: number
  annual_volatility: number
  sharpe_ratio: number
  sortino_ratio: number
  max_drawdown: number
  calmar_ratio: number
  avg_turnover: number
  transaction_cost: number
}

export interface RelativeStats {
  alpha: number
  beta: number
  tracking_error: number
  information_ratio: number
}

export interface StrategyResult {
  name: string
  kind: 'strategy' | 'benchmark'
  stats: StrategyStats
  relative: RelativeStats | null
  curve: CurvePoint[]
  rolling_sharpe: RollingPoint[]
}

export interface BacktestResponse {
  provider: string
  as_of_start: string
  as_of_end: string
  rebalance: RebalanceCadence
  cost_bps: number
  risk_free_rate: number
  strategies: StrategyResult[]
  run_id: number | null
}
