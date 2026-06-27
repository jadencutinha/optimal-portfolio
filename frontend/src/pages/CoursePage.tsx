export function CoursePage() {
  return (
    <div className="platform-landing">
      <h1>Course platform</h1>
      <p className="lead">Learn portfolio construction by doing — from the basics of investing to convex optimization.</p>

      <div className="landing-grid">
        <section>
          <h3>What you'll learn</h3>
          <ul>
            <li>Investing fundamentals: risk, return, diversification</li>
            <li>Expected return, volatility, and the Sharpe ratio</li>
            <li>The Markowitz mean-variance model</li>
            <li>Risk models and portfolio constraints</li>
          </ul>
        </section>
        <section>
          <h3>Coming soon</h3>
          <ul>
            <li>Interactive lessons wired to the live optimizer</li>
            <li>Quizzes and progress tracking</li>
            <li>A verifiable certificate on completion</li>
          </ul>
        </section>
      </div>

      <p className="muted">Lessons are in development. Use “Switch platform” above to try Free or Pro in the meantime.</p>
    </div>
  )
}
