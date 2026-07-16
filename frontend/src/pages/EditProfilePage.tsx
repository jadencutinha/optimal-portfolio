import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useSurface } from '../lib/useSurface'
import { useToast } from '../toast/useToast'

type FieldKey = 'fullName' | 'photo' | 'dob' | 'country' | 'region' | 'income' | 'experience' | 'goal'

interface TabDef {
  key: FieldKey
  label: string
  required: boolean
}

const TABS: TabDef[] = [
  { key: 'fullName', label: 'Name', required: true },
  { key: 'photo', label: 'Profile photo', required: false },
  { key: 'dob', label: 'Date of birth', required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'region', label: 'State / Region', required: false },
  { key: 'income', label: 'Annual income', required: true },
  { key: 'experience', label: 'Investing experience', required: false },
  { key: 'goal', label: 'Primary goal', required: false },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Ireland', 'Australia', 'New Zealand', 'India', 'Singapore',
  'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'United Arab Emirates', 'Japan', 'South Korea', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'Kenya', 'Other',
]

const EXPERIENCE = ['Just starting out', 'Some experience', 'Experienced', 'Professional']

const GOALS = ['Learn the basics', 'Grow long-term wealth', 'Generate income', 'Save for retirement', 'Just exploring']

interface Form {
  fullName: string
  dob: string
  country: string
  region: string
  income: string
  experience: string
  goal: string
}

async function toSquareDataUrl(file: File, size = 160): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const ratio = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * ratio
  const h = bitmap.height * ratio
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.75)
}

interface Props {
  mode: 'onboarding' | 'edit'
  onDone: () => void
  onCancel?: () => void
}

