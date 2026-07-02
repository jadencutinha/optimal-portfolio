import { PlatformHeader } from '../components/PlatformHeader'
import { OptimizerPage } from './OptimizerPage'

const RISK_PROFILE_KEY = 'risk_profile'

interface Props {
  onOpenRiskQ: () => void
  onUpgrade: () => void
  onSwitch: () => void
}

export function FreePage({ onOpenRiskQ, onUpgrade, onSwitch }: Props) {
  const savedProfile = localStorage.getItem(RISK_PROFILE_KEY)

  return (
    <div className="free-platform">
      <PlatformHeader onSwitch={onSwitch} />
      <div className="free-header">
        <div>
          <h1>Free platform</h1>
          <p className="lead">
            Core portfolio optimization, free. Upgrade to Pro for advanced models, backtesting, and live comparison.
          </p>
        </div>
        <button type="button" className="primary upgrade-btn" onClick={onUpgrade}>
          Upgrade to Pro
        </button>
      </div>

      <OptimizerPage />

      <div className="landing-grid free-extras">
        <section>
          <h3>Your plan includes</h3>
          <ul>
            <li>Up to 8 tickers per portfolio</li>
            <li>Max-Sharpe and Min-Variance objectives</li>
            <li>Sample-covariance risk model</li>
            <li>Up to 3 saved portfolios</li>
          </ul>
        </section>
        <section>
          <h3>Locked — upgrade to Pro</h3>
          <ul>
            <li>Shrinkage, EWMA &amp; factor risk models, advanced objectives</li>
            <li>Efficient frontier, sector &amp; position constraints</li>
            <li>Backtesting, live strategy comparison, unlimited saves</li>
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
    </div>
  )
}
