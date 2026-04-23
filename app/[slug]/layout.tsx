import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug, isValidSlug } from '@/lib/tenant'
import { ThemeWrapper } from '@/components/ui/ThemeWrapper'

// ============================================================
// [slug]/layout.tsx — Tenant Layout (Server Component)
//
// Responsabilidades:
// 1. Valida el formato del slug
// 2. Resuelve el tenant desde Firestore (server-side)
// 3. Retorna 404 si no existe
// 4. Aplica el branding dinámico via ThemeWrapper
// 5. Provee el TenantContext a todos los hijos
// ============================================================

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

// Metadatos dinámicos según el tenant
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params

  if (!isValidSlug(slug)) return { title: 'Institución no encontrada' }

  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: 'Institución no encontrada' }

  return {
    title: {
      template: `%s | ${tenant.name}`,
      default: tenant.name,
    },
    description: `Portal digital de ${tenant.name}`,
    // Los metadatos del manifest (PWA) heredan del root layout
  }
}

export default async function TenantLayout({ children, params }: Props) {
  const { slug } = params

  // 1. Validar formato del slug antes de ir a Firestore
  if (!isValidSlug(slug)) {
    notFound()
  }

  // 2. Resolver tenant desde Firestore (server-side)
  const tenant = await getTenantBySlug(slug)

  // 3. Si no existe → 404
  if (!tenant) {
    notFound()
  }

  // 4. Renderizar con branding aplicado
  return (
    <ThemeWrapper tenant={tenant}>
      {children}
    </ThemeWrapper>
  )
}
