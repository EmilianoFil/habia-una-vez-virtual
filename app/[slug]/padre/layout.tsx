'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'

export default function PadreLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['padre']}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  )
}
