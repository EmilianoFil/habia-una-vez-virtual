'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['docente']}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  )
}
