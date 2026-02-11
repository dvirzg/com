import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const isAdmin = useCallback(() => {
    return user?.user_metadata?.is_admin === true
  }, [user])

  const isProfileComplete = useCallback(() => {
    return user?.user_metadata?.profile_complete === true
  }, [user])

  const getFirstName = useCallback(() => {
    if (!user) return 'Guest'
    return user.user_metadata?.name || user.user_metadata?.full_name?.split(' ')[0] || 'Guest'
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    signOut,
    isAdmin,
    isProfileComplete,
    getFirstName
  }), [user, loading, signOut, isAdmin, isProfileComplete, getFirstName])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
