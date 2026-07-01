import { useState } from 'react'
import { useAssistant } from '../api/queries'
import { AllocationChart } from '../components/AllocationChart'
import { StatCards } from '../components/StatCards'
import { WeightsTable } from '../components/WeightsTable'

const EXAMPLES = [
  'I want steady growth for retirement in 30 years but hate big drops.',
  'Build me the most diversified portfolio you can from tech and banks.',
  'Protect me against a market crash while still earning a decent return.',
]

function extractError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
    if (response?.status === 503) {
      return 'The assistant is not configured yet. Add an ANTHROPIC_API_KEY on the server to enable it.'
    }
    const detail = response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return 'The assistant could not answer that. Try rephrasing your goal.'
}

export function AssistantPage() {
  const assistant = useAssistant()
  const [message, setMessage] = useState('')

  const ask = () => {
    const goal = message.trim()
    if (goal) assistant.mutate({ message: goal })
  }

  const result = assistant.data

  return (
    <div className="assistant">
      <div className="assistant-intro">
        <h2>Portfolio assistant</h2>
        <p className="muted">
          Describe your goal in plain English. The assistant picks an objective and constraints,
          runs the optimizer, and explains the result.
        </p>
      </div>

      <div className="assistant-composer">
        <textarea
          value={message}
          rows={3}
          placeholder="e.g. I want long-term growth but can't stomach losing more than 20% in a bad year."
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="assistant-actions">
          <div className="assistant-examples">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" className="example-chip" onClick={() => setMessage(example)}>
                {example}
              </button>
            ))}
          </div>
          <button className="primary" onClick={ask} disabled={assistant.isPending || !message.trim()}>
            {assistant.isPending ? 'Thinking…' : 'Ask the assistant'}
          </button>
        </div>
      </div>

      {assistant.isError && <p className="error">{extractError(assistant.error)}</p>}
      {assistant.isPending && <p className="muted">Choosing a strategy and building your portfolio…</p>}

      {result && (
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
