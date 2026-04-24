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
  createSessionCookie,
  logout as authLogout,
  getUserClaims,
  UserClaims,
} from '@/lib/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
      try {
        if (firebaseUser) {
          const userClaims = await getUserClaims(firebaseUser)
          setUser(firebaseUser)
          setClaims(userClaims)

          // En producción, Firebase Hosting elimina __claims, pero deja __session (que es httpOnly)
          // Usamos una variable de estado o localStorage para no re-crear sesión mil veces si falla
          const lastSessionUid = localStorage.getItem('last_session_uid')
          if (lastSessionUid !== firebaseUser.uid) {
            try {
              await createSessionCookie(firebaseUser)
              localStorage.setItem('last_session_uid', firebaseUser.uid)

              // Registrar último ingreso si tenemos tenantId y rol
              if (userClaims?.tenantId) {
                const now = new Date().toISOString()
                if (userClaims.role === 'padre') {
                  const tutorRef = doc(db, `tenants/${userClaims.tenantId}/tutores/${firebaseUser.uid}`)
                  await updateDoc(tutorRef, { lastLogin: now }).catch(() => {})
                } else if (userClaims.role === 'admin' || userClaims.role === 'docente') {
                  const docenteRef = doc(db, `tenants/${userClaims.tenantId}/docentes/${firebaseUser.uid}`)
                  await updateDoc(docenteRef, { 'acceso.lastLogin': now }).catch(() => {})
                }
              }
            } catch (e) {
              console.error('[AuthContext] No se pudo crear sesión segura:', e)
            }
          }
        } else {
          setUser(null)
          setClaims(null)
          localStorage.removeItem('last_session_uid')
        }
      } catch (err) {
        console.error('[AuthContext] Error en onAuthStateChanged:', err)
      } finally {
        setLoading(false)
      }
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
