function StripeWordmark({ className }: { className?: string }) {
  return <span className={className ? `stripe-wordmark ${className}` : 'stripe-wordmark'}>stripe</span>
}

function VisaMark() {
  return (
    <svg viewBox="0 0 40 24" className="cardbrand" aria-hidden="true">
      <rect width="40" height="24" rx="3" fill="#1434CB" />
      <text x="20" y="16" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">
        VISA
      </text>
    </svg>
  )
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" className="cardbrand" aria-hidden="true">
      <rect width="40" height="24" rx="3" fill="#fff" stroke="#e6e6e6" />
      <circle cx="16" cy="12" r="7" fill="#EB001B" />
      <circle cx="24" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  )
}

function AmexMark() {
  return (
    <svg viewBox="0 0 40 24" className="cardbrand" aria-hidden="true">
      <rect width="40" height="24" rx="3" fill="#0077A6" />
      <text x="20" y="16" fontSize="8" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">
        AMEX
      </text>
    </svg>
  )
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

interface Props {
  amountLabel: string
  onPay: () => void
  paying: boolean
}

export function StripeDemoCheckout({ amountLabel, onPay, paying }: Props) {
  return (
    <div className="stripe-demo" role="group" aria-label="Stripe card payment, demo preview">
      <div className="stripe-demo__head">
        <span className="stripe-demo__heading">Pay with card</span>
        <StripeWordmark />
      </div>

      <div className="stripe-demo__label">
        Card information
        <span className="stripe-demo__box stripe-demo__box--card">
          <span className="stripe-demo__ph">1234 1234 1234 1234</span>
          <span className="stripe-demo__brands" aria-hidden="true">
            <VisaMark />
            <MastercardMark />
            <AmexMark />
          </span>
        </span>
      </div>

      <div className="stripe-demo__row">
        <span className="stripe-demo__box">
          <span className="stripe-demo__ph">MM / YY</span>
        </span>
        <span className="stripe-demo__box">
          <span className="stripe-demo__ph">CVC</span>
        </span>
      </div>

      <div className="stripe-demo__label">
        Name on card
        <span className="stripe-demo__box">
          <span className="stripe-demo__ph">Full name</span>
        </span>
      </div>

      <button type="button" className="stripe-demo__pay" onClick={onPay} disabled={paying}>
        {paying ? 'Processing…' : `Subscribe ${amountLabel} / month`}
      </button>

      <div className="stripe-demo__footer">
        <LockGlyph />
        <span>
          Powered by <StripeWordmark className="stripe-wordmark--sm" />
        </span>
        <span className="stripe-demo__links">Terms · Privacy</span>
      </div>
    </div>
  )
}
