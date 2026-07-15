import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FeatureHub, type HubFeature } from './FeatureHub'

const FEATURES: HubFeature[] = [
  { id: 'optimizer', name: 'Optimizer', kicker: 'A', description: 'a' },
  { id: 'frontier', name: 'Frontier Walk', kicker: 'B', description: 'b' },
  { id: 'assistant', name: 'Assistant', kicker: 'C', description: 'c' },
]

function frontierCard() {
  return screen.getByRole('button', { name: /open frontier walk/i })
}

describe('FeatureHub selection', () => {
  it('opens a non-center card directly on a clean click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<FeatureHub title="Toolkit" features={FEATURES} onSelect={onSelect} />)

    await user.click(frontierCard())

    expect(onSelect).toHaveBeenCalledWith('frontier')
  })

  it('opens a non-center card on a tap that jitters a few pixels', () => {
    const onSelect = vi.fn()
    render(<FeatureHub title="Toolkit" features={FEATURES} onSelect={onSelect} />)

    const card = frontierCard()
    fireEvent.pointerDown(card, { button: 0, pointerId: 1, clientX: 500 })
    fireEvent.pointerMove(card, { pointerId: 1, clientX: 509 })
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 509 })

    expect(onSelect).toHaveBeenCalledWith('frontier')
  })

  it('opens the centered card when it is tapped', () => {
    const onSelect = vi.fn()
    render(<FeatureHub title="Toolkit" features={FEATURES} onSelect={onSelect} />)

    const optimizer = screen.getByRole('button', { name: /open optimizer/i })
    fireEvent.pointerDown(optimizer, { button: 0, pointerId: 1, clientX: 100 })
    fireEvent.pointerUp(optimizer, { pointerId: 1, clientX: 100 })

    expect(onSelect).toHaveBeenCalledWith('optimizer')
  })

  it('scrubs to the next card on a real drag without selecting the pressed card', () => {
    const onSelect = vi.fn()
    render(<FeatureHub title="Toolkit" features={FEATURES} onSelect={onSelect} />)

    const viewport = screen.getByRole('listbox')
    fireEvent.pointerDown(viewport, { button: 0, pointerId: 1, clientX: 500 })
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 200 })
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 200 })

    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /open frontier walk/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
