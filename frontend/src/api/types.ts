export type Objective =
  | 'min_variance'
  | 'max_sharpe'
  | 'target_return'
  | 'target_risk'
  | 'risk_parity'
  | 'max_diversification'
  | 'cvar'
  | 'cost_aware'
export type RiskModel = 'sample' | 'ledoit_wolf' | 'ewma' | 'factor'
export type ReturnModel = 'historical' | 'black_litterman'

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
  return_model: ReturnModel
  cvar_alpha?: number
  transaction_cost_bps?: number
  risk_aversion?: number
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
  turnover: number | null
  transaction_cost: number | null
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

export interface PortfolioSummary {
  id: number
  name: string
  objective: string
  risk_model: string
  metrics: Record<string, number>
  created_at: string
}

export interface PortfolioDetail extends PortfolioSummary {
  tickers: string[]
  weights: Record<string, number>
}

export interface PortfolioCreate {
  name: string
  objective: string
  risk_model: string
  tickers: string[]
  weights: Record<string, number>
  metrics: Record<string, number>
}

export interface VerificationResult {
  valid: boolean
  course: string | null
  issued_to: string | null
  issued_at: string | null
  credential_id: string | null
}

export interface CourseSummary {
  id: string
  title: string
  summary: string
  topic_count: number
  enrolled: boolean
  completed: boolean
}

export interface TopicQuiz {
  prompt: string
  options: string[]
}

export interface TopicBlock {
  type: 'p' | 'h' | 'formula' | 'ul'
  text?: string
  items?: string[]
}

export interface CourseTopic {
  id: string
  title: string
  body: TopicBlock[]
  quiz: TopicQuiz
}

export interface ExamQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface CourseDetail {
  id: string
  title: string
  summary: string
  topics: CourseTopic[]
  exam_question_count: number
}

export interface AnswerResult {
  correct: boolean
  answer: number
}

export interface ExamResult {
  score: number
  total: number
  percent: number
  passed: boolean
  credential_id: string | null
}

export interface SweepCell {
  objective: Objective
  risk_model: RiskModel
  status: 'ok' | 'error'
  expected_return: number | null
  volatility: number | null
  sharpe_ratio: number | null
  message?: string
}

export interface RiskContribution {
  ticker: string
  weight: number
  risk_contribution: number
  return_contribution: number
  at_max_bound: boolean
  at_min_bound: boolean
}

export interface Counterfactual {
  label: string
  description: string
  expected_return: number
  volatility: number
  sharpe_ratio: number
  delta_sharpe: number
}

export interface ExplainResponse {
  objective: Objective
  as_of_start: string
  as_of_end: string
  expected_return: number
  volatility: number
  sharpe_ratio: number
  effective_holdings: number
  concentration_hhi: number
  binding_max_weight: boolean
  binding_tickers: string[]
  top_risk_driver: string | null
  contributions: RiskContribution[]
  counterfactuals: Counterfactual[]
}

export interface PlanRequest {
  expected_return: number
  volatility: number
  initial: number
  monthly_contribution: number
  years: number
  target?: number | null
  trials?: number
  large_drawdown?: number
  seed?: number | null
}

export interface PlanPoint {
  month: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface PlanResponse {
  years: number
  months: number
  trials: number
  target: number | null
  total_contributions: number
  prob_success: number | null
  prob_large_drawdown: number
  large_drawdown: number
  median_final: number
  mean_final: number
  p10_final: number
  p90_final: number
  timeline: PlanPoint[]
}

export interface AssistantRequest {
  message: string
  tickers?: string[] | null
}

export interface AssistantConfig {
  tickers: string[]
  objective: string
  risk_model: string
  return_model: string
  max_weight: number
  target_return: number | null
  target_risk: number | null
  cvar_alpha: number
  risk_aversion: number
  lookback_days: number | null
}

export interface AssistantResponse {
  model: string
  rationale: string
  explanation: string
  config: AssistantConfig
  result: OptimizeResponse
}
