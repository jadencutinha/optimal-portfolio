import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../toast/useToast'

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { session, updateProfile } = useAuth()
  const toast = useToast()

  const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>
  const str = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string) : '')

  const [fullName, setFullName] = useState(str('full_name') || str('name'))
  const [username, setUsername] = useState(str('username'))
  const [birthdate, setBirthdate] = useState(str('birthdate'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async () => {
    setBusy(true)
    setError(null)
    const result = await updateProfile({
      full_name: fullName.trim() || undefined,
      username: username.trim() || undefined,
      birthdate: birthdate || undefined,
    })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    toast('Profile updated', 'success')
    onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>Edit profile</h2>
        <p className="modal-sub">{session?.user.email}</p>

        <div className="modal-fields">
          <label>
            Full name
            <input
              type="text"
              autoFocus
              placeholder="Jane Doe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label>
            Username
            <input
              type="text"
              placeholder="janedoe"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Birthdate
            <input type="date" value={birthdate} onChange={(event) => setBirthdate(event.target.value)} />
          </label>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="primary modal-submit" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="modal-toggle" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  )
}
