import { Suspense, lazy } from 'react'
import { useCourses, useSavedPortfolios } from '../api/queries'
import type { Plan } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { MarketStrip } from '../components/MarketStrip'
import type { MiniBodyKind } from '../components/MiniBody'
import { displayName } from '../lib/displayName'
import { useSurface } from '../lib/useSurface'

const MiniBody = lazy(() =>
  import('../components/MiniBody').then((module) => ({ default: module.MiniBody })),
)

interface Props {
  plan: Plan
  onAnalyze: () => void
  onInvest: () => void
  onLearn: () => void
  onAbout: () => void
  onManagePlan: () => void
  onUpgrade: () => void
  onCompete: () => void
}

export function HomeDashboard({
  plan,
  onAnalyze,
  onInvest,
  onLearn,
  onAbout,
  onManagePlan,
  onUpgrade,
  onCompete,
}: Props) {
  const { session } = useAuth()
  const portfolios = useSavedPortfolios()
  const courses = useCourses()

  useSurface('platform', plan)

  const saved = portfolios.data ?? []
  const tracks = courses.data ?? []
  const done = tracks.filter((track) => track.completed).length
  const started = tracks.filter((track) => track.enrolled && !track.completed).length

  const areas: {
    kind: MiniBodyKind
    title: string
    body: string
    meta: string
    onOpen: () => void
  }[] = [
    {
      kind: 'rings',
      title: 'Analyze',
      body: 'Solve for the optimal mix, backtest it, and stress test it against real market data.',
      meta: portfolios.isLoading
        ? 'Loading…'
        : saved.length === 0
          ? 'No saved portfolios yet'
          : `${saved.length} saved portfolio${saved.length === 1 ? '' : 's'}`,
      onOpen: onAnalyze,
    },
    {
      kind: 'moon',
      title: 'Learn',
      body: 'From saving basics to the math behind hedge funds. Earn a verifiable certificate.',
      meta: courses.isLoading
        ? 'Loading…'
        : tracks.length === 0
          ? 'Three tracks'
          : `${done} of ${tracks.length} tracks complete${started > 0 ? ` · ${started} in progress` : ''}`,
      onOpen: onLearn,
    },
    {
      kind: 'globe',
      title: 'Invest',
      body: 'Put a saved portfolio to work with paper trading and track how it drifts.',
      meta: plan === 'pro' ? 'No trading fee on Pro' : '25 bps trading fee on Free',
      onOpen: onInvest,
    },
  ]

  return (
    <div className={plan === 'pro' ? 'pro-workspace home-dash' : 'free-platform home-dash'}>
      <header className="home-dash__head">
        <div>
          <h2 className="greeting">Hello, {session ? displayName(session.user) : 'there'}</h2>
          <p className="home-dash__sub">Where would you like to pick up?</p>
        </div>
        <div className="home-dash__plan">
          <span className={plan === 'pro' ? 'home-plan-chip is-pro' : 'home-plan-chip'}>
            {plan === 'pro' ? 'PRO' : 'FREE'}
          </span>
          {plan === 'free' ? (
            <button type="button" className="primary home-dash__upgrade" onClick={onUpgrade}>
              Upgrade to Pro
            </button>
          ) : (
            <button type="button" className="home-dash__manage" onClick={onManagePlan}>
              Manage plan
            </button>
          )}
        </div>
      </header>

      <MarketStrip />

      <div className="home-launch">
        <span className="home-launch__eyebrow">Open a platform</span>
        <p className="home-launch__hint">Pick one to start working. This is the way into the app.</p>
      </div>

      <div className="home-areas">
        {areas.map((area) => (
          <button key={area.title} type="button" className="home-area" onClick={area.onOpen}>
            <span className="home-area__body-slot">
              <Suspense
                fallback={
                  <span
                    className={`mini-body is-fallback${area.kind === 'moon' ? ' is-fallback--moon' : ''}`}
                    aria-hidden="true"
                  />
                }
              >
                <MiniBody kind={area.kind} />
              </Suspense>
            </span>
            <span className="home-area__title">{area.title}</span>
            <span className="home-area__body">{area.body}</span>
            <span className="home-area__meta">{area.meta}</span>
            <span className="home-area__cta">Open {area.title} →</span>
          </button>
        ))}
      </div>

      <button type="button" className="home-compete" onClick={onCompete}>
        <span className="home-compete__icon" aria-hidden="true">🏆</span>
        <span className="home-compete__text">
          <strong>Click to compete with friends</strong>
          <span>Draft stocks with 2 to 4 players, simulate years of the market, and crown a champion.</span>
        </span>
        <span className="home-compete__cta">Play →</span>
      </button>

      <section className="home-mission">
        <span className="home-mission__eyebrow">Our mission</span>
        <p className="home-mission__text">
          Your portfolio should be something you <em>understand</em>, not something you are handed. Halo
          runs the same convex optimization the professionals use, and shows you exactly why it chose
          what it chose.
        </p>
        <button type="button" className="home-mission__about" onClick={onAbout}>
          About us →
        </button>
      </section>

      {saved.length > 0 && (
        <section className="home-recent">
          <div className="home-recent__head">
            <h3>Your portfolios</h3>
            <button type="button" className="home-recent__all" onClick={onAnalyze}>
              Open in Analyze →
            </button>
          </div>
          <ul className="home-recent__list">
            {saved.slice(0, 4).map((portfolio) => (
              <li key={portfolio.id}>
                <span className="home-recent__name">{portfolio.name}</span>
                <span className="home-recent__tag">{portfolio.objective.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
