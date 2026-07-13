import { Suspense, lazy, useState } from 'react'
import { useSetPlan } from '../api/queries'
import { useSurface } from '../lib/useSurface'

const SunScene = lazy(() => import('../components/SunScene').then((module) => ({ default: module.SunScene })))

const DEMO_BYPASS = (import.meta.env.VITE_DEMO_BYPASS ?? 'true') !== 'false'

const UNLOCKS = [
  'Up to 50 tickers, all objectives and risk models',
  'Shrinkage and EWMA estimators',
  'Sector and position constraints',
  'Efficient frontier and live analysis',
  'Backtesting, stress tests, and the AI assistant',
  'Unlimited saved portfolios, no trading fees',
]

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function CheckoutPage({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const setPlan = useSetPlan()
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  useSurface('space')

  const upgrade = async () => {
    await setPlan.mutateAsync('pro')
    onDone()
  }

  return (
    <div className="checkout cosmos">
      <div className="cosmos__wash" aria-hidden="true">
        <span className="cosmos__hue is-sun is-on" />
      </div>

      <div className="checkout__pitch">
        <span className="checkout__eyebrow">Pro platform</span>
        <h2>Step into the Sun</h2>
        <p className="checkout__lead">
          The full optimizer, unlocked. Everything else in the system orbits this tier.
        </p>
      </div>

      <div className="checkout__grid">
        <div className="checkout__orb">
          <Suspense fallback={null}>
            <SunScene />
          </Suspense>
          <ul className="checkout__unlocks">
            {UNLOCKS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="checkout__card">
          <div className="checkout__price">
            <strong>$29</strong>
            <span>/ month</span>
          </div>
          <p className="checkout__cancel-note">Cancel anytime. No lock-in.</p>

          <div className="checkout__fields">
            <label className="checkout__field">
              <span>Card number</span>
              <input
                value={card}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
                onChange={(event) => setCard(event.target.value)}
              />
            </label>
            <div className="checkout__row">
              <label className="checkout__field">
                <span>Expiry</span>
                <input
                  value={expiry}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  onChange={(event) => setExpiry(event.target.value)}
                />
              </label>
              <label className="checkout__field">
                <span>CVC</span>
                <input
                  value={cvc}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  onChange={(event) => setCvc(event.target.value)}
                />
              </label>
            </div>
          </div>

          <button type="button" className="primary checkout__pay" disabled={setPlan.isPending} onClick={upgrade}>
            {setPlan.isPending ? 'Processing…' : 'Pay $29 / month'}
          </button>

          {DEMO_BYPASS && (
            <button type="button" className="checkout__bypass" disabled={setPlan.isPending} onClick={upgrade}>
              Skip payment and unlock Pro now
            </button>
          )}

          <p className="checkout__secure">
            <LockIcon />
            Demo checkout. No card is charged.
          </p>

          <button type="button" className="checkout__back" onClick={onCancel}>
            Back to platforms
          </button>
        </div>
      </div>
    </div>
  )
}
