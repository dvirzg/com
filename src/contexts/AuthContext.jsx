import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = () => {
    return user?.user_metadata?.is_admin === true
  }

  const isProfileComplete = () => {
    return user?.user_metadata?.profile_complete === true
  }

  const getFirstName = () => {
    if (!user) return 'Guest'
    return user.user_metadata?.name || user.user_metadata?.full_name?.split(' ')[0] || 'Guest'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin, isProfileComplete, getFirstName }}>
      {children}
    </AuthContext.Provider>
  )
}
