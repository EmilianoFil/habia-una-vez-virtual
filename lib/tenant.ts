import { adminDb } from '@/lib/firebase-admin'
import { TenantConfig } from '@/lib/types'

/**
 * En desarrollo sin credenciales Admin, devuelve un tenant simulado.
 * Útil para diseñar UI sin necesitar Firebase Admin configurado.
 */
function getMockTenant(slug: string): TenantConfig {
  const mockTenants: Record<string, Partial<TenantConfig>> = {
    demo: {
      name: 'Jardín Demo',
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
    },
    jardin: {
      name: 'Jardín de Infantes',
      primaryColor: '#10b981',
      secondaryColor: '#f59e0b',
    },
  }

  const mock = mockTenants[slug] ?? {}
  return {
    id: `mock-${slug}`,
    name: mock.name ?? `Institución ${slug}`,
    slug,
    logo: null,
    primaryColor: mock.primaryColor ?? '#4f46e5',
    secondaryColor: mock.secondaryColor ?? '#ec4899',
  }
}

/**
 * Busca un tenant por su slug en Firestore (server-side).
 * Retorna null si no existe, y un mock en desarrollo sin credenciales.
 */
export async function getTenantBySlug(slug: string): Promise<TenantConfig | null> {
  // Modo desarrollo sin credenciales: devolver mock
  const hasAdminCredentials =
    !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (!!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY)

  if (process.env.NODE_ENV === 'development' && !hasAdminCredentials) {
    console.warn(`[Tenant] Sin credenciales Admin. Usando mock para slug: "${slug}"`)
    // En desarrollo, cualquier slug es válido. Cambiar a null para testear 404.
    return getMockTenant(slug)
  }

  try {
    const snapshot = await adminDb
      .collection('tenants')
      .where('config.slug', '==', slug)
      .where('active', '==', true)
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()

    return {
      id: doc.id,
      ...data.config,
    } as TenantConfig
  } catch (error) {
    console.error('[Tenant] Error al buscar tenant:', error)

    // En dev, fallback a mock si hay error de credenciales
    if (process.env.NODE_ENV === 'development') {
      return getMockTenant(slug)
    }

    return null
  }
}

/**
 * Valida que un slug tenga formato correcto.
 * Solo letras minúsculas, números y guiones. Mín 2, Máx 50 caracteres.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,50}$/.test(slug)
}

/**
 * Genera un slug a partir de un nombre de institución.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}
