import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { extractApiError } from '../lib/errors'
import { apiClient } from './client'
import type {
  AssistantRequest,
  AssistantResponse,
  BacktestRequest,
  BacktestResponse,
  BehaviorGapRequest,
  BehaviorGapResponse,
  CourseAssistantRequest,
  CourseAssistantResponse,
  CourseDetail,
  CourseSummary,
  ExplainResponse,
  FrontierParams,
  FrontierResponse,
  InvestAccount,
  InvestBenchmark,
  InvestHistory,
  InvestOrderRecord,
  InvestOrderResult,
  InvestPosition,
  InvestRebalancePlan,
  InvestRebalanceSummary,
  InvestRequest,
  InvestSummary,
  InvestTradeRequest,
  MeResponse,
  OptimizeRequest,
  OptimizeResponse,
  Plan,
  PlanRequest,
  PlanResponse,
  PortfolioCreate,
  PortfolioDetail,
  PortfolioSummary,
  PricesResponse,
  QuoteBoard,
  ResampledFrontierRequest,
  ResampledFrontierResponse,
  StressResponse,
  TickerValidationResponse,
  UniverseResponse,
} from './types'

export function useSavedPortfolios() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['portfolios', session?.user?.id ?? 'anon'],
    enabled: Boolean(session),
    queryFn: async () => (await apiClient.get<PortfolioSummary[]>('/api/portfolios')).data,
  })
}

export function useSavePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: PortfolioCreate) =>
      (await apiClient.post<PortfolioSummary>('/api/portfolios', body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/portfolios/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
  })
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await apiClient.get<CourseSummary[]>('/api/courses')).data,
  })
}

export function useCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: ['course', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => (await apiClient.get<CourseDetail>(`/api/courses/${courseId}`)).data,
  })
}

export function useMe() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['me', session?.user?.id ?? 'anon'],
    enabled: Boolean(session),
    queryFn: async () => (await apiClient.get<MeResponse>('/api/me')).data,
  })
}

export function useSetPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (plan: Plan) => (await apiClient.put<MeResponse>('/api/me/plan', { plan })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useUniverse() {
  return useQuery({
    queryKey: ['universe'],
    queryFn: async () => (await apiClient.get<UniverseResponse>('/api/universe')).data,
  })
}

export function usePrices(tickers: string[], enabled: boolean) {
  return useQuery({
    queryKey: ['prices', [...tickers].sort().join(',')],
    enabled: enabled && tickers.length > 0,
    queryFn: async () =>
      (await apiClient.get<PricesResponse>('/api/prices', { params: { tickers: tickers.join(',') } })).data,
  })
}

export function useValidateTickers() {
  return useMutation({
    mutationFn: async (tickers: string[]) =>
      (await apiClient.post<TickerValidationResponse>('/api/tickers/validate', { tickers })).data,
  })
}

export function useOptimize() {
  return useMutation({
    mutationFn: async (request: OptimizeRequest) =>
      (await apiClient.post<OptimizeResponse>('/api/optimize', request)).data,
  })
}

export function useExplain() {
  return useMutation({
    mutationFn: async (request: OptimizeRequest) =>
      (await apiClient.post<ExplainResponse>('/api/optimize/explain', request)).data,
  })
}

export function usePlan() {
  return useMutation({
    mutationFn: async (request: PlanRequest) =>
      (await apiClient.post<PlanResponse>('/api/plan/montecarlo', request)).data,
  })
}

export function useBehaviorGap() {
  return useMutation({
    mutationFn: async (request: BehaviorGapRequest) =>
      (await apiClient.post<BehaviorGapResponse>('/api/behavior/gap', request)).data,
  })
}

export interface ComparisonSlot {
  id: string
  label: string
  request: OptimizeRequest
}

export type ComparisonOutcome = ComparisonSlot &
  ({ status: 'ok'; response: OptimizeResponse } | { status: 'error'; message: string })

export function useComparePortfolios() {
  return useMutation({
    mutationFn: async (slots: ComparisonSlot[]): Promise<ComparisonOutcome[]> => {
      const settled = await Promise.allSettled(
        slots.map((slot) => apiClient.post<OptimizeResponse>('/api/optimize', slot.request)),
      )
      return settled.map((outcome, index) => {
        const slot = slots[index]
        if (outcome.status === 'fulfilled') {
          return { ...slot, status: 'ok', response: outcome.value.data }
        }
        return {
          ...slot,
          status: 'error',
          message: extractApiError(outcome.reason, 'This portfolio could not be optimized.'),
        }
      })
    },
  })
}

export function useAssistant() {
  return useMutation({
    mutationFn: async (request: AssistantRequest) =>
      (await apiClient.post<AssistantResponse>('/api/assistant', request)).data,
  })
}

export function useCourseAssistant() {
  return useMutation({
    mutationFn: async (request: CourseAssistantRequest) =>
      (await apiClient.post<CourseAssistantResponse>('/api/course-assistant', request)).data,
  })
}

export function useStress() {
  return useMutation({
    mutationFn: async (request: OptimizeRequest) =>
      (await apiClient.post<StressResponse>('/api/stress', request)).data,
  })
}

export function usePortfolioDetail(id: number | null) {
  return useQuery({
    queryKey: ['portfolio', id],
    enabled: id !== null,
    queryFn: async () => (await apiClient.get<PortfolioDetail>(`/api/portfolios/${id}`)).data,
  })
}

export async function downloadReportPdf(request: OptimizeRequest): Promise<Blob> {
  const response = await apiClient.post('/api/report/pdf', request, { responseType: 'blob' })
  return response.data as Blob
}

export async function downloadPortfolioPdf(id: number): Promise<Blob> {
  const response = await apiClient.get(`/api/portfolios/${id}/report.pdf`, { responseType: 'blob' })
  return response.data as Blob
}

export function useResampledFrontier() {
  return useMutation({
    mutationFn: async (request: ResampledFrontierRequest) =>
      (await apiClient.post<ResampledFrontierResponse>('/api/frontier/resampled', request)).data,
  })
}

export function useBacktest() {
  return useMutation({
    mutationFn: async (request: BacktestRequest) =>
      (await apiClient.post<BacktestResponse>('/api/backtest', request)).data,
  })
}

export function useFrontier() {
  return useMutation({
    mutationFn: async (params: FrontierParams) => {
      const query = {
        tickers: params.tickers.join(','),
        lookback_days: params.lookback_days,
        min_weight: params.min_weight,
        max_weight: params.max_weight,
        risk_model: params.risk_model,
        points: params.points,
      }
      return (await apiClient.get<FrontierResponse>('/api/frontier', { params: query })).data
    },
  })
}

export function useInvestAccount() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'account', session?.user?.id ?? 'anon'],
    enabled: Boolean(session),
    refetchInterval: 30000,
    queryFn: async () => (await apiClient.get<InvestAccount>('/api/invest/account')).data,
  })
}

