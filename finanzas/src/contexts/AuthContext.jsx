import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEMO_USER } from '../lib/demoData'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('wally_demo') === '1') {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => {
    localStorage.removeItem('wally_demo')
    setUser(null)
    return supabase.auth.signOut()
  }

  const loginDemo = () => {
    localStorage.setItem('wally_demo', '1')
    setUser(DEMO_USER)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, loginDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export const isDemo = (user) => user?.id === 'demo'
