import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  label?: string
  defaultValue?: string
  placeholder?: string
  submitLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function PromptModal({
  title,
  label = 'Name',
  defaultValue = '',
  placeholder,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = () => {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onCancel} aria-label="Close">
          ×
        </button>
        <h2>{title}</h2>
        <div className="modal-fields">
          <label>
            {label}
            <input
              autoFocus
              value={value}
              placeholder={placeholder}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
              }}
            />
          </label>
        </div>
        <button type="button" className="primary modal-submit" disabled={!value.trim()} onClick={submit}>
          {submitLabel}
        </button>
        <button type="button" className="modal-toggle" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  )
}
