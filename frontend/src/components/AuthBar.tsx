import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { displayName } from '../lib/displayName'
import { AuthModal } from './AuthModal'
import { ProfileModal } from './ProfileModal'

type Modal = null | 'login' | 'signup' | 'profile'

export function AuthBar() {
  const { session, loading, signInWithGoogle, signOut } = useAuth()
  const [modal, setModal] = useState<Modal>(null)
  const [open, setOpen] = useState(false)

  if (loading) {
    return null
  }

  if (session) {
    return (
      <div className="authbar">
        <div className="auth-menu" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <button type="button" className="signin-trigger" onClick={() => setOpen((value) => !value)}>
            {displayName(session.user)}
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
                    setModal('profile')
                  }}
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    signOut()
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
        {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
      </div>
    )
  }

  return (
    <div className="authbar">
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
                  setModal('login')
                }}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setModal('signup')
                }}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  signInWithGoogle()
                }}
              >
                Continue with Google
              </button>
            </div>
          </div>
        )}
      </div>
      {(modal === 'login' || modal === 'signup') && (
        <AuthModal initialMode={modal} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
