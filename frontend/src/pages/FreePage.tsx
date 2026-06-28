const RISK_PROFILE_KEY = 'risk_profile'

interface Props {
  onOpenRiskQ: () => void
}

export function FreePage({ onOpenRiskQ }: Props) {
  const savedProfile = localStorage.getItem(RISK_PROFILE_KEY)

  return (
    <div className="platform-landing">
      <h1>Free platform</h1>
      <p className="lead">Get started with the core of portfolio optimization, free.</p>

      <div className="landing-grid">
        <section>
          <h3>Included</h3>
          <ul>
            <li>Up to 8 tickers per portfolio</li>
            <li>Max-Sharpe and Min-Variance objectives</li>
            <li>Sample-covariance risk model</li>
            <li>Up to 3 saved portfolios</li>
          </ul>
        </section>
        <section>
          <h3>Upgrade to Pro for</h3>
          <ul>
            <li>All risk models (shrinkage, EWMA) and objectives</li>
            <li>Sector &amp; position constraints, efficient frontier</li>
            <li>Live analysis and unlimited saves</li>
          </ul>
        </section>
      </div>

      <div className="risk-profile-bar">
        {savedProfile ? (
          <div className="risk-profile-saved">
            <span className="muted">Your risk profile:</span>
            <span className="risk-profile-badge">{savedProfile}</span>
            <button type="button" className="retake-btn" onClick={onOpenRiskQ}>
              Retake assessment
            </button>
          </div>
        ) : (
          <button type="button" className="primary risk-q-btn" onClick={onOpenRiskQ}>
            Take risk assessment
          </button>
        )}
      </div>

      <p className="muted">The full free optimizer is coming next. Use &quot;Switch platform&quot; above to explore Pro.</p>
    </div>
  )
}
