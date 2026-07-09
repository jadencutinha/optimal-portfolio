export type Bias = 'lossAversion' | 'overconfidence' | 'anchoring'

export interface BiasOption {
  label: string
  weights?: Partial<Record<Bias, number>>
  tolerance?: number
}

export interface BiasQuestion {
  id: string
  text: string
  options: BiasOption[]
}

export const BIAS_QUESTIONS: BiasQuestion[] = [
  {
    id: 'drawdown',
    text: 'Your portfolio drops 20% in a single month. What do you do?',
    options: [
      { label: 'Sell most of it to stop the bleeding', weights: { lossAversion: 2 } },
      { label: 'Sell a little to feel safer', weights: { lossAversion: 1 } },
      { label: 'Hold and wait it out' },
      { label: 'Buy more at lower prices' },
    ],
  },
  {
    id: 'comfort',
    text: 'Which outcome feels most comfortable?',
    options: [
      { label: 'A guaranteed 3% per year', weights: { lossAversion: 2 } },
      { label: 'Likely 7%, but could be −5%', weights: { lossAversion: 1 } },
      { label: 'Likely 12%, but could be −15%' },
      { label: 'Likely 20%, but could be −25%', weights: { overconfidence: 1 } },
    ],
  },
  {
    id: 'concentration',
    text: 'Would you put 40% of your money into one stock you strongly believe in?',
    options: [
      { label: 'Absolutely, conviction pays', weights: { overconfidence: 2 } },
      { label: 'Maybe, for the right company', weights: { overconfidence: 1 } },
      { label: 'No, that feels too concentrated' },
    ],
  },
  {
    id: 'skill',
    text: 'How confident are you that you can pick stocks that beat the market?',
    options: [
      { label: 'Very confident', weights: { overconfidence: 2 } },
      { label: 'Somewhat confident', weights: { overconfidence: 1 } },
      { label: 'Not confident, markets are hard' },
    ],
  },
  {
    id: 'anchor',
    text: 'A stock you bought at $100 is now $70. What do you do?',
    options: [
      { label: 'Hold until it gets back to $100', weights: { anchoring: 2 } },
      { label: 'Re-evaluate based on its future prospects' },
      { label: 'Sell if the thesis has changed' },
    ],
  },
  {
    id: 'winner',
    text: 'A stock you bought at $100 is now $140. What do you do?',
    options: [
      { label: 'Take the profit before it slips away', weights: { anchoring: 1 } },
      { label: 'Trim it back to its target weight' },
      { label: 'Leave it alone unless the thesis changed' },
    ],
  },
  {
    id: 'tolerance',
    text: 'How far below its peak could your portfolio fall before you would actually sell?',
    options: [
      { label: 'About 10%', tolerance: 0.1, weights: { lossAversion: 2 } },
      { label: 'About 15%', tolerance: 0.15, weights: { lossAversion: 1 } },
      { label: 'About 20%', tolerance: 0.2 },
      { label: 'About 30%, or I would not sell', tolerance: 0.3 },
    ],
  },
]

export const DEFAULT_TOLERANCE = 0.2

export function statedTolerance(answers: Record<string, number>): number {
  const question = BIAS_QUESTIONS.find((item) => item.id === 'tolerance')
  const choice = question ? answers[question.id] : undefined
  const option = question && choice !== undefined ? question.options[choice] : undefined
  return option?.tolerance ?? DEFAULT_TOLERANCE
}

export const BIAS_INFO: Record<Bias, { name: string; explanation: string }> = {
  lossAversion: {
    name: 'Loss Aversion',
    explanation:
      'You feel the pain of losses about twice as strongly as the joy of equivalent gains. This can make you sell during downturns and avoid the volatility that actually compounds wealth.',
  },
  overconfidence: {
    name: 'Overconfidence',
    explanation:
      'Overestimating your ability to predict markets leads to over-trading and over-concentration. Even professionals reliably underperform when they act on it.',
  },
  anchoring: {
    name: 'Anchoring',
    explanation:
      'Fixating on a reference price (like what you paid) makes you hold losers too long and judge value by the past rather than the future.',
  },
}

export function detectBiases(answers: Record<string, number>): Bias[] {
  const score: Record<Bias, number> = { lossAversion: 0, overconfidence: 0, anchoring: 0 }
  for (const question of BIAS_QUESTIONS) {
    const choice = answers[question.id]
    const option = choice !== undefined ? question.options[choice] : undefined
    if (option?.weights) {
      for (const [bias, value] of Object.entries(option.weights)) {
        score[bias as Bias] += value
      }
    }
  }
  return (Object.keys(score) as Bias[]).filter((bias) => score[bias] >= 2)
}

