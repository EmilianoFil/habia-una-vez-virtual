'use client'

import { ReactNode, CSSProperties } from 'react'
import { TenantConfig } from '@/lib/types'
import { TenantProvider } from '@/contexts/TenantContext'
import { textColorForBackground } from '@/lib/utils'

interface ThemeWrapperProps {
  children: ReactNode
  tenant: TenantConfig
}

/**
 * ThemeWrapper — client component que:
 * 1. Aplica las CSS variables del tenant via inline styles (sin flash de FOUC)
 * 2. Provee el TenantContext a todos los hijos
 *
 * Se monta en el [slug]/layout.tsx como hijo del Server Component.
 */
export function ThemeWrapper({ children, tenant }: ThemeWrapperProps) {
  const isLight = textColorForBackground(tenant.primaryColor) === 'dark'
  
  const cssVars = {
    '--color-primary': tenant.primaryColor,
    '--color-primary-light': `color-mix(in srgb, ${tenant.primaryColor} 25%, white)`,
    '--color-primary-dark': `color-mix(in srgb, ${tenant.primaryColor} 80%, black)`,
    '--color-primary-contrast': isLight ? '#000000' : '#ffffff',
    '--color-secondary': tenant.secondaryColor,
    '--color-secondary-light': `color-mix(in srgb, ${tenant.secondaryColor} 25%, white)`,
    '--color-secondary-dark': `color-mix(in srgb, ${tenant.secondaryColor} 80%, black)`,
    '--color-primary-10': `color-mix(in srgb, ${tenant.primaryColor} 10%, transparent)`,
    '--color-primary-20': `color-mix(in srgb, ${tenant.primaryColor} 20%, transparent)`,
  } as CSSProperties

  return (
    <TenantProvider tenant={tenant}>
      <div style={cssVars} className="min-h-screen bg-gray-50">
        {children}
      </div>
    </TenantProvider>
  )
}
