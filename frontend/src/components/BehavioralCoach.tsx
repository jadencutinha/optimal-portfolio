import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'
import type { Objective, OptimizeRequest, OptimizeResponse } from '../api/types'
import { BIAS_INFO, BIAS_QUESTIONS, biasAdjustment, detectBiases, type Bias } from '../lib/biases'
import { percent, ratio } from '../lib/format'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'JNJ', 'XOM', 'KO']

type Phase = 'quiz' | 'analyzing' | 'result' | 'error'

const request = (objective: Objective, maxWeight: number): OptimizeRequest => ({
  tickers: TICKERS,
  objective,
  risk_model: 'sample',
  return_model: 'historical',
  lookback_days: 756,
  min_weight: 0,
  max_weight: maxWeight,
})

export function BehavioralCoach() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [phase, setPhase] = useState<Phase>('quiz')
  const [biases, setBiases] = useState<Bias[]>([])
  const [optimal, setOptimal] = useState<OptimizeResponse | null>(null)
  const [adjusted, setAdjusted] = useState<OptimizeResponse | null>(null)

  const total = BIAS_QUESTIONS.length
  const question = BIAS_QUESTIONS[step]
  const answered = answers[question?.id] !== undefined

  const restart = () => {
    setStep(0)
    setAnswers({})
    setPhase('quiz')
    setBiases([])
    setOptimal(null)
    setAdjusted(null)
  }

  const next = async () => {
    if (step < total - 1) {
      setStep(step + 1)
      return
    }
    const detected = detectBiases(answers)
    const adjustment = biasAdjustment(detected)
    setBiases(detected)
    setPhase('analyzing')
    try {
      const [optimalResponse, adjustedResponse] = await Promise.all([
        apiClient.post<OptimizeResponse>('/api/optimize', request('max_sharpe', 0.35)),
        apiClient.post<OptimizeResponse>('/api/optimize', request(adjustment.objective, adjustment.maxWeightPct / 100)),
      ])
      setOptimal(optimalResponse.data)
      setAdjusted(adjustedResponse.data)
      setPhase('result')
    } catch {
      setPhase('error')
    }
  }

  if (phase === 'analyzing') {
    return <p className="muted">Building your math-optimal and behavior-adjusted portfolios…</p>
  }

  if (phase === 'error') {
    return (
      <div className="workspace-error">
        <p className="error">Couldn't build the comparison.</p>
        <button type="button" className="signin-trigger" onClick={restart}>
          Try again
        </button>
      </div>
    )
  }

  if (phase === 'result' && optimal && adjusted) {
    const adjustment = biasAdjustment(biases)
    const returnGap = optimal.metrics.expected_return - adjusted.metrics.expected_return
    const volGap = adjusted.metrics.volatility - optimal.metrics.volatility
    const data = [
      {
        metric: 'Expected return',
        'Math-optimal': Number((optimal.metrics.expected_return * 100).toFixed(1)),
        You: Number((adjusted.metrics.expected_return * 100).toFixed(1)),
      },
      {
        metric: 'Volatility',
        'Math-optimal': Number((optimal.metrics.volatility * 100).toFixed(1)),
        You: Number((adjusted.metrics.volatility * 100).toFixed(1)),
      },
    ]

    return (
      <div className="behavioral-result">
        <h2>Your biases vs. the math</h2>

        {biases.length === 0 ? (
          <p className="muted">
            Your answers don't show strong signs of common biases — your instincts line up well with the math-optimal
            portfolio.
          </p>
        ) : (
          <div className="bias-section">
            {biases.map((bias) => (
              <div key={bias} className="bias-card">
                <div className="bias-name">{BIAS_INFO[bias].name}</div>
                <p className="bias-explanation">{BIAS_INFO[bias].explanation}</p>
              </div>
            ))}
          </div>
        )}

        <h3 className="compare-heading">Math-optimal portfolio vs. the one your instincts would build</h3>
        <div className="behavioral-chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.25} />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Math-optimal" fill="var(--accent-hover)" />
              <Bar dataKey="You" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="compare-grid">
          <div className="compare-card">
            <h4>Math-optimal</h4>
            <p className="mono">Return {percent(optimal.metrics.expected_return)}</p>
            <p className="mono">Vol {percent(optimal.metrics.volatility)}</p>
            <p className="mono">Sharpe {ratio(optimal.metrics.sharpe_ratio)}</p>
          </div>
          <div className="compare-card you">
            <h4>Your behavior-adjusted</h4>
            <p className="mono">Return {percent(adjusted.metrics.expected_return)}</p>
            <p className="mono">Vol {percent(adjusted.metrics.volatility)}</p>
            <p className="mono">Sharpe {ratio(adjusted.metrics.sharpe_ratio)}</p>
          </div>
        </div>

        <div className="cost-of-bias">
          {adjustment.tilt === 'conservative' && adjustment.driver && (
            <p>
              Your <strong>{BIAS_INFO[adjustment.driver].name.toLowerCase()}</strong> would steer you toward a
              lower-risk portfolio — cutting your expected return by{' '}
              <strong>{percent(Math.max(returnGap, 0))}</strong> per year versus the math-optimal allocation.
            </p>
          )}
          {adjustment.tilt === 'concentrated' && (
            <p>
              Your <strong>overconfidence</strong> would steer you to concentrate — raising your volatility by{' '}
              <strong>{percent(Math.max(volGap, 0))}</strong> and lowering your Sharpe from{' '}
              <strong>{ratio(optimal.metrics.sharpe_ratio)}</strong> to{' '}
              <strong>{ratio(adjusted.metrics.sharpe_ratio)}</strong>.
            </p>
          )}
          {adjustment.tilt === 'none' && (
            <p>No bias adjustment was needed — stick with the disciplined, math-optimal portfolio.</p>
          )}
        </div>

        <button type="button" className="signin-trigger" onClick={restart}>
          Retake assessment
        </button>
      </div>
    )
  }

  return (
    <div className="behavioral-quiz">
      <h2>Behavioral Coach</h2>
      <p className="muted">
        Question {step + 1} of {total}
      </p>
      <div className="course-progress-track">
        <div className="course-progress-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>

      <div className="topic-card">
        <p className="quiz-prompt">{question.text}</p>
        {question.options.map((option, optionIndex) => (
          <label key={option.label} className={`quiz-option ${answers[question.id] === optionIndex ? 'selected' : ''}`}>
            <input
              type="radio"
              name={question.id}
              checked={answers[question.id] === optionIndex}
              onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
            />
            {option.label}
          </label>
        ))}
        <button className="primary" disabled={!answered} onClick={next}>
          {step < total - 1 ? 'Next' : 'See my results'}
        </button>
      </div>
    </div>
  )
}
