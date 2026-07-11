import { useEffect } from 'react'

export function useSurface(name: string) {
  useEffect(() => {
    document.body.dataset.surface = name
    return () => {
      delete document.body.dataset.surface
    }
  }, [name])
}
