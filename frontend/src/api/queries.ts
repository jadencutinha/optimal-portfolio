import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { OptimizeRequest, OptimizeResponse, UniverseResponse } from './types'

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
