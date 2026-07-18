import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Track } from '../data/courseData'
import type { TrackCompletion } from '../lib/courseProgress'
import { Certificate } from './Certificate'

const track: Track = {
  id: 1,
  title: 'Money Fundamentals',
  description: 'test track',
  estimatedTime: '25 min',
  difficulty: 'Beginner',
  modules: [
    { id: 1, title: 'Module One', content: [], quiz: [] },
    { id: 2, title: 'Module Two', content: [], quiz: [] },
  ],
}

const completion: TrackCompletion = {
  completedAt: '2026-03-05T00:00:00Z',
  credentialId: 'PORTU-1-9F3K2A7B',
}

describe('Certificate', () => {
  beforeEach(() => {
    vi.stubGlobal('print', vi.fn())
  })

  it('shows the learner name, course title, module count, and credential id', () => {
    render(<Certificate track={track} completion={completion} learner="Nadia Ahmed" onClose={vi.fn()} />)

    expect(screen.getByText('Nadia Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Money Fundamentals')).toBeInTheDocument()
    expect(screen.getByText(/2 modules/)).toBeInTheDocument()
    expect(screen.getByText(/25 min/)).toBeInTheDocument()
    expect(screen.getByText(/Beginner/)).toBeInTheDocument()
    expect(screen.getByText('PORTU-1-9F3K2A7B')).toBeInTheDocument()
  })

  it('formats the issue date in long form', () => {
    render(<Certificate track={track} completion={completion} learner="Nadia Ahmed" onClose={vi.fn()} />)
    // Computed the same way the component does, so this doesn't hardcode an
    // assumption about the test runner's local timezone.
    const expected = new Date(completion.completedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('triggers the browser print dialog on "Download / Print"', async () => {
    const user = userEvent.setup()
    render(<Certificate track={track} completion={completion} learner="Nadia Ahmed" onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Download / Print' }))

    expect(window.print).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when "Back to courses" is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Certificate track={track} completion={completion} learner="Nadia Ahmed" onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Back to courses' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
