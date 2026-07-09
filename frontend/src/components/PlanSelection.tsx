import { useState } from 'react'
import type { Plan } from '../api/types'

interface PlanCard {
  id: Plan
  name: string
  price: string
  tagline: string
  features: string[]
  featured?: boolean
  note?: string
}

const PLANS: PlanCard[] = [
  {
    id: 'course',
    name: 'Course',
    price: 'Learn',
    tagline: 'Learn investing and optimization from the ground up.',
    features: [
      'Guided lessons: investing, Markowitz, risk & Sharpe',
      'Interactive, hands-on examples',
      'Quizzes and progress tracking',
      'Verifiable certificate on completion',
    ],
  },
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    tagline: 'Explore portfolio optimization with the core tools.',
    features: [
      'Up to 8 tickers',
      'Max-Sharpe & Min-Variance',
      'Sample covariance risk model',
      '10 optimizations / day',
      'Save up to 3 portfolios',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/mo',
    tagline: 'The full optimizer with everything unlocked.',
    features: [
      'Up to 50 tickers',
      'All objectives & risk models',
      'Shrinkage & EWMA estimators',
      'Sector & position constraints',
      'Efficient frontier & live analysis',
      'Unlimited saved portfolios',
    ],
    featured: true,
    note: 'Demo. No payment required yet',
  },
]

interface Props {
  current?: Plan
  pending: boolean
  onChoose: (plan: Plan) => void
  onUpgradeToPro?: () => void
  onCancel?: () => void
}

export function PlanSelection({ current, pending, onChoose, onUpgradeToPro, onCancel }: Props) {
  const [savingId, setSavingId] = useState<Plan | null>(null)
  return (
    <div className="plan-selection">
      <header className="plan-head">
        <h2>{current ? 'Switch your platform' : 'Choose your platform'}</h2>
        <p>{current ? 'Move to a different experience anytime.' : 'Pick how you want to start. You can switch later.'}</p>
      </header>

      <div className="plan-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card${plan.featured ? ' featured' : ''}`}>
            {plan.featured && <span className="plan-flag">Most powerful</span>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price}</div>
            <p className="plan-tagline">{plan.tagline}</p>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.note && <p className="plan-note">{plan.note}</p>}
            {current === plan.id ? (
              <button type="button" className="plan-current" disabled>
                Current platform
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                disabled={pending}
                onClick={() => {
                  if (plan.id === 'pro' && onUpgradeToPro) {
                    onUpgradeToPro()
                    return
                  }
                  setSavingId(plan.id)
                  onChoose(plan.id)
                }}
              >
                {pending && savingId === plan.id ? 'Saving…' : `Choose ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      {onCancel && (
        <button type="button" className="plan-cancel" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  )
}