export function useInvestPositions() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'positions', session?.user?.id ?? 'anon'],
    enabled: Boolean(session),
    refetchInterval: 30000,
    queryFn: async () => (await apiClient.get<InvestPosition[]>('/api/invest/positions')).data,
  })
}

export function useInvestHistory(window: string) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'history', session?.user?.id ?? 'anon', window],
    enabled: Boolean(session),
    queryFn: async () =>
      (await apiClient.get<InvestHistory>('/api/invest/history', { params: { range: window } })).data,
  })
}

export function useInvestOrders() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'orders', session?.user?.id ?? 'anon'],
    enabled: Boolean(session),
    refetchInterval: 30000,
    queryFn: async () => (await apiClient.get<InvestOrderRecord[]>('/api/invest/orders')).data,
  })
}

export function useInvest() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (request: InvestRequest) =>
      (await apiClient.post<InvestSummary>('/api/invest/orders', request)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useLiquidate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async () => (await apiClient.delete<{ closed: number }>('/api/invest/positions')).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useCancelOrders() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async () => (await apiClient.delete<{ canceled: number }>('/api/invest/orders')).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useCancelOrder() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) =>
      (await apiClient.delete<{ canceled: boolean }>(`/api/invest/orders/${orderId}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useInvestBenchmark(window: string) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'benchmark', session?.user?.id ?? 'anon', window],
    enabled: Boolean(session),
    queryFn: async () =>
      (await apiClient.get<InvestBenchmark>('/api/invest/benchmark', { params: { range: window } })).data,
  })
}

export function useRebalancePlan(portfolioId: number | null) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['invest', 'rebalance', session?.user?.id ?? 'anon', portfolioId],
    enabled: Boolean(session) && portfolioId !== null,
    queryFn: async () =>
      (
        await apiClient.get<InvestRebalancePlan>('/api/invest/rebalance', {
          params: { portfolio_id: portfolioId },
        })
      ).data,
  })
}

export function useRebalance() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (portfolioId: number) =>
      (await apiClient.post<InvestRebalanceSummary>('/api/invest/rebalance', { portfolio_id: portfolioId })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useTrade() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (request: InvestTradeRequest) =>
      (await apiClient.post<InvestOrderResult>('/api/invest/trade', request)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useClosePosition() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ symbol, percentage }: { symbol: string; percentage?: number }) =>
      (
        await apiClient.delete<InvestOrderResult>(`/api/invest/positions/${symbol}`, {
          params: percentage ? { percentage } : undefined,
        })
      ).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['invest'] }),
  })
}

export function useQuotes(symbols: string[]) {
  const key = symbols.map((symbol) => symbol.toUpperCase()).sort().join(',')
  return useQuery({
    queryKey: ['market', 'quotes', key],
    enabled: key.length > 0,
    refetchInterval: 30000,
    staleTime: 15000,
    queryFn: async () =>
      (await apiClient.get<QuoteBoard>('/api/market/quotes', { params: { symbols: key } })).data,
  })
}
