import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ViewContext } from './context'
import type { View } from './context'

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home')
  const value = useMemo(() => ({ view, setView }), [view])
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}
