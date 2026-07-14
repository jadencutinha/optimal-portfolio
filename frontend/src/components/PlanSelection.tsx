import { Suspense, lazy, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Plan } from '../api/types'
import { useSurface } from '../lib/useSurface'

const CelestialBodies = lazy(() =>
  import('./CelestialBodies').then((module) => ({ default: module.CelestialBodies })),
)

interface PlanCard {
  id: Plan
  name: string
  price: string
  hue: 'saturn' | 'sun'
  tagline: string
  features: string[]
  featured?: boolean
  note?: string
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    hue: 'saturn',
    tagline: 'Explore portfolio optimization with the core tools.',
    features: [
      'Up to 8 tickers',
      'Max-Sharpe & Min-Variance',
      'Sample covariance risk model',
      '10 optimizations / day',
      'Save up to 3 portfolios',
      'Full access to every learning track',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/mo',
    hue: 'sun',
    tagline: 'The full optimizer with everything unlocked.',
    features: [
      'Up to 50 tickers',
      'All objectives & risk models',
      'Shrinkage & EWMA estimators',
      'Sector & position constraints',
      'Efficient frontier & live analysis',
      'Unlimited saved portfolios',
      'No paper-trading fee',
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
  const currentIndex = PLANS.findIndex((plan) => plan.id === current)
  const [index, setIndex] = useState(currentIndex >= 0 ? currentIndex : 0)

  useSurface('space')

  const plan = PLANS[index]
  const step = (delta: number) => setIndex((value) => (value + delta + PLANS.length) % PLANS.length)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  const choose = () => {
    if (plan.id === 'pro' && onUpgradeToPro) {
      onUpgradeToPro()
      return
    }
    setSavingId(plan.id)
    onChoose(plan.id)
  }

  return (
    <div className={`plan-selection cosmos is-${plan.hue}`}>
      <div className="cosmos__wash" aria-hidden="true">
        {PLANS.map((option, i) => (
          <span key={option.id} className={`cosmos__hue is-${option.hue}${i === index ? ' is-on' : ''}`} />
        ))}
      </div>

      <header className="plan-head">
        <h2>{current ? 'Switch your platform' : 'Choose your platform'}</h2>
        <p>{current ? 'Move to a different experience anytime.' : 'Pick how you want to start. You can switch later.'}</p>
      </header>

      <div
        className="cosmos__stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Platforms"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <Suspense fallback={null}>
          <CelestialBodies active={index} />
        </Suspense>

        <button
          type="button"
          className="cosmos__arrow is-left"
          onClick={() => step(-1)}
          aria-label="Previous platform"
        >
          ‹
        </button>
        <button type="button" className="cosmos__arrow is-right" onClick={() => step(1)} aria-label="Next platform">
          ›
        </button>
      </div>

      <div className="cosmos__card" key={plan.id}>
        <div className="cosmos__card-head">
          <span className="cosmos__kicker">{plan.name}</span>
          <span className="cosmos__price">{plan.price}</span>
          {plan.featured && <span className="plan-flag">Most powerful</span>}
        </div>
        <p className="cosmos__tagline">{plan.tagline}</p>
        <ul className="cosmos__features">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        {plan.note && <p className="plan-note">{plan.note}</p>}
        {current === plan.id ? (
          <button type="button" className="plan-current" disabled={!onCancel} onClick={onCancel}>
            {onCancel ? `Jump into ${plan.name}` : 'Current platform'}
          </button>
        ) : (
          <button type="button" className="primary" disabled={pending} onClick={choose}>
            {pending && savingId === plan.id ? 'Saving…' : `Choose ${plan.name}`}
          </button>
        )}
      </div>

      <div className="cosmos__dots" role="tablist" aria-label="Choose a platform to view">
        {PLANS.map((option, i) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={option.name}
            className={i === index ? 'cosmos__dot is-on' : 'cosmos__dot'}
            onClick={() => setIndex(i)}
          />
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
