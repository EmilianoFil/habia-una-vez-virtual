'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['admin', 'superadmin']}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  )
}
