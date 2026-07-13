import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AuthModal } from '../components/AuthModal'

const HeroHalo = lazy(() =>
  import('../components/HeroHalo').then((module) => ({ default: module.HeroHalo })),
)

function useHeroDissolve() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [spent, setSpent] = useState(false)

  useEffect(() => {
    let frame = 0

    const apply = () => {
      const stage = stageRef.current
      if (!stage) return
      const span = (window.innerHeight || 1) * 0.58
      const progress = Math.min(1, Math.max(0, window.scrollY / span))
      const eased = Math.pow(progress, 1.5)
      stage.style.opacity = String(1 - eased)
      stage.style.transform = `scale(${1 - eased * 0.12})`
      setSpent((previous) => {
        const next = progress > 0.99
        return previous === next ? previous : next
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return { stageRef, spent }
}

function ShotFrame({ src, alt, tab }: { src: string; alt: string; tab: string }) {
  return (
    <figure className="shot-frame">
      <div className="shot-bar">
        <span className="aw-dot" />
        <span className="aw-dot" />
        <span className="aw-dot" />
        <span className="shot-url">{tab}</span>
      </div>
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  )
}

function Showcase({
  eyebrow,
  title,
  body,
  src,
  alt,
  tab,
}: {
  eyebrow: string
  title: string
  body: string
  src: string
  alt: string
  tab: string
}) {
  return (
    <section className="showcase">
      <div className="section-head">
        <span className="section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="showcase-shot">
        <div className="hero-glow shot-glow" />
        <ShotFrame src={src} alt={alt} tab={tab} />
      </div>
    </section>
  )
}

function SpotlightRow({
  eyebrow,
  title,
  body,
  bullets,
  src,
  alt,
  tab,
  reverse,
}: {
  eyebrow: string
  title: string
  body: string
  bullets?: string[]
  src: string
  alt: string
  tab: string
  reverse?: boolean
}) {
  return (
    <div className={reverse ? 'spot-row spot-row-reverse' : 'spot-row'}>
      <div className="spot-row-copy">
        <span className="section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        {bullets && (
          <ul className="spotlight-list">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="spot-row-shot">
        <ShotFrame src={src} alt={alt} tab={tab} />
      </div>
    </div>
  )
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 6h14M5 12h14M5 18h14" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2.2" fill="var(--panel)" />
      <circle cx="15" cy="12" r="2.2" fill="var(--panel)" />
      <circle cx="8" cy="18" r="2.2" fill="var(--panel)" />
    </svg>
  )
}
function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 2.5 2.5 0 0 0 5 0V5.5A2.5 2.5 0 0 0 9 4Z" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 5 2.5 2.5 0 0 1-5 0" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z" strokeLinejoin="round" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 4V7a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
    </svg>
  )
}
function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 4 22 9 12 14 2 9 12 4Z" strokeLinejoin="round" />
      <path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" strokeLinecap="round" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: <SlidersIcon />,
    title: 'Constraint engine',
    body: 'Cap sector exposure, bound individual positions, and throttle turnover. Real-world guardrails on top of the mean-variance line.',
  },
  {
    icon: <BrainIcon />,
    title: 'Behavioral coach',
    body: 'Get flagged for loss aversion, over-concentration, and recency chasing as you build, so you invest on the math, not the mood.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Stress testing',
    body: 'Shock your portfolio through historical crises and hypothetical scenarios to see how it holds up before it has to.',
  },
  {
    icon: <TargetIcon />,
    title: 'Factor analysis',
    body: 'Decompose returns into market, size, value, and momentum factors to understand what is really driving performance.',
  },
  {
    icon: <ChatIcon />,
    title: 'AI assistant',
    body: 'Ask questions about your portfolio in plain English and get grounded, data-aware answers on the spot.',
  },
  {
    icon: <CapIcon />,
    title: 'Verifiable certificates',
    body: 'Finish a learning track, pass the exam, and earn a shareable certificate with its own public verification page.',
  },
]

