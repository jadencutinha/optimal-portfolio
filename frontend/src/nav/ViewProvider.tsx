import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ViewContext } from './context'
import type { Overlay, View, ViewState } from './context'

interface Snapshot {
  view: View
  overlay: Overlay
}

const HOME: Snapshot = { view: 'home', overlay: null }

function snapshotFromHistory(): Snapshot {
  const state = window.history.state as { __nav?: Snapshot } | null
  return state?.__nav ?? HOME
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<Snapshot>(() => snapshotFromHistory())

  useEffect(() => {
    const state = window.history.state as { __nav?: Snapshot } | null
    if (!state?.__nav) {
      window.history.replaceState({ ...(state ?? {}), __nav: HOME }, '')
    }
    const onPopState = (event: PopStateEvent) => {
      const snapshot = (event.state as { __nav?: Snapshot } | null)?.__nav
      setNav(snapshot ?? HOME)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value = useMemo<ViewState>(() => {
    const go = (next: Snapshot) => {
      if (nav.view === next.view && nav.overlay === next.overlay) return
      window.history.pushState({ __nav: next }, '')
      setNav(next)
    }
    return {
      view: nav.view,
      overlay: nav.overlay,
      setView: (view) => go({ view, overlay: null }),
      openOverlay: (overlay) => go({ view: nav.view, overlay }),
      closeOverlay: () => {
        if (nav.overlay === null) return
        window.history.back()
      },
      goHome: () => go(HOME),
    }
  }, [nav])

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}
