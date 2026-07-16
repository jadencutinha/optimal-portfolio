import { Suspense, lazy, useCallback, useMemo, useRef } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useBillingConfig, useSetPlan } from '../api/queries'
import type { CheckoutSession } from '../api/types'
import { StripeDemoCheckout } from '../components/StripeDemoCheckout'
import { getStripe } from '../lib/stripe'
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
  const config = useBillingConfig()
  const setPlan = useSetPlan()
  const queryClient = useQueryClient()

  useSurface('space')

  const publishableKey = config.data?.publishable_key ?? ''
  const stripeEnabled = Boolean(config.data?.enabled && publishableKey)
  const stripePromise = useMemo(
    () => (stripeEnabled ? getStripe(publishableKey) : null),
    [stripeEnabled, publishableKey],
  )

  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const fetchClientSecret = useCallback(async () => {
    const { data } = await apiClient.post<CheckoutSession>('/api/billing/checkout-session')
    return data.client_secret
  }, [])

  const onComplete = useCallback(async () => {
    await apiClient.post('/api/billing/confirm')
    await queryClient.invalidateQueries({ queryKey: ['me'] })
    onDoneRef.current()
  }, [queryClient])

  const checkoutOptions = useMemo(() => ({ fetchClientSecret, onComplete }), [fetchClientSecret, onComplete])

  const bypass = async () => {
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

          {config.isLoading ? (
            <p className="checkout__note">Loading secure checkout…</p>
          ) : stripeEnabled && stripePromise ? (
            <div className="checkout__stripe" key={publishableKey}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <StripeDemoCheckout amountLabel="$29.00" onPay={bypass} paying={setPlan.isPending} />
          )}

          {DEMO_BYPASS && (
            <button type="button" className="checkout__bypass" disabled={setPlan.isPending} onClick={bypass}>
              {setPlan.isPending ? 'Unlocking…' : 'Skip payment and unlock Pro now'}
            </button>
          )}

          <p className="checkout__secure">
            <LockIcon />
            Secured by Stripe. Test mode, so no real card is charged.
          </p>

          <button type="button" className="checkout__back" onClick={onCancel}>
            Back to platforms
          </button>
        </div>
      </div>
    </div>
  )
}
