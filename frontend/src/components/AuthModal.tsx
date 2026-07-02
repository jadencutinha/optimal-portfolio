import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/useAuth'

export function AuthModal({
  onClose,
  initialMode = 'login',
}: {
  onClose: () => void
  initialMode?: 'login' | 'signup'
}) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isSignup = mode === 'signup'
  const canSubmit = isSignup ? Boolean(username && email && password) : Boolean(email && password)

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const result = isSignup ? await signUp(email, password, username) : await signIn(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (isSignup && 'needsConfirmation' in result && result.needsConfirmation) {
      setNotice('Account created — check your email to confirm, then log in.')
      setMode('login')
      setPassword('')
      return
    }
    onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>{isSignup ? 'Create account' : 'Log in'}</h2>
        <p className="modal-sub">
          {isSignup ? 'Sign up to save your portfolios and unlock more features.' : 'Welcome back.'}
        </p>

        <div className="modal-fields">
          {isSignup && (
            <label>
              Username
              <input
                type="text"
                autoFocus
                placeholder="your name or handle"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoFocus={!isSignup}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submit()}
            />
          </label>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button className="primary modal-submit" disabled={busy || !canSubmit} onClick={submit}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>

        <button
          type="button"
          className="modal-toggle"
          onClick={() => {
            setMode(isSignup ? 'login' : 'signup')
            setError(null)
            setNotice(null)
          }}
        >
          {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>

        <div className="modal-divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn modal-google" onClick={() => signInWithGoogle()}>
          Continue with Google
        </button>
      </div>
    </div>,
    document.body,
  )
}
