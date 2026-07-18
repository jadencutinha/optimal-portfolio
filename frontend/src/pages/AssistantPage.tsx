import { useState } from 'react'
import { useAssistant } from '../api/queries'
import { AllocationChart } from '../components/AllocationChart'
import { AssistantComposer } from '../components/AssistantComposer'
import { Loader } from '../components/Loader'
import { StatCards } from '../components/StatCards'
import { WeightsTable } from '../components/WeightsTable'

const STARTERS = [
  'I want steady growth for retirement in 30 years but hate big drops.',
  'Build me the most diversified portfolio you can from tech and banks.',
  'Protect me against a market crash while still earning a decent return.',
  'Maximize my risk-adjusted return with no more than 30% in any one stock.',
  'I want income and stability more than aggressive growth.',
  'Give me an aggressive growth portfolio, I can handle big swings.',
]

const GOALS = [
  { id: 'growth', label: 'Growth', phrase: 'I want long-term growth and can take on more risk for higher returns.' },
  { id: 'balanced', label: 'Balanced', phrase: 'I want a balanced mix of growth and stability.' },
  { id: 'income', label: 'Income', phrase: 'I want steady income with lower volatility.' },
  { id: 'preserve', label: 'Preserve capital', phrase: 'I want to preserve my capital and minimize losses.' },
] as const

function extractError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
    if (response?.status === 503) {
      return 'The assistant is not configured yet. Add an OPENAI_API_KEY on the server to enable it.'
    }
    const detail = response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return 'The assistant could not answer that. Try rephrasing your goal.'
}

export function AssistantPage() {
  const assistant = useAssistant()
  const [message, setMessage] = useState('')
  const [goal, setGoal] = useState<string | null>(null)
  const [horizon, setHorizon] = useState(20)
  const [risk, setRisk] = useState(20)

  const compose = () => {
    const chosen = GOALS.find((g) => g.id === goal)
    const parts: string[] = []
    if (message.trim()) parts.push(message.trim())
    // Only attach the portfolio context (goal, horizon, risk) when a quick-control goal is
    // chosen, so a plain message like "hello" stays a plain message the agent can just answer.
    if (chosen) {
      parts.push(chosen.phrase)
      parts.push(
        `My time horizon is about ${horizon} years and I can tolerate a drop of at most around ${risk}% in a bad year.`,
      )
    }
    return parts.join(' ')
  }

  const canAsk = (message.trim().length > 0 || goal !== null) && !assistant.isPending
  const ask = () => {
    if (canAsk) assistant.mutate({ message: compose() })
  }

  const result = assistant.data

  return (
    <div className="assistant">
      <div className="assistant-intro">
        <h2>Portfolio assistant</h2>
        <p className="muted">
          Ask anything about investing, or ask it to build you a portfolio. When you ask for one, it picks an
          objective and constraints, runs the optimizer, and explains the result.
        </p>
      </div>

      <AssistantComposer
        value={message}
        onChange={setMessage}
        onSubmit={ask}
        pending={assistant.isPending}
        canAsk={canAsk}
        goals={GOALS}
        goal={goal}
        onGoal={setGoal}
        horizon={horizon}
        onHorizon={setHorizon}
        risk={risk}
        onRisk={setRisk}
        starters={STARTERS}
      />

      {assistant.isError && <p className="error">{extractError(assistant.error)}</p>}
      {assistant.isPending && <Loader fullscreen={false} label="Thinking…" />}

      {result && !result.result && result.reply && (
        <div className="assistant-reply">
          <span className="assistant-badge">Assistant</span>
          {result.reply.split('\n').filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p className="provenance">Answered with {result.model}</p>
        </div>
      )}

      {result && result.result && result.config && (
        <div className="assistant-result">
          {result.rationale && (
            <div className="assistant-rationale">
              <span className="assistant-badge">Strategy</span>
              <p>{result.rationale}</p>
            </div>
          )}

          <div className="assistant-config">
            <span className="config-pill">{result.config.objective.replace(/_/g, ' ')}</span>
            <span className="config-pill">{result.config.risk_model.replace(/_/g, ' ')}</span>
            <span className="config-pill">cap {Math.round(result.config.max_weight * 100)}%</span>
            <span className="config-pill">{result.config.tickers.length} assets</span>
          </div>

          <StatCards result={result.result} />
          <div className="results-row">
            <AllocationChart weights={result.result.weights} />
            <WeightsTable weights={result.result.weights} />
          </div>

          {result.explanation && (
            <div className="assistant-explanation">
              {result.explanation.split('\n').filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
          <p className="provenance">Generated with {result.model}</p>
        </div>
      )}
    </div>
  )
}
