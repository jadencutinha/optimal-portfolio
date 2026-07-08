import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isAxiosError } from 'axios'
import { supabase } from '../lib/supabase'
import { apiClient } from '../api/client'
import { AuthContext, type AuthState } from './context'

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Check your connection and try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      signIn: async (email, password) => {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          return { error: error?.message }
        } catch (error) {
          return { error: messageFrom(error) }
        }
      },
      signUp: async (email, password, username) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: username ? { username } : undefined,
              emailRedirectTo: window.location.origin,
            },
          })
          return { error: error?.message, needsConfirmation: Boolean(data.user && !data.session) }
        } catch (error) {
          return { error: messageFrom(error) }
        }
      },
      signInWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          })
          return { error: error?.message }
        } catch (error) {
          return { error: messageFrom(error) }
        }
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
      deleteAccount: async () => {
        try {
          await apiClient.delete('/api/me')
        } catch (error) {
          if (isAxiosError(error)) {
            const detail = (error.response?.data as { detail?: string } | undefined)?.detail
            return { error: detail || 'Could not delete your account. Please try again.' }
          }
          return { error: messageFrom(error) }
        }
        await supabase.auth.signOut()
        return {}
      },
      updateProfile: async (updates) => {
        const { error } = await supabase.auth.updateUser({ data: updates })
        return { error: error?.message }
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
