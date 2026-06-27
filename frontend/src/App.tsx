import { AuthBar } from './components/AuthBar'
import { Greeting } from './components/Greeting'
import { OptimizerPage } from './pages/OptimizerPage'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div>
            <h1>Optimal Portfolio</h1>
            <p>Convex portfolio optimization on real market data</p>
          </div>
        </div>
        <div className="header-actions">
          <AuthBar />
          <a className="whitepaper-link" href="/whitepaper.html" target="_blank" rel="noreferrer">
            Whitepaper
          </a>
        </div>
      </header>
      <main className="app-main">
        <Greeting />
        <OptimizerPage />
      </main>
    </div>
  )
}
