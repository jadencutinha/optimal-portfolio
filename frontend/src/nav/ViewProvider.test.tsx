import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ViewProvider } from './ViewProvider'
import { useView } from './useView'

function Probe() {
  const { view, overlay, setView, openOverlay, closeOverlay, goHome } = useView()
  return (
    <div>
      <span data-testid="view">{view}</span>
      <span data-testid="overlay">{overlay ?? 'none'}</span>
      <button onClick={() => setView('analyze')}>go-analyze</button>
      <button onClick={() => openOverlay('checkout')}>open-checkout</button>
      <button onClick={() => closeOverlay()}>close</button>
      <button onClick={() => goHome()}>home</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <ViewProvider>
      <Probe />
    </ViewProvider>,
  )
}

afterEach(() => {
  window.history.replaceState(null, '')
})

describe('ViewProvider navigation', () => {
  it('starts at home', () => {
    renderProvider()
    expect(screen.getByTestId('view')).toHaveTextContent('home')
    expect(screen.getByTestId('overlay')).toHaveTextContent('none')
  })

  it('pushes a history entry when navigating to a view', () => {
    renderProvider()
    fireEvent.click(screen.getByText('go-analyze'))
    expect(screen.getByTestId('view')).toHaveTextContent('analyze')
    expect((window.history.state as { __nav?: unknown }).__nav).toEqual({ view: 'analyze', overlay: null })
  })

  it('opens an overlay on top of the current view', () => {
    renderProvider()
    fireEvent.click(screen.getByText('go-analyze'))
    fireEvent.click(screen.getByText('open-checkout'))
    expect(screen.getByTestId('view')).toHaveTextContent('analyze')
    expect(screen.getByTestId('overlay')).toHaveTextContent('checkout')
  })

  it('restores the snapshot on browser back (popstate)', () => {
    renderProvider()
    fireEvent.click(screen.getByText('go-analyze'))
    fireEvent.click(screen.getByText('open-checkout'))

    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: { __nav: { view: 'analyze', overlay: null } } }),
      )
    })
    expect(screen.getByTestId('view')).toHaveTextContent('analyze')
    expect(screen.getByTestId('overlay')).toHaveTextContent('none')
  })

  it('closeOverlay steps back through history', () => {
    renderProvider()
    fireEvent.click(screen.getByText('open-checkout'))
    const back = vi.spyOn(window.history, 'back')
    fireEvent.click(screen.getByText('close'))
    expect(back).toHaveBeenCalledTimes(1)
    back.mockRestore()
  })

  it('goHome returns to the home view', () => {
    renderProvider()
    fireEvent.click(screen.getByText('go-analyze'))
    fireEvent.click(screen.getByText('home'))
    expect(screen.getByTestId('view')).toHaveTextContent('home')
    expect(screen.getByTestId('overlay')).toHaveTextContent('none')
  })
})
