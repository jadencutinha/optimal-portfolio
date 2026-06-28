import { useState } from 'react'
import { useSetPlan } from '../api/queries'

const DEMO_BYPASS = (import.meta.env.VITE_DEMO_BYPASS ?? 'true') !== 'false'

export function CheckoutPage({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const setPlan = useSetPlan()
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const upgrade = async () => {
    await setPlan.mutateAsync('pro')
    onDone()
  }

  return (
    <div className="checkout">
      <div className="checkout-card">
        <h2>Upgrade to Pro</h2>
        <p className="modal-sub">$29 / month · advanced optimizers, backtesting, live comparison, unlimited saves.</p>

        <div className="modal-fields">
          <label>
            Card number
            <input value={card} placeholder="4242 4242 4242 4242" onChange={(event) => setCard(event.target.value)} />
          </label>
          <div className="checkout-row">
            <label>
              Expiry
              <input value={expiry} placeholder="MM/YY" onChange={(event) => setExpiry(event.target.value)} />
            </label>
            <label>
              CVC
              <input value={cvc} placeholder="123" onChange={(event) => setCvc(event.target.value)} />
            </label>
          </div>
        </div>

        <button className="primary" disabled={setPlan.isPending} onClick={upgrade}>
          {setPlan.isPending ? 'Processing…' : 'Pay $29/mo'}
        </button>

        {DEMO_BYPASS && (
          <button type="button" className="bypass-btn" disabled={setPlan.isPending} onClick={upgrade}>
            Skip payment (demo) — unlock Pro now
          </button>
        )}

        <button type="button" className="modal-toggle" onClick={onCancel}>
          Cancel
        </button>
        <p className="muted checkout-note">Demo checkout — no card is charged.</p>
      </div>
    </div>
  )
}
