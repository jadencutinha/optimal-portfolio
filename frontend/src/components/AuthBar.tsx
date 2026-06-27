import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { AuthModal } from './AuthModal'

function SignInMenu({ onCredentials, onGoogle }: { onCredentials: () => void; onGoogle: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="auth-menu" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="signin-trigger" onClick={() => setOpen((value) => !value)}>
        Sign in
        <span className="caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="auth-menu-dropdown">
          <div className="auth-menu-card">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onGoogle()
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onCredentials()
              }}
            >
              Email &amp; password
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AuthBar() {
  const { session, loading, signInWithGoogle, signOut } = useAuth()
  const [showModal, setShowModal] = useState(false)

  if (loading) {
    return null
  }

  if (session) {
    return (
      <div className="authbar">
        <button type="button" className="signin-trigger" onClick={() => signOut()}>
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="authbar">
      <SignInMenu onCredentials={() => setShowModal(true)} onGoogle={() => signInWithGoogle()} />
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
