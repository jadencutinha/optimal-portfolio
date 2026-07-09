import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Track } from '../data/courseData'
import { ModuleLayout } from './ModuleLayout'

const track: Track = {
  id: 99,
  title: 'Test Track',
  description: 'A track used only in tests',
  estimatedTime: '5 min',
  difficulty: 'Beginner',
  modules: [
    {
      id: 1,
      title: 'Module One',
      content: [{ type: 'paragraph', text: 'Some lesson content.' }],
      quiz: [
        {
          question: 'What is 2 + 2?',
          options: [
            { text: '3', correct: false },
            { text: '4', correct: true },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Module Two',
      content: [{ type: 'paragraph', text: 'More lesson content.' }],
      quiz: [],
    },
  ],
}

function setup() {
  const onSelectModule = vi.fn()
  const onBackToTracks = vi.fn()
  const onModuleComplete = vi.fn()
  const isModuleComplete = vi.fn(() => false)

  render(
    <ModuleLayout
      track={track}
      moduleIndex={0}
      onSelectModule={onSelectModule}
      onBackToTracks={onBackToTracks}
      isModuleComplete={isModuleComplete}
      onModuleComplete={onModuleComplete}
    />
  )

  return { onSelectModule, onBackToTracks, onModuleComplete }
}

describe('ModuleLayout quiz', () => {
  it('marks the chosen wrong answer and reveals the correct one, without calling onModuleComplete', async () => {
    const user = userEvent.setup()
    const { onModuleComplete } = setup()

    await user.click(screen.getByRole('button', { name: '3' }))

    expect(screen.getByRole('button', { name: '3✗' })).toHaveClass('incorrect')
    expect(screen.getByRole('button', { name: '4✓' })).toHaveClass('reveal-correct')
    expect(screen.getByText('0/1 correct — review the highlighted answers above.')).toBeInTheDocument()
    expect(onModuleComplete).not.toHaveBeenCalled()
  })

  it('marks a correct answer and calls onModuleComplete with the module id', async () => {
    const user = userEvent.setup()
    const { onModuleComplete } = setup()

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(screen.getByRole('button', { name: '4✓' })).toHaveClass('correct')
    expect(screen.getByText('Perfect — 1/1 correct!')).toBeInTheDocument()
    expect(onModuleComplete).toHaveBeenCalledWith(1)
  })

  it('locks in the answer so options cannot be changed after answering', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: '3' }))

    expect(screen.getByRole('button', { name: '3✗' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '4✓' })).toBeDisabled()
  })

  it('resets answers when "Retake quiz" is clicked', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: '3' }))
    expect(screen.getByText('0/1 correct — review the highlighted answers above.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retake quiz' }))

    expect(screen.getByRole('button', { name: '3' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: '4' })).not.toBeDisabled()
  })

  it('disables "Previous" on the first module and "Next module" on the last', () => {
    setup()

    expect(screen.getByRole('button', { name: '← Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next module →' })).not.toBeDisabled()
  })
})
