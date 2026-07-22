import { useState } from 'react'
import { useBehaviorGap } from '../api/queries'
import type { BehaviorGapRequest, BehaviorGapResponse } from '../api/types'
import { BIAS_INFO, BIAS_QUESTIONS, detectBiases, statedTolerance, type Bias } from '../lib/biases'
import { extractApiError } from '../lib/errors'
import { exactMoney, money, percent, ratio } from '../lib/format'
import { SERIES_COLORS } from '../lib/series'
import { useLastOptimization } from '../optimizer/useLastOptimization'
import { BehaviorGapChart } from './BehaviorGapChart'
import { EmptyState } from './EmptyState'
import { NumberInput } from './NumberInput'

const GAP_OBJECTIVES = new Set(['max_sharpe', 'min_variance'])

export function BehavioralCoach() {
  const { lastRun } = useLastOptimization()
  const gap = useBehaviorGap()

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [initial, setInitial] = useState(10000)

  const total = BIAS_QUESTIONS.length
  const question = BIAS_QUESTIONS[step]
  const answered = question ? answers[question.id] !== undefined : false

  if (!lastRun) {
    return (
      <EmptyState
        title="Run the optimizer first"
        description="The coach measures what your instincts would have done to your actual portfolio, so it needs one to work with."
      />
    )
  }

  const objective = GAP_OBJECTIVES.has(lastRun.objective) ? lastRun.objective : 'max_sharpe'
  const substituted = objective !== lastRun.objective

  const restart = () => {
    setStep(0)
    setAnswers({})
    gap.reset()
  }

  const submit = () => {
    const biases = detectBiases(answers)
    const request: BehaviorGapRequest = {
      tickers: lastRun.request.tickers,
      objective: objective as 'max_sharpe' | 'min_variance',
      risk_model: lastRun.riskModel,
      max_weight: lastRun.request.max_weight ?? 0.35,
      initial,
      loss_aversion: biases.includes('lossAversion'),
      overconfidence: biases.includes('overconfidence'),
      anchoring: biases.includes('anchoring'),
      panic_drawdown: statedTolerance(answers),
    }
    gap.mutate(request)
  }

  const next = () => {
    if (step < total - 1) {
      setStep(step + 1)
      return
    }
    submit()
  }

  if (gap.isPending) {
    return <p className="muted">Replaying your portfolio through history, twice…</p>
  }

  if (gap.isError) {
    return (
      <div className="workspace-error">
        <p className="error">{extractApiError(gap.error, "Couldn't run the behavior gap.")}</p>
        <button type="button" className="signin-trigger" onClick={restart}>
          Try again
        </button>
      </div>
    )
  }

  if (gap.data) {
    return <BehaviorGapResult result={gap.data} biases={detectBiases(answers)} onRestart={restart} />
  }

  return (
    <div className="bcoach">
      <header className="bcoach__head">
        <span className="bcoach__eyebrow">Behavioral Coach</span>
        <h2>How would your instincts trade?</h2>
        <p>
          Answer honestly. The coach then replays your own portfolio through history twice, once
          rebalanced with discipline and once the way your answers say you would have traded it.
        </p>
        <p className="bcoach__source">
          Using your last optimizer run, {lastRun.request.tickers.length} tickers.
          {substituted && ` The gap engine backtests max Sharpe, so ${lastRun.objective} was substituted.`}
        </p>
      </header>

      <div className="bcoach__progress">
        <span>
          Question {step + 1} of {total}
        </span>
        <div className="bcoach__track">
          <div
            className="bcoach__fill"
            style={{ width: `${((step + (answered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="bcoach__card" key={step}>
        <p className="bcoach__q">{question.text}</p>
        <div className="bcoach__options" role="radiogroup" aria-label={question.text}>
          {question.options.map((option, optionIndex) => {
            const selected = answers[question.id] === optionIndex
            return (
              <label key={option.label} className={selected ? 'bopt is-selected' : 'bopt'}>
                <input
                  type="radio"
                  className="bopt__input"
                  name={question.id}
                  checked={selected}
                  onChange={() =>
                    setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                  }
                />
                <span className="bopt__badge">{String.fromCharCode(65 + optionIndex)}</span>
                <span className="bopt__label">{option.label}</span>
                <span className="bopt__check" aria-hidden="true">
                  ✓
                </span>
              </label>
            )
          })}
        </div>

        {step === total - 1 && (
          <div className="planner-field behavioral-stake">
            <label htmlFor="behavior-initial">Amount to simulate</label>
            <div className="planner-input-suffix">
              <span>$</span>
              <NumberInput id="behavior-initial" min={100} step={1000} value={initial} onChange={setInitial} />
            </div>
          </div>
        )}

        <div className="bcoach__actions">
          {step > 0 && (
            <button type="button" className="bcoach__back" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          <button className="primary bcoach__next" disabled={!answered} onClick={next}>
            {step < total - 1 ? 'Next →' : 'Replay my portfolio →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BehaviorGapResult({
  result,
  biases,
  onRestart,
}: {
  result: BehaviorGapResponse
  biases: Bias[]
  onRestart: () => void
}) {
  const { disciplined, behavioral, tolerance } = result
  const behaviorCost = result.gap_value > 0
  const meaningful = Math.abs(result.gap_pct) >= 0.005

  return (
    <div className="behavioral-result">
      <header className="behavioral-head">
        <h2>What your instincts would have done</h2>
        <p className="muted">
          {result.tickers.length} tickers, {result.start} to {result.end}, starting from{' '}
          {exactMoney(result.initial)}.
        </p>
      </header>

      {biases.length === 0 ? (
        <p className="muted">
          Your answers don't show strong signs of loss aversion, overconfidence, or anchoring, so both paths below
          are the same disciplined strategy.
        </p>
      ) : (
        <div className="bias-section">
          {result.drivers.map((driver) => (
            <div key={driver.bias} className="bias-card">
              <div className="bias-name">{BIAS_INFO[driver.bias].name}</div>
              <p className="bias-explanation">{BIAS_INFO[driver.bias].explanation}</p>
              <p className="bias-behavior">
                <strong>Simulated as</strong> {driver.behavior}
              </p>
            </div>
          ))}
        </div>
      )}

      {biases.length > 0 && (
        <div className={`behavior-headline ${behaviorCost ? 'costly' : 'favourable'}`}>
          {!meaningful ? (
            <p>
              Over this period your instincts would have finished within half a percent of the disciplined
              portfolio, at {money(behavioral.stats.final_value)} against {money(disciplined.stats.final_value)}.
              On this history the difference is noise.
            </p>
          ) : behaviorCost ? (
            <p>
              Trading on your instincts would have left you with{' '}
              <strong>{money(behavioral.stats.final_value)}</strong> instead of{' '}
              <strong>{money(disciplined.stats.final_value)}</strong>. That is{' '}
              <strong>{money(Math.abs(result.gap_value))}</strong> of behavior gap, or{' '}
              {percent(Math.abs(result.gap_pct), 1)} of the disciplined result.
            </p>
          ) : (
            <p>
              On this particular history your instincts would have finished ahead, at{' '}
              <strong>{money(behavioral.stats.final_value)}</strong> against{' '}
              <strong>{money(disciplined.stats.final_value)}</strong>. That is one path through one period,
              not evidence the habit pays. Check the drawdown and Sharpe below before you trust it.
            </p>
          )}
        </div>
      )}

      <BehaviorGapChart result={result} />

      <div className="bt-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>
                <span className="series-swatch" style={{ background: SERIES_COLORS[0] }} aria-hidden="true" />
                Disciplined
              </th>
              <th>
                <span className="series-swatch" style={{ background: SERIES_COLORS[1] }} aria-hidden="true" />
                Your instincts
              </th>
            </tr>
          </thead>
          <tbody>
            <Row label="Final value" a={money(disciplined.stats.final_value)} b={money(behavioral.stats.final_value)} />
            <Row label="Annualised return" a={percent(disciplined.stats.cagr)} b={percent(behavioral.stats.cagr)} />
            <Row label="Volatility" a={percent(disciplined.stats.volatility)} b={percent(behavioral.stats.volatility)} />
            <Row label="Sharpe ratio" a={ratio(disciplined.stats.sharpe_ratio)} b={ratio(behavioral.stats.sharpe_ratio)} />
            <Row label="Worst drawdown" a={percent(disciplined.stats.max_drawdown)} b={percent(behavioral.stats.max_drawdown)} />
            <Row
              label="Trading costs paid"
              a={percent(disciplined.stats.total_cost)}
              b={percent(behavioral.stats.total_cost)}
            />
            <Row label="Rebalances" a={String(disciplined.stats.rebalances)} b={String(behavioral.stats.rebalances)} />
            <Row label="Panic sales" a={String(disciplined.stats.panic_sales)} b={String(behavioral.stats.panic_sales)} />
            <Row
              label="Days sitting in cash"
              a={String(disciplined.stats.days_derisked)}
              b={String(behavioral.stats.days_derisked)}
            />
          </tbody>
        </table>
      </div>

      {tolerance && (
        <div className="tolerance-check">
          <h3>Your stated limit against what actually happened</h3>
          {tolerance.breaches === 0 ? (
            <p>
              You said you would sell after a {percent(tolerance.stated_tolerance, 0)} fall from the peak. Over this
              period the disciplined portfolio never got there. Its worst fall was{' '}
              <strong>{percent(tolerance.worst_drawdown, 1)}</strong>, so your rule would never have fired.
            </p>
          ) : (
            <p>
              You said you would sell after a {percent(tolerance.stated_tolerance, 0)} fall from the peak. The
              disciplined portfolio crossed that line <strong>{tolerance.breaches}</strong>{' '}
              {tolerance.breaches === 1 ? 'time' : 'times'}, first on <strong>{tolerance.first_breach}</strong>, and
              its worst fall was <strong>{percent(tolerance.worst_drawdown, 1)}</strong>. Holding this portfolio
              means living through that.
            </p>
          )}
        </div>
      )}

      <p className="provenance">
        Both paths are walk-forward with no look-ahead, rebalanced out of sample and charged the same trading
        costs. This is one historical path over one universe, not a forecast.
      </p>

      <button type="button" className="signin-trigger" onClick={onRestart}>
        Retake assessment
      </button>
    </div>
  )
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr>
      <th className="row-label">{label}</th>
      <td className="mono">{a}</td>
      <td className="mono">{b}</td>
    </tr>
  )
}
