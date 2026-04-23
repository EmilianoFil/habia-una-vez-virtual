'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleBasePath } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

/**
 * Ruta raíz del tenant /[slug]
 * - Si no hay sesión → /[slug]/login
 * - Si hay sesión → /[slug]/[rol] (dashboard correspondiente)
 */
export default function TenantIndexPage() {
  const { user, claims, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    if (loading) return
    if (!user || !claims) {
      router.replace(`/${slug}/login`)
    } else {
      router.replace(getRoleBasePath(slug, claims.role))
    }
  }, [loading, user, claims, router, slug])

  return <LoadingScreen />
}
