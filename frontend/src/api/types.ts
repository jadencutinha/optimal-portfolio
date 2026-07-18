export type Objective =
  | 'min_variance'
  | 'max_sharpe'
  | 'target_return'
  | 'target_risk'
  | 'risk_parity'
  | 'max_diversification'
  | 'cvar'
  | 'cost_aware'
  | 'hrp'
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
  prev_weights?: Record<string, number> | null
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
  dropped_tickers: string[]
  run_id: number | null
}

export interface TickerValidation {
  ticker: string
  valid: boolean
}

export interface TickerValidationResponse {
  results: TickerValidation[]
  valid: string[]
  invalid: string[]
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

export type Plan = 'free' | 'pro'

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
  solve_confidence?: number
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

export interface SuccessPoint {
  month: number
  prob: number
}

export interface PlanLever {
  label: string
  delta: number
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
  solve_confidence: number
  solved_monthly: number | null
  solved_years: number | null
  median_months_to_goal: number | null
  success_over_time: SuccessPoint[]
  levers: PlanLever[]
}

export type BiasName = 'lossAversion' | 'overconfidence' | 'anchoring'

export interface BehaviorGapRequest {
  tickers: string[]
  objective: 'max_sharpe' | 'min_variance'
  risk_model: RiskModel
  history_days?: number
  estimation_window?: number
  rebalance?: 'monthly' | 'quarterly' | 'annual'
  cost_bps?: number
  max_weight: number
  initial: number
  loss_aversion: boolean
  overconfidence: boolean
  anchoring: boolean
  panic_drawdown: number
}

export interface BehaviorCurvePoint {
  date: string
  value: number
  drawdown: number
}

export interface PolicyStats {
  final_value: number
  total_return: number
  cagr: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  total_cost: number
  total_turnover: number
  rebalances: number
  panic_sales: number
  days_derisked: number
}

export interface PolicyResult {
  name: string
  stats: PolicyStats
  curve: BehaviorCurvePoint[]
  panic_dates: string[]
}

export interface BiasDriver {
  bias: BiasName
  behavior: string
}

export interface ToleranceCheck {
  stated_tolerance: number
  worst_drawdown: number
  breaches: number
  first_breach: string | null
}

export interface BehaviorGapResponse {
  start: string
  end: string
  initial: number
  tickers: string[]
  disciplined: PolicyResult
  behavioral: PolicyResult
  gap_value: number
  gap_pct: number
  cagr_gap: number
  drivers: BiasDriver[]
  tolerance: ToleranceCheck | null
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
  reply: string
  rationale: string
  explanation: string
  config: AssistantConfig | null
  result: OptimizeResponse | null
}

export interface StressCurvePoint {
  date: string
  equity: number
}

export interface StressWindow {
  key: string
  label: string
  description: string
  start: string
  end: string
  available: boolean
  total_return: number | null
  max_drawdown: number | null
  volatility: number | null
  recovered: boolean | null
  recovery_days: number | null
  trough_date: string | null
  assets_used: number
  missing_tickers: string[]
  curve: StressCurvePoint[]
}

export interface StressResponse {
  objective: Objective
  provider: string
  weights: WeightAllocation[]
  windows: StressWindow[]
}

export interface ResampledFrontierRequest {
  tickers: string[]
  lookback_days?: number | null
  min_weight?: number
  max_weight?: number
  risk_model?: RiskModel
  points?: number
  resamples?: number
}

export interface ResampledFrontierResponse {
  provider: string
  risk_model: RiskModel
  as_of_start: string
  as_of_end: string
  risk_free_rate: number
  resamples: number
  sample: FrontierPoint[]
  resampled: FrontierPoint[]
}

export interface InvestAccount {
  status: string
  currency: string
  cash: number
  equity: number
  portfolio_value: number
  buying_power: number
  long_market_value: number
  configured: boolean
}

export interface InvestPosition {
  symbol: string
  qty: number
  avg_entry_price: number
  current_price: number
  market_value: number
  cost_basis: number
  unrealized_pl: number
  unrealized_plpc: number
  change_today: number
}

export interface InvestHistoryPoint {
  timestamp: number
  equity: number
  profit_loss: number
}

export interface InvestHistory {
  window: string
  timeframe: string
  base_value: number
  points: InvestHistoryPoint[]
}

export interface InvestOrderResult {
  symbol: string
  notional: number
  status: string
  order_id: string | null
  message: string | null
}

export interface InvestSummary {
  amount: number
  fee: number
  fee_bps: number
  invested: number
  plan: string
  orders: InvestOrderResult[]
}

export interface InvestOrderRecord {
  id: string
  symbol: string
  side: string
  notional: number | null
  qty: number | null
  filled_qty: number | null
  status: string
  submitted_at: string | null
  filled_avg_price: number | null
}

export interface InvestBenchmarkPoint {
  timestamp: number
  portfolio: number
  benchmark: number
}

export interface InvestBenchmark {
  window: string
  symbol: string
  base_value: number
  portfolio_return: number
  benchmark_return: number
  alpha: number
  tracking_error: number
  points: InvestBenchmarkPoint[]
}

export interface InvestDriftRow {
  symbol: string
  current_value: number
  current_weight: number
  target_weight: number
  target_value: number
  delta: number
  action: 'buy' | 'sell' | 'hold'
}

export interface InvestRebalancePlan {
  portfolio_id: number
  portfolio_name: string
  total_value: number
  max_drift: number
  fee: number
  fee_bps: number
  rows: InvestDriftRow[]
  tradable: boolean
  message: string | null
}

export interface InvestRebalanceSummary {
  sells: InvestOrderResult[]
  buys: InvestOrderResult[]
  fee: number
}

export interface InvestTradeRequest {
  symbol: string
  side: 'buy' | 'sell'
  notional: number
}

export interface InvestRequest {
  weights: Record<string, number>
  amount: number
}

export interface MarketQuote {
  symbol: string
  price: number
  previous_close: number
  change: number
  change_pct: number
  as_of: string | null
}

export interface QuoteBoard {
  quotes: MarketQuote[]
  source: string
  feed: string
  as_of: string | null
}

export interface PricePoint {
  date: string
  close: number
}

export interface TickerPrices {
  ticker: string
  points: PricePoint[]
}

export interface PricesResponse {
  provider: string
  start: string
  end: string
  series: TickerPrices[]
}

export interface BillingConfig {
  enabled: boolean
  publishable_key: string
  price_amount_cents: number
  currency: string
  product_name: string
}

export interface CheckoutSession {
  client_secret: string
  session_id: string
}

export interface GamePathPoint {
  month: number
  value: number
}

export interface GamePlayerResult {
  name: string
  tickers: string[]
  resolved_tickers: string[]
  start_value: number
  final_value: number
  return_pct: number
  cagr: number
  best_ticker: string | null
  win_probability: number
  median_final: number
  p10_final: number
  p90_final: number
  volatility: number
  resilience: number
  path: GamePathPoint[]
}

export interface GameAward {
  category: string
  label: string
  player_index: number
  detail: string
}

export interface GameMeta {
  simulations: number
  data_source: string
  history_years: number
  source: string
  method: string
  credibility: string
}

export interface GameResponse {
  years: number
  months: number
  start_value: number
  winner_index: number
  players: GamePlayerResult[]
  awards: GameAward[]
  meta: GameMeta | null
}

export interface GameRequest {
  players: { name: string; tickers: string[] }[]
  years: number
  seed?: number
}

export interface RoomPlayerState {
  id: string
  name: string
  is_host: boolean
  pick_count: number
  ready: boolean
}

export interface RoomState {
  code: string
  status: string
  years: number
  players: RoomPlayerState[]
  result: GameResponse | null
}

export interface CreateRoomResponse {
  code: string
  player_id: string
  room: RoomState
}

export interface JoinRoomResponse {
  player_id: string
  room: RoomState
}
