import { AuthBar } from './components/AuthBar'
import { Home } from './pages/Home'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div>
            <h1>PortfolioU</h1>
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
        <Home />
      </main>
    </div>
  )
}
