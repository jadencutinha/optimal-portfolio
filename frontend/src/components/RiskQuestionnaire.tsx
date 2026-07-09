import { useState } from 'react'

const QUESTIONS = [
  {
    id: 'reaction',
    text: 'If your portfolio dropped 20% in one month, what would you do?',
    options: [
      { label: 'Sell everything immediately', score: 1 },
      { label: 'Sell some to reduce exposure', score: 2 },
      { label: 'Hold and wait for recovery', score: 3 },
      { label: 'Buy more at the lower price', score: 4 },
    ],
  },
  {
    id: 'horizon',
    text: 'How long do you plan to keep your money invested?',
    options: [
      { label: 'Less than 1 year', score: 1 },
      { label: '1 to 3 years', score: 2 },
      { label: '3 to 7 years', score: 3 },
      { label: '7+ years', score: 4 },
    ],
  },
  {
    id: 'goal',
    text: 'What is your primary investment goal?',
    options: [
      { label: 'Preserve my capital, avoid losses', score: 1 },
      { label: 'Steady income with some growth', score: 2 },
      { label: 'Long-term growth, accept some dips', score: 3 },
      { label: 'Maximum growth, comfortable with big swings', score: 4 },
    ],
  },
  {
    id: 'experience',
    text: 'How would you describe your investing experience?',
    options: [
      { label: 'No experience', score: 1 },
      { label: 'Some, I understand basic concepts', score: 2 },
      { label: 'Moderate, I follow markets regularly', score: 3 },
      { label: 'Experienced, I actively manage investments', score: 4 },
    ],
  },
  {
    id: 'volatility',
    text: 'Which scenario feels most comfortable to you?',
    options: [
      { label: 'Guaranteed 3% return per year', score: 1 },
      { label: 'Likely 6%, but could be −2%', score: 2 },
      { label: 'Likely 10%, but could be −10%', score: 3 },
      { label: 'Likely 18%, but could be −20%', score: 4 },
    ],
  },
]

interface Bias {
  name: string
  explanation: string
  warning: string
}

const BIAS_INFO: Record<string, Bias> = {
  lossAversion: {
    name: 'Loss Aversion',
    explanation:
      'Loss aversion is the tendency to feel the pain of a loss roughly twice as strongly as the pleasure of an equivalent gain. This is a hardwired human instinct, it helped our ancestors survive, but in investing it works against you. It can cause you to sell during downturns (locking in losses) or avoid risks that would actually grow your wealth over time.',
    warning:
      'Your answers suggest you may be loss averse. When markets dip, your instinct to act can be your biggest enemy. A portfolio built for your goals, not your fear, is the antidote.',
  },
  overconfidence: {
    name: 'Overconfidence',
    explanation:
      'Overconfidence is the tendency to overestimate your own knowledge, skill, or ability to predict market movements. Studies show that the more experience investors think they have, the more likely they are to trade too frequently, take on too much risk, and underperform the market. Even professionals fall into this trap.',
    warning:
      'Your answers suggest you may be overconfident in your ability to manage high-risk positions. The market has humbled many seasoned investors, systematic, rules-based optimization exists precisely to remove this bias from the equation.',
  },
  anchoring: {
    name: 'Anchoring',
    explanation:
      'Anchoring is the tendency to rely too heavily on the first piece of information you encounter, like a stock\'s purchase price or a market peak, when making decisions. Investors often hold losing positions too long because they are "anchored" to what they paid, or they avoid buying after a rally because prices feel "too high" relative to a past level.',
    warning:
      'Your answers suggest you may be anchoring to conservative expectations even though your time horizon gives you room to take on more growth. Try to evaluate investments on their future potential, not where they\'ve been.',
  },
}

function scoreToProfile(score: number): { label: string; description: string } {
  if (score <= 8) return { label: 'Conservative', description: 'You prefer stability. We recommend low-volatility portfolios with a focus on capital preservation.' }
  if (score <= 12) return { label: 'Moderate', description: 'You balance growth and safety. We recommend diversified portfolios with moderate risk.' }
  if (score <= 16) return { label: 'Aggressive', description: 'You seek strong returns and can tolerate volatility. We recommend growth-oriented portfolios.' }
  return { label: 'Very Aggressive', description: 'You are comfortable with high risk for maximum potential returns.' }
}

function detectBiases(answers: Record<string, number>): string[] {
  const biases: string[] = []

  // Loss aversion: would sell on a dip OR strongly prefers guaranteed returns
  if (answers.reaction <= 2 || answers.volatility === 1) {
    biases.push('lossAversion')
  }

  // Overconfidence: considers themselves experienced AND wants maximum risk/growth
  if (answers.experience === 4 && answers.volatility === 4 && answers.goal === 4) {
    biases.push('overconfidence')
  }

  // Anchoring: long time horizon but still focused on capital preservation or income
  if (answers.horizon >= 3 && answers.goal <= 2) {
    biases.push('anchoring')
  }

  return biases
}

interface Props {
  onComplete: (profile: string) => void
}

export function RiskQuestionnaire({ onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined)
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0)
  const profile = scoreToProfile(totalScore)
  const detectedBiases = submitted ? detectBiases(answers) : []

  if (submitted) {
    return (
      <div className="risk-result">
        <h2>Your Risk Profile: <span className="risk-profile-label">{profile.label}</span></h2>
        <p className="risk-profile-desc">{profile.description}</p>

        <div className="bias-intro">
          <p>
            Our psychological instincts evolved for survival, not investing. The same impulses that once kept us safe can lead us to panic-sell during downturns, overtrade, or anchor to the wrong numbers. Understanding your behavioral tendencies is just as important as understanding risk and return.
          </p>
        </div>

        {detectedBiases.length > 0 && (
          <div className="bias-section">
            <h3>Biases to watch out for</h3>
            <p className="muted">Based on your answers, you may be prone to the following:</p>
            {detectedBiases.map((key) => {
              const bias = BIAS_INFO[key]
              return (
                <div key={key} className="bias-card">
                  <div className="bias-name">{bias.name}</div>
                  <p className="bias-explanation">{bias.explanation}</p>
                  <div className="bias-warning">{bias.warning}</div>
                </div>
              )
            })}
          </div>
        )}

        {detectedBiases.length === 0 && (
          <div className="bias-section">
            <h3>Your behavioral profile looks balanced</h3>
            <p className="muted">Your answers don't show strong signs of common biases, but stay aware. Loss aversion, overconfidence, and anchoring are universal human tendencies that can surface under pressure.</p>
          </div>
        )}

        <button
          type="button"
          className="primary"
          onClick={() => onComplete(profile.label)}
        >
          Continue to optimizer
        </button>
      </div>
    )
  }

  return (
    <div className="risk-questionnaire">
      <h2>Risk Assessment</h2>
      <p className="muted">Answer 5 quick questions so we can tailor your experience.</p>

      {QUESTIONS.map((q, i) => (
        <div key={q.id} className="risk-question">
          <p className="risk-q-text">{i + 1}. {q.text}</p>
          <div className="risk-options">
            {q.options.map((opt) => (
              <label key={opt.label} className={`risk-option${answers[q.id] === opt.score ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt.score}
                  checked={answers[q.id] === opt.score}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.score }))}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="primary"
        disabled={!allAnswered}
        onClick={() => setSubmitted(true)}
      >
        See my risk profile
      </button>
    </div>
  )
}