export function EditProfilePage({ mode, onDone, onCancel }: Props) {
  const { session, updateProfile, deleteAccount } = useAuth()
  const toast = useToast()
  useSurface('platform')

  const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>
  const str = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string) : '')
  const avatarKey = `profile_avatar:${session?.user.id ?? 'anon'}`

  const [form, setForm] = useState<Form>({
    fullName: str('full_name') || str('name'),
    dob: str('birthdate'),
    country: str('country'),
    region: str('region'),
    income: str('income_level'),
    experience: str('investment_experience'),
    goal: str('investment_goal'),
  })
  const [avatar, setAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem(avatarKey) ?? ''
    } catch {
      return ''
    }
  })
  const [active, setActive] = useState(0)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (key: keyof Form, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const valueFor = (key: FieldKey): string => (key === 'photo' ? avatar : form[key])
  const isComplete = (key: FieldKey) => valueFor(key).trim().length > 0
  const displayValue = (key: FieldKey): string => {
    const raw = valueFor(key)
    if (!raw) return ''
    if (key === 'income') {
      const amount = Number(raw)
      return Number.isFinite(amount) ? `$${amount.toLocaleString('en-US')}` : raw
    }
    return raw
  }

  const requiredKeys = useMemo(() => TABS.filter((tab) => tab.required).map((tab) => tab.key), [])
  const requiredDone = requiredKeys.every((key) => isComplete(key))
  const previewIndex = TABS.length
  const onPreview = active === previewIndex

  const statusClass = (tab: TabDef) => {
    if (isComplete(tab.key)) return 'is-done'
    return tab.required ? 'is-required' : 'is-optional'
  }

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await toSquareDataUrl(file)
      setAvatar(url)
    } catch {
      toast('Could not read that image. Try another file.', 'error')
    }
  }

  const save = async () => {
    if (!requiredDone) {
      toast('Fill in the required fields highlighted in red first.', 'error')
      return
    }
    setSaving(true)
    try {
      localStorage.setItem(avatarKey, avatar)
    } catch {
      // storage full or blocked — the photo just will not persist
    }
    const result = await updateProfile({
      full_name: form.fullName.trim() || undefined,
      birthdate: form.dob || undefined,
      country: form.country || undefined,
      region: form.region.trim() || undefined,
      income_level: form.income || undefined,
      investment_experience: form.experience || undefined,
      investment_goal: form.goal || undefined,
      onboarded: true,
    })
    setSaving(false)
    if (result.error) {
      toast(result.error, 'error')
      return
    }
    toast(mode === 'onboarding' ? 'Profile saved. Next, pick your platform.' : 'Profile updated.', 'success')
    onDone()
  }

  const confirmDelete = async () => {
    setDeleting(true)
    const result = await deleteAccount()
    if (result.error) {
      setDeleting(false)
      setConfirmingDelete(false)
      toast(result.error, 'error')
      return
    }
    toast('Your account has been deleted.', 'success')
  }

  const initials = (form.fullName || session?.user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="profile-page">
      <header className="profile-head">
        <span className="profile-head__eyebrow">{mode === 'onboarding' ? 'Welcome aboard' : 'Your account'}</span>
        <h2>{mode === 'onboarding' ? 'Complete your profile' : 'Edit profile'}</h2>
        <p>
          {mode === 'onboarding'
            ? 'A few details so we can tailor things to you. Required fields are marked, and you can skip the rest.'
            : session?.user.email}
        </p>
      </header>

      <div className="profile-grid">
        <nav className="profile-tabs" aria-label="Profile sections">
          {TABS.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              className={`profile-tab ${active === index ? 'is-active' : ''} ${statusClass(tab)}`}
              onClick={() => setActive(index)}
            >
              <span className="profile-tab__dot" aria-hidden="true" />
              <span className="profile-tab__label">{tab.label}</span>
              {tab.required && <span className="profile-tab__req">Required</span>}
            </button>
          ))}
          <button
            type="button"
            className={`profile-tab is-preview ${onPreview ? 'is-active' : ''}`}
            onClick={() => setActive(previewIndex)}
          >
            <span className="profile-tab__dot" aria-hidden="true" />
            <span className="profile-tab__label">Preview</span>
          </button>
        </nav>

        <section className="profile-panel">
          {!onPreview && (
            <div className="profile-field">
              <h3>{TABS[active].label}</h3>

              {TABS[active].key === 'fullName' && (
                <label className="profile-input">
                  <span>Your full name</span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Jane Doe"
                    value={form.fullName}
                    onChange={(event) => set('fullName', event.target.value)}
                  />
                </label>
              )}

              {TABS[active].key === 'photo' && (
                <div className="profile-photo">
                  <div className="profile-avatar" aria-hidden="true">
                    {avatar ? <img src={avatar} alt="" /> : <span>{initials}</span>}
                  </div>
                  <div className="profile-photo__actions">
                    <label className="profile-file">
                      {avatar ? 'Change photo' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onPickPhoto(event.target.files?.[0])}
                      />
                    </label>
                    {avatar && (
                      <button type="button" className="profile-remove" onClick={() => setAvatar('')}>
                        Remove
                      </button>
                    )}
                    <p className="profile-hint">Square works best. Stored on this device only.</p>
                  </div>
                </div>
              )}

              {TABS[active].key === 'dob' && (
                <label className="profile-input">
                  <span>Date of birth</span>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.dob}
                    onChange={(event) => set('dob', event.target.value)}
                  />
                </label>
              )}

              {TABS[active].key === 'country' && (
                <label className="profile-input">
                  <span>Country</span>
                  <select value={form.country} onChange={(event) => set('country', event.target.value)}>
                    <option value="">Select your country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {TABS[active].key === 'region' && (
                <label className="profile-input">
                  <span>State or region</span>
                  <input
                    type="text"
                    placeholder="e.g. California"
                    value={form.region}
                    onChange={(event) => set('region', event.target.value)}
                  />
                </label>
              )}

              {TABS[active].key === 'income' && (
                <label className="profile-input">
                  <span>Your exact annual income</span>
                  <div className="profile-money">
                    <span className="profile-money__prefix" aria-hidden="true">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      placeholder="85000"
                      value={form.income}
                      onChange={(event) => set('income', event.target.value)}
                    />
                  </div>
                </label>
              )}

              {TABS[active].key === 'experience' && (
                <label className="profile-input">
                  <span>How much investing experience do you have?</span>
                  <select value={form.experience} onChange={(event) => set('experience', event.target.value)}>
                    <option value="">Select one</option>
                    {EXPERIENCE.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {TABS[active].key === 'goal' && (
                <label className="profile-input">
                  <span>What brings you here?</span>
                  <select value={form.goal} onChange={(event) => set('goal', event.target.value)}>
                    <option value="">Select one</option>
                    {GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="profile-field__nav">
                {active > 0 && (
                  <button type="button" className="profile-ghost" onClick={() => setActive(active - 1)}>
                    ← Back
                  </button>
                )}
                <button type="button" className="profile-next" onClick={() => setActive(active + 1)}>
                  {active === TABS.length - 1 ? 'Preview →' : 'Next →'}
                </button>
              </div>
            </div>
          )}

          {onPreview && (
            <div className="profile-preview">
              <h3>Review your profile</h3>
              <div className="profile-preview__card">
                <div className="profile-avatar profile-avatar--lg" aria-hidden="true">
                  {avatar ? <img src={avatar} alt="" /> : <span>{initials}</span>}
                </div>
                <dl className="profile-summary">
                  {TABS.filter((tab) => tab.key !== 'photo').map((tab) => (
                    <div key={tab.key} className={isComplete(tab.key) ? '' : 'is-empty'}>
                      <dt>{tab.label}</dt>
                      <dd>{displayValue(tab.key) || (tab.required ? 'Required, not set' : 'Not provided')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {!requiredDone && (
                <p className="profile-warn">Some required fields are still empty. They are highlighted in red.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="profile-footer">
        <div className="profile-legend" aria-hidden="true">
          <span className="dot is-done" /> Done
          <span className="dot is-required" /> Required
          <span className="dot is-optional" /> Optional
        </div>
        <div className="profile-actions">
          {onCancel && (
            <button type="button" className="profile-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="button" className="profile-save" disabled={saving || !requiredDone} onClick={save}>
            {saving ? 'Saving…' : mode === 'onboarding' ? 'Save and continue' : 'Save changes'}
          </button>
        </div>
      </footer>

      {mode === 'edit' && (
        <div className="profile-danger">
          <span className="profile-danger__label">Danger zone</span>
          <button type="button" className="danger-link" onClick={() => setConfirmingDelete(true)}>
            Delete account permanently
          </button>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete account?"
          message="This permanently deletes your account and all saved portfolios, course progress, and certificates. This cannot be undone."
          confirmLabel="Delete permanently"
          cancelLabel="Keep account"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