export function Landing() {
  const [modal, setModal] = useState<null | 'login' | 'signup'>(null)
  const { stageRef, spent } = useHeroDissolve()

  return (
    <div className="landing2">
      <div className="landing-auth">
        <button type="button" className="landing-auth__ghost" onClick={() => setModal('signup')}>
          Create account
        </button>
        <button type="button" className="landing-auth__login" onClick={() => setModal('login')}>
          Log in
        </button>
      </div>

      <section className="hero-stage" ref={stageRef}>
        <p className="sr-only">Halo!</p>
        <Suspense
          fallback={
            <div className="hero-halo is-fallback">
              <img src="/logo-wordmark.png" alt="Halo!" className="hero-halo__fallback" />
            </div>
          }
        >
          <HeroHalo paused={spent} />
        </Suspense>
        <div className="hero-cue" aria-hidden="true">
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      <section className="hero hero-center">
        <div className="hero-copy">
          <span className="hero-badge">
            <span className="hero-badge-dot" /> Convex optimization · Real market data
          </span>
          <h1 className="hero-title">
            Build <span className="hero-grad">mathematically optimal</span> stock portfolios.
          </h1>
          <p className="hero-sub">
            Halo turns modern portfolio theory into a tool you can actually use. Solve for the optimal
            mix of stocks with convex optimization, learn the theory as you go, and backtest every strategy
            against a plain index fund on real market data.
          </p>
          <div className="hero-cta">
            <button type="button" className="cta-primary" onClick={() => setModal('signup')}>
              Create free account
            </button>
            <button type="button" className="cta-secondary" onClick={() => setModal('login')}>
              Log in
            </button>
          </div>
          <div className="hero-trust">
            <span>✓ Free to start</span>
            <span>✓ Real EOD data</span>
            <span>✓ No spreadsheets</span>
          </div>
        </div>
      </section>

      <div className="hero-shot">
        <div className="hero-glow shot-glow" />
        <ShotFrame
          src="/screenshots/optimizer.png"
          alt="Halo optimizer, allocation donut, expected return, volatility, Sharpe ratio, and weight table"
          tab="Halo · Optimizer"
        />
      </div>

      <div className="metric-strip">
        <div>
          <strong>4</strong>
          <span>optimization objectives</span>
        </div>
        <div>
          <strong>5+</strong>
          <span>risk models</span>
        </div>
        <div>
          <strong>SPY · 60/40</strong>
          <span>backtest benchmarks</span>
        </div>
        <div>
          <strong>Real</strong>
          <span>end-of-day prices</span>
        </div>
      </div>

      <div className="features-intro section-head">
        <span className="section-eyebrow">Everything inside</span>
        <h2>A quant desk, in the browser</h2>
        <p>The same optimization stack a professional would use, made approachable, visual, and yours.</p>
      </div>

      <Showcase
        eyebrow="Backtesting"
        title="Prove every strategy out of sample"
        body="Replay your portfolio through years of real history and stack it against SPY, an equal-weight basket, and 60/40, with growth, drawdown, rolling Sharpe, and a full metrics table."
        src="/screenshots/backtest.png"
        alt="Halo backtest, growth of $1, drawdown, rolling Sharpe charts, and a metrics table versus benchmarks"
        tab="Halo · Backtest"
      />

      <div className="spot-rows">
        <SpotlightRow
          eyebrow="Efficient frontier"
          title="See the whole risk and return trade-off"
          body="Every portfolio is plotted on its efficient frontier, with the min-variance and max-Sharpe points marked and a full risk X-ray of your result."
          bullets={[
            'Min-variance, max-Sharpe, and your portfolio, side by side',
            'Concentration, effective holdings, and largest position',
            'Sector breakdown at a glance',
          ]}
          src="/screenshots/frontier.png"
          alt="Halo efficient frontier chart with an optimized-portfolio risk breakdown and sector allocation"
          tab="Halo · Efficient frontier"
        />
        <SpotlightRow
          reverse
          eyebrow="Goal planner"
          title="Plan for a number that actually matters"
          body="Simulate thousands of possible futures for your plan and see the odds of hitting your goal, plus the risk of a deep drawdown on the way there."
          bullets={[
            'Monte Carlo projections with a likely-range fan',
            'Probability of reaching your target',
            'Contributions, horizon, and starting balance',
          ]}
          src="/screenshots/planner.png"
          alt="Halo goal-based planner with Monte Carlo projected outcomes and probability of reaching the goal"
          tab="Halo · Goal planner"
        />
        <SpotlightRow
          eyebrow="Live tracking"
          title="Know exactly when to rebalance"
          body="Save a portfolio and Halo watches how its weights drift as prices move and tells you when a position has wandered outside your band."
          bullets={[
            'Per-holding drift versus target',
            'Rebalance-band alerts',
            'Turnover needed to get back on track',
          ]}
          src="/screenshots/tracker.png"
          alt="Halo live tracking and rebalance alerts with per-holding drift versus target weights"
          tab="Halo · Tracker"
        />
      </div>

      <section className="learn-band">
        <SpotlightRow
          reverse
          eyebrow="Learn as you invest"
          title="From saving basics to the math hedge funds use"
          body="Three guided tracks build on each other, from money fundamentals to behavioral finance to portfolio optimization. Each has short modules, knowledge checks, and a certificate at the end."
          bullets={[
            'Beginner to advanced, in bite-sized modules',
            'Knowledge checks that make it stick',
            'Earn a verifiable certificate per track',
          ]}
          src="/screenshots/learn.png"
          alt="Halo Learn, three learning tracks with progress and downloadable certificates"
          tab="Halo · Learn"
        />
      </section>

      <section className="features">
        <div className="section-head">
          <span className="section-eyebrow">And more</span>
          <h2>Built for the whole journey</h2>
          <p>Beyond the core optimizer, everything you need to build with conviction and stay on track.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="method-band">
        <span className="section-eyebrow">Under the hood</span>
        <h2>Grounded in real math and real data</h2>
        <p>
          Every portfolio comes from a Markowitz mean-variance program solved with <code>cvxpy</code>, over
          expected returns and a covariance matrix estimated from genuine end-of-day price history, not a
          back-of-the-envelope heuristic.
        </p>
        <div className="stack-chips">
          {['FastAPI', 'cvxpy', 'React', 'TypeScript', 'pandas / numpy', 'Recharts'].map((chip) => (
            <span key={chip} className="stack-chip">
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-inner">
          <div className="hero-glow final-glow" />
          <h2>Ready to build your optimal portfolio?</h2>
          <p>Create a free account and run your first optimization in minutes.</p>
          <div className="hero-cta">
            <button type="button" className="cta-primary" onClick={() => setModal('signup')}>
              Get started free
            </button>
            <button type="button" className="cta-secondary" onClick={() => setModal('login')}>
              I already have an account
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Built with equal contribution by <strong>Jaden</strong> (Princeton University), {' '}
          <strong>Nadia</strong> (Washington University, St.&nbsp;Louis) and {' '} <strong>Bernardo</strong> (Rutgers University).
        </p>
        <a href="https://github.com/jadencutinha/optimal-portfolio" target="_blank" rel="noreferrer">
          View source on GitHub
        </a>
      </footer>

      {modal && <AuthModal initialMode={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
