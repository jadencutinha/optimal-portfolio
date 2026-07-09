import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RiskQuestionnaire } from './RiskQuestionnaire'

async function answerAll(user: ReturnType<typeof userEvent.setup>, optionLabels: string[]) {
  for (const label of optionLabels) {
    await user.click(screen.getByLabelText(label))
  }
}

describe('RiskQuestionnaire', () => {
  it('disables submission until all 5 questions are answered', async () => {
    const user = userEvent.setup()
    render(<RiskQuestionnaire onComplete={vi.fn()} />)

    const submit = screen.getByRole('button', { name: 'See my risk profile' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByLabelText('Sell everything immediately'))
    expect(submit).toBeDisabled()
  })

  it('scores an all-conservative run as "Conservative"', async () => {
    const user = userEvent.setup()
    render(<RiskQuestionnaire onComplete={vi.fn()} />)

    await answerAll(user, [
      'Sell everything immediately',
      'Less than 1 year',
      'Preserve my capital, avoid losses',
      'No experience',
      'Guaranteed 3% return per year',
    ])

    await user.click(screen.getByRole('button', { name: 'See my risk profile' }))

    expect(
      screen.getByText((_, el) => el?.tagName === 'H2' && el.textContent === 'Your Risk Profile: Conservative')
    ).toBeInTheDocument()
  })

  it('scores an all-aggressive run as "Very Aggressive" and flags overconfidence', async () => {
    const user = userEvent.setup()
    render(<RiskQuestionnaire onComplete={vi.fn()} />)

    await answerAll(user, [
      'Buy more at the lower price',
      '7+ years',
      'Maximum growth, comfortable with big swings',
      'Experienced, I actively manage investments',
      'Likely 18%, but could be −20%',
    ])

    await user.click(screen.getByRole('button', { name: 'See my risk profile' }))

    expect(
      screen.getByText((_, el) => el?.tagName === 'H2' && el.textContent === 'Your Risk Profile: Very Aggressive')
    ).toBeInTheDocument()
    expect(screen.getByText('Overconfidence')).toBeInTheDocument()
  })

  it('flags anchoring for a long horizon paired with a low-growth goal', async () => {
    const user = userEvent.setup()
    render(<RiskQuestionnaire onComplete={vi.fn()} />)

    await answerAll(user, [
      'Hold and wait for recovery',
      '7+ years',
      'Steady income with some growth',
      'Moderate, I follow markets regularly',
      'Likely 6%, but could be −2%',
    ])

    await user.click(screen.getByRole('button', { name: 'See my risk profile' }))

    expect(screen.getByText('Anchoring')).toBeInTheDocument()
  })

  it('calls onComplete with the resulting profile label', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<RiskQuestionnaire onComplete={onComplete} />)

    await answerAll(user, [
      'Hold and wait for recovery',
      '3 to 7 years',
      'Long-term growth, accept some dips',
      'Some, I understand basic concepts',
      'Likely 10%, but could be −10%',
    ])

    await user.click(screen.getByRole('button', { name: 'See my risk profile' }))
    await user.click(screen.getByRole('button', { name: 'Continue to optimizer' }))

    expect(onComplete).toHaveBeenCalledWith('Aggressive')
  })
})
