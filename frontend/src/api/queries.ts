import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { apiClient } from './client'
import type {
  BacktestRequest,
  BacktestResponse,
  FrontierParams,
  FrontierResponse,
  MeResponse,
  OptimizeRequest,
  OptimizeResponse,
  Plan,
  UniverseResponse,
} from './types'

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
