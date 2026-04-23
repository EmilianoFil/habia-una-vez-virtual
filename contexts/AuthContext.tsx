'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  UserClaims,
  getUserClaims,
  createSessionCookie,
  logout as authLogout,
} from '@/lib/auth'

// ============================================================
// AuthContext — disponible para toda la app bajo TenantProvider
// ============================================================

interface AuthContextValue {
  user: User | null
  claims: UserClaims | null
  loading: boolean
  logout: () => Promise<void>
  refreshClaims: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<UserClaims | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userClaims = await getUserClaims(firebaseUser)
        setUser(firebaseUser)
        setClaims(userClaims)

        // Solo crear session cookie si no existe aún (evita llamada en cada page load)
        const hasSession = document.cookie.includes('__claims')
        if (!hasSession) {
          await createSessionCookie(firebaseUser)
        }
      } else {
        setUser(null)
        setClaims(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  /** Fuerza una actualización de claims (útil tras cambios de rol) */
  const refreshClaims = useCallback(async () => {
    if (!user) return
    const fresh = await getUserClaims(user, true) // forceRefresh = true
    setClaims(fresh)
    await createSessionCookie(user)
  }, [user])

  const handleLogout = useCallback(async () => {
    await authLogout()
    setUser(null)
    setClaims(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, claims, loading, logout: handleLogout, refreshClaims }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('[useAuth] Debe usarse dentro de AuthProvider')
  }
  return context
}
