import { OptimizerPage } from './pages/OptimizerPage'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">◴</span>
          <div>
            <h1>Optimal Portfolio</h1>
            <p>Convex portfolio optimization on real market data</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <OptimizerPage />
      </main>
      <footer className="app-footer">Week 1 · Markowitz mean-variance engine</footer>
    </div>
  )
}
