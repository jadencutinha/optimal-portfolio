import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthState {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<{ error?: string }>
  updateProfile: (updates: {
    full_name?: string
    username?: string
    birthdate?: string
  }) => Promise<{ error?: string }>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
