'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/types'
import { getRoleBasePath } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface RoleGuardProps {
  requiredRoles: UserRole[]
  children: React.ReactNode
}

/**
 * RoleGuard — envuelve cualquier layout que requiera auth.
 * - Si no hay sesión → redirige a /[slug]/login
 * - Si el rol no coincide → redirige al dashboard correcto
 * - Si está bien → renderiza hijos
 */
export function RoleGuard({ requiredRoles, children }: RoleGuardProps) {
  const { user, claims, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = (params?.slug as string) ?? ''

  useEffect(() => {
    if (loading) return

    // Sin usuario → login
    if (!user || !claims) {
      router.replace(slug ? `/${slug}/login` : '/superadmin/login')
      return
    }

    // Rol incorrecto → redirigir a su dashboard
    if (!requiredRoles.includes(claims.role)) {
      router.replace(getRoleBasePath(slug, claims.role))
    }
  }, [loading, user, claims, router, slug, requiredRoles])

  // Mientras carga o si hay redirección pendiente, mostrar spinner
  if (loading || !user || !claims || !requiredRoles.includes(claims.role)) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
