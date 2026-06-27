import type { User } from '@supabase/supabase-js'

export function displayName(user: User): string {
  const meta = user.user_metadata ?? {}
  const pick = (key: string): string | undefined => {
    const value = meta[key]
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
  }

  const username = pick('username')
  if (username) return username

  const given = pick('given_name') ?? pick('first_name')
  if (given) return given

  const full = pick('full_name') ?? pick('name')
  if (full) return full.split(' ')[0]

  if (user.email) return user.email.split('@')[0]
  return 'there'
}
