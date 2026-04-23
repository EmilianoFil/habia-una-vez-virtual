'use client'

import { createContext, useContext, ReactNode } from 'react'
import { TenantConfig } from '@/lib/types'

// ============================================================
// Tenant Context — disponible para todos los client components
// dentro de un [slug] layout
// ============================================================

interface TenantContextValue {
  tenant: TenantConfig
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode
  tenant: TenantConfig
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Hook para acceder a los datos del tenant desde cualquier client component.
 * Lanza un error si se usa fuera de un TenantProvider (fuera de [slug] routes).
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('[useTenant] Debe usarse dentro de un TenantProvider — ruta [slug]')
  }
  return context
}

export { TenantContext }
