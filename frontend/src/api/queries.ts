import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { apiClient } from './client'
import type {
  FrontierParams,
  FrontierResponse,
  MeResponse,
  OptimizeRequest,
  OptimizeResponse,
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
