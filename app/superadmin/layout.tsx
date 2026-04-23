import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s | Superadmin', default: 'Panel Superadmin' },
}

// El superadmin no tiene tenant context
// Su auth lo maneja client-side via AuthProvider propio
export default function SuperadminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
