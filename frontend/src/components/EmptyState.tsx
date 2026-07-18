import type { ReactNode } from 'react'

interface Props {
  icon?: string | null
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '✦', title, description, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__sky" aria-hidden="true" />
      {icon !== null && (
        <div className="empty-state__orb" aria-hidden="true">
          <span className="state-icon">{icon}</span>
        </div>
      )}
      <h3>{title}</h3>
      {description && <p className="muted">{description}</p>}
      {action}
    </div>
  )
}
