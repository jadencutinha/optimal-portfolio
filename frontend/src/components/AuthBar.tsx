import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useView } from '../nav/useView'
import { displayName } from '../lib/displayName'
import { AuthModal } from './AuthModal'

type Modal = null | 'login' | 'signup'

export function AuthBar() {
  const { session, loading, signInWithGoogle, signOut } = useAuth()
  const { setView } = useView()
  const [modal, setModal] = useState<Modal>(null)
  const [open, setOpen] = useState(false)

  if (loading) {
    return null
  }

  if (session) {
    const name = displayName(session.user)
    let avatar = ''
    try {
      avatar = localStorage.getItem(`profile_avatar:${session.user.id}`) ?? ''
    } catch {
      avatar = ''
    }
    return (
      <div className="authbar">
        <div className="auth-menu" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <button type="button" className="signin-trigger" onClick={() => setOpen((value) => !value)}>
            <span className="authbar-avatar" aria-hidden="true">
              {avatar ? <img src={avatar} alt="" /> : <span>{name.charAt(0).toUpperCase()}</span>}
            </span>
            {name}
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
                    setView('profile')
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
