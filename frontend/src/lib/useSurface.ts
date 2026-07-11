import { useEffect } from 'react'

export function useSurface(name: string, tier?: string) {
  useEffect(() => {
    document.body.dataset.surface = name
    if (tier) document.body.dataset.tier = tier
    return () => {
      delete document.body.dataset.surface
      delete document.body.dataset.tier
    }
  }, [name, tier])
}
