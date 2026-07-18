import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Track } from '../data/courseData'

vi.mock('../api/queries', () => ({
  useCourseAssistant: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  }),
}))

const { ModuleLayout } = await import('./ModuleLayout')

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

function setup(overrides: { isModuleComplete?: (moduleId: number) => boolean } = {}) {
  const onSelectModule = vi.fn()
  const onBackToTracks = vi.fn()
  const onModuleComplete = vi.fn()
  const isModuleComplete = overrides.isModuleComplete ?? vi.fn(() => false)

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
    expect(screen.getByText('0/1 correct. Review the highlighted answers above.')).toBeInTheDocument()
    expect(onModuleComplete).not.toHaveBeenCalled()
  })

  it('marks a correct answer and calls onModuleComplete with the module id', async () => {
    const user = userEvent.setup()
    const { onModuleComplete } = setup()

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(screen.getByRole('button', { name: '4✓' })).toHaveClass('correct')
    expect(screen.getByText('Perfect, 1/1 correct!')).toBeInTheDocument()
    expect(onModuleComplete).toHaveBeenCalledWith(1, 0)
  })

  it('awards 3 stars and shows the XP gain on a first-try perfect run', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(screen.getByLabelText('3 out of 3 stars')).toBeInTheDocument()
    expect(screen.getByText('+50 XP')).toBeInTheDocument()
  })

  it('awards fewer stars and less XP after a retake', async () => {
    const user = userEvent.setup()
    const { onModuleComplete } = setup()

    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: 'Retake quiz' }))
    await user.click(screen.getByRole('button', { name: '4' }))

    expect(onModuleComplete).toHaveBeenCalledWith(1, 1)
    expect(screen.getByLabelText('2 out of 3 stars')).toBeInTheDocument()
    expect(screen.getByText('+30 XP')).toBeInTheDocument()
  })

  it('does not show an XP gain for a module that was already complete', async () => {
    const user = userEvent.setup()
    setup({ isModuleComplete: vi.fn(() => true) })

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(screen.getByLabelText('3 out of 3 stars')).toBeInTheDocument()
    expect(screen.queryByText('+50 XP')).not.toBeInTheDocument()
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
    expect(screen.getByText('0/1 correct. Review the highlighted answers above.')).toBeInTheDocument()

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
