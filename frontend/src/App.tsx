import { AuthBar } from './components/AuthBar'
import { Starfield } from './components/Starfield'
import { useAuth } from './auth/useAuth'
import { useView } from './nav/useView'
import { Home } from './pages/Home'
import { VerifyPage } from './pages/VerifyPage'

export default function App() {
  const { session } = useAuth()
  const { goHome } = useView()
  const path = window.location.pathname

  if (path.startsWith('/verify/')) {
    const credentialId = decodeURIComponent(path.slice('/verify/'.length))
    return (
      <div className="app">
        <Starfield />
        <header className="app-header">
          <div className="brand">
            <a href="/" className="brand-link">
              <img src="/logo-wordmark.png" alt="Halo!" className="brand-logo" />
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
      <Starfield />
      {session && (
        <header className="app-header">
          <div className="brand">
            <div>
              <button
                type="button"
                className="brand-home"
                onClick={goHome}
                aria-label="Go to home"
              >
                <img src="/logo-wordmark.png" alt="Halo!" className="brand-logo" />
              </button>
              <p>Convex portfolio optimization on real market data</p>
            </div>
          </div>
          <div className="header-actions">
            <AuthBar />
          </div>
        </header>
      )}
      <main className="app-main">
        <Home />
      </main>
    </div>
  )
}
