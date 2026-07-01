import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { apiClient } from './client'
import type {
  AssistantRequest,
  AssistantResponse,
  BacktestRequest,
  BacktestResponse,
  CourseDetail,
  CourseSummary,
  ExplainResponse,
  FrontierParams,
  FrontierResponse,
  MeResponse,
  OptimizeRequest,
  OptimizeResponse,
  Plan,
  PlanRequest,
  PlanResponse,
  PortfolioCreate,
  PortfolioSummary,
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

export function useAssistant() {
  return useMutation({
    mutationFn: async (request: AssistantRequest) =>
      (await apiClient.post<AssistantResponse>('/api/assistant', request)).data,
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
