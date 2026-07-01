import { useCallback, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type ToastKind, type ToastMessage } from './context'

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = (idRef.current += 1)
      setToasts((current) => [...current, { id, message, kind }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((item) => (
            <div key={item.id} className={`toast toast-${item.kind}`} role="status">
              <span className="toast-icon">{ICONS[item.kind]}</span>
              <span className="toast-message">{item.message}</span>
              <button type="button" className="toast-close" onClick={() => dismiss(item.id)} aria-label="Dismiss">
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
