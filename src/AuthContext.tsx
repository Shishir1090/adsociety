
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, role: 'society' | 'brand') => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(
    email: string,
    password: string,
    role: 'society' | 'brand',
  ) {
    if (!supabase) {
      return { error: 'Supabase is not configured. Check your environment settings.' }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    })

    return { error: error?.message ?? null }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return { error: 'Supabase is not configured. Check your environment settings.' }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error: error?.message ?? null }
  }

  async function signOut() {
    if (!supabase) {
      return { error: 'Supabase is not configured. Check your environment settings.' }
    }

    const { error } = await supabase.auth.signOut()
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
