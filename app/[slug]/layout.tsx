import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTenantBySlug, isValidSlug } from '@/lib/tenant'
import { ThemeWrapper } from '@/components/ui/ThemeWrapper'
import { AuthProvider } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params
  if (!isValidSlug(slug)) return { title: 'Institución no encontrada' }
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return { title: 'Institución no encontrada' }
  return {
    title: { template: `%s | ${tenant.name}`, default: tenant.name },
    description: `Portal digital de ${tenant.name}`,
  }
}

export default async function TenantLayout({ children, params }: Props) {
  const { slug } = params

  if (!isValidSlug(slug)) notFound()

  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  return (
    <ThemeWrapper tenant={tenant}>
      {/* AuthProvider es client component, vive dentro del ThemeWrapper */}
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeWrapper>
  )
}
