import { createContext } from 'react'

export type View = 'home' | 'analyze' | 'invest' | 'learn' | 'about' | 'profile'

export type Overlay = 'manage-plan' | 'checkout' | 'risk' | null

export interface ViewState {
  view: View
  overlay: Overlay
  setView: (view: View) => void
  openOverlay: (overlay: Exclude<Overlay, null>) => void
  closeOverlay: () => void
  goHome: () => void
}

export const ViewContext = createContext<ViewState>({
  view: 'home',
  overlay: null,
  setView: () => {},
  openOverlay: () => {},
  closeOverlay: () => {},
  goHome: () => {},
})
