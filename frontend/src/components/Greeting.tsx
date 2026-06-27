import { useAuth } from '../auth/useAuth'
import { displayName } from '../lib/displayName'

export function Greeting() {
  const { session } = useAuth()
  if (!session) return null
  return <h2 className="greeting">Hello, {displayName(session.user)}</h2>
}
