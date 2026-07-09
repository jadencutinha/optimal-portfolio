import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LastOptimizationContext, type LastOptimization } from '../optimizer/context'
import { BIAS_QUESTIONS, detectBiases, statedTolerance } from '../lib/biases'

const mutate = vi.fn()

vi.mock('../api/queries', () => ({
  useBehaviorGap: () => ({
    mutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
  }),
}))

const { BehavioralCoach } = await import('./BehavioralCoach')

const LAST_RUN: LastOptimization = {
  expectedReturn: 0.18,
  volatility: 0.17,
  sharpeRatio: 1.02,
  objective: 'max_sharpe',
  riskModel: 'sample',
  tickers: ['NVDA', 'TSLA', 'COST'],
  request: {
    tickers: ['NVDA', 'TSLA', 'COST'],
    objective: 'max_sharpe',
    risk_model: 'sample',
    return_model: 'historical',
    lookback_days: 756,
    min_weight: 0,
    max_weight: 0.4,
  },
}

function renderCoach(lastRun: LastOptimization | null) {
  return render(
    <LastOptimizationContext.Provider value={{ lastRun, setLastRun: vi.fn() }}>
      <BehavioralCoach />
    </LastOptimizationContext.Provider>,
  )
}

async function answerEveryQuestionWithTheFirstOption(user: ReturnType<typeof userEvent.setup>) {
  for (let index = 0; index < BIAS_QUESTIONS.length; index += 1) {
    const radios = screen.getAllByRole('radio')
    await user.click(radios[0])
    const button = screen.getByRole('button', { name: index < BIAS_QUESTIONS.length - 1 ? 'Next' : 'Replay my portfolio' })
    await user.click(button)
  }
}

describe('BehavioralCoach', () => {
  beforeEach(() => mutate.mockClear())

  it('refuses to guess when there is no optimizer run to analyse', () => {
    renderCoach(null)
    expect(screen.getByText('Run the optimizer first')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('uses the tickers from the real optimizer run, not a hardcoded universe', async () => {
    const user = userEvent.setup()
    renderCoach(LAST_RUN)
    await answerEveryQuestionWithTheFirstOption(user)

    expect(mutate).toHaveBeenCalledTimes(1)
    const request = mutate.mock.calls[0][0]
    expect(request.tickers).toEqual(['NVDA', 'TSLA', 'COST'])
    expect(request.tickers).not.toContain('AAPL')
    expect(request.max_weight).toBe(0.4)
    expect(request.risk_model).toBe('sample')
  })

  it('sends the stated drawdown tolerance straight through to the engine', async () => {
    const user = userEvent.setup()
    renderCoach(LAST_RUN)
    await answerEveryQuestionWithTheFirstOption(user)

    const request = mutate.mock.calls[0][0]
    expect(request.panic_drawdown).toBe(0.1)
    expect(request.loss_aversion).toBe(true)
    expect(request.overconfidence).toBe(true)
    expect(request.anchoring).toBe(true)
  })

  it('shows the last optimizer run rather than pretending to know a portfolio', () => {
    renderCoach(LAST_RUN)
    expect(screen.getByText(/Using your last optimizer run, 3 tickers/)).toBeInTheDocument()
  })
})

describe('bias scoring', () => {
  it('only flags a bias once its score reaches the threshold', () => {
    expect(detectBiases({ concentration: 0 })).toContain('overconfidence')
    expect(detectBiases({ concentration: 1 })).not.toContain('overconfidence')
  })

  it('falls back to a 20% tolerance when the question is unanswered', () => {
    expect(statedTolerance({})).toBe(0.2)
  })

  it('reads the stated tolerance from the answer', () => {
    const question = BIAS_QUESTIONS.find((item) => item.id === 'tolerance')!
    expect(statedTolerance({ tolerance: 0 })).toBe(question.options[0].tolerance)
    expect(statedTolerance({ tolerance: 3 })).toBe(0.3)
  })
})
