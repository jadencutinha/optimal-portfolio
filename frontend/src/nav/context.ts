import { createContext } from 'react'

export type View = 'home' | 'analyze' | 'invest' | 'learn' | 'about'

export interface ViewState {
  view: View
  setView: (view: View) => void
}

export const ViewContext = createContext<ViewState>({
  view: 'home',
  setView: () => {},
})
