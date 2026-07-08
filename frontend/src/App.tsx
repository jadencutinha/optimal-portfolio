import { AuthBar } from './components/AuthBar'
import { ThemeToggle } from './components/ThemeToggle'
import { Home } from './pages/Home'
import { VerifyPage } from './pages/VerifyPage'

export default function App() {
  const path = window.location.pathname
  if (path.startsWith('/verify/')) {
    const credentialId = decodeURIComponent(path.slice('/verify/'.length))
    return (
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <a href="/" className="brand-link">
              <h1>PortfoliU</h1>
            </a>
          </div>
        </header>
        <main className="app-main">
          <VerifyPage credentialId={credentialId} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div>
            <h1>PortfoliU</h1>
            <p>Convex portfolio optimization on real market data</p>
          </div>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <AuthBar />
        </div>
      </header>
      <main className="app-main">
        <Home />
      </main>
    </div>
  )
}
