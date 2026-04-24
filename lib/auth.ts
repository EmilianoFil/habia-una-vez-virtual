import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  getIdTokenResult,
  User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { UserRole } from '@/lib/types'

// ============================================================
// Tipos de Auth
// ============================================================

export interface UserClaims {
  role: UserRole
  tenantId?: string // undefined para superadmin
  uid: string
  email: string | null
}

// ============================================================
// Helpers de redirección
// ============================================================

/** Devuelve el path base del dashboard según rol */
export function getRoleBasePath(slug: string, role: UserRole): string {
  if (role === 'superadmin') {
    return slug ? `/${slug}/admin` : '/superadmin'
  }

  switch (role) {
    case 'admin':
      return `/${slug}/admin`
    case 'docente':
      return `/${slug}/docente`
    case 'padre':
      return `/${slug}/padre`
    default:
      return `/${slug}/login`
  }
}

// ============================================================
// Funciones de Auth
// ============================================================

/** Obtiene los custom claims del ID token de Firebase */
export async function getUserClaims(user: User, forceRefresh = false): Promise<UserClaims | null> {
  try {
    const tokenResult = await getIdTokenResult(user, forceRefresh)
    const claims = tokenResult.claims
    if (!claims.role) return null
    return {
      role: claims.role as UserRole,
      tenantId: claims.tenantId as string | undefined,
      uid: user.uid,
      email: user.email,
    }
  } catch (error) {
    console.error('[Auth] Error obteniendo claims:', error)
    return null
  }
}

/** Crea la session cookie en el servidor via API */
export async function createSessionCookie(user: User): Promise<boolean> {
  try {
    const idToken = await user.getIdToken()
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    
    if (!response.ok) {
      const respData = await response.json().catch(() => ({}))
      throw new Error(respData.error || 'No se pudo verificar la sesión en el servidor.')
    }
    
    return true
  } catch (error) {
    console.error('[Auth] Error creando sesión:', error)
    throw error // Lanzar expícitamente para que la UI pare de cargar
  }
}

/** Sign out: limpia cookie de sesión y desloguea de Firebase */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' })
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('[Auth] Error cerrando sesión:', error)
    throw error
  }
}

/** Login con email y contraseña */
export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

/** Login con Google */
export const googleProvider = new GoogleAuthProvider()
export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

/** Mensajes de error de Firebase en español */
export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese email.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intentá más tarde.',
    'auth/user-disabled': 'Esta cuenta fue desactivada.',
    'auth/email-already-in-use': 'Ese email ya está registrado.',
    'auth/invalid-email': 'El email ingresado no es válido.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar.',
    'auth/network-request-failed': 'Error de conexión. Verificá tu internet.',
  }
  return messages[code] ?? 'Ocurrió un error inesperado. Intentá de nuevo.'
}
