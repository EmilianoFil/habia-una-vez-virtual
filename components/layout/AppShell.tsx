'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  GraduationCap,
  BookOpen,
  FolderOpen,
  Megaphone,
  CalendarDays,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  School,
  ShieldCheck,
} from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

// ============================================================
// Definición de ítems de navegación por rol
// ============================================================

interface NavItem {
  icon: React.ElementType
  label: string
  href: string // relativo al slug, ej: "admin" → /[slug]/admin
}

function getNavItems(slug: string, role: UserRole): NavItem[] {
  const base = `/${slug}`
  if (role === 'admin') {
    return [
      { icon: LayoutDashboard, label: 'Panel', href: `${base}/admin` },
      { icon: Users, label: 'Alumnos', href: `${base}/admin/alumnos` },
      { icon: DoorOpen, label: 'Salas', href: `${base}/admin/salas` },
      { icon: ShieldCheck, label: 'Equipo & Accesos', href: `${base}/admin/equipo` },
      { icon: BookOpen, label: 'Cuaderno', href: `${base}/admin/cuaderno` },
      { icon: FolderOpen, label: 'Archivos', href: `${base}/admin/archivos` },
      { icon: Megaphone, label: 'Comunicados', href: `${base}/admin/comunicaciones` },
      { icon: CalendarDays, label: 'Calendario', href: `${base}/admin/calendario` },
      { icon: ClipboardList, label: 'Asistencia', href: `${base}/admin/asistencia` },
      { icon: Settings, label: 'Configuración', href: `${base}/admin/configuracion` },
    ]
  }
  if (role === 'docente') {
    return [
      { icon: DoorOpen, label: 'Mis Salas', href: `${base}/docente` },
      { icon: BookOpen, label: 'Cuaderno', href: `${base}/docente/cuaderno` },
      { icon: ClipboardList, label: 'Asistencia', href: `${base}/docente/asistencia` },
      { icon: FolderOpen, label: 'Archivos', href: `${base}/docente/archivos` },
    ]
  }
  if (role === 'padre') {
    return [
      { icon: LayoutDashboard, label: 'Inicio', href: `${base}/padre` },
      { icon: BookOpen, label: 'Comunicaciones', href: `${base}/padre/comunicaciones` },
      { icon: FolderOpen, label: 'Archivos', href: `${base}/padre/archivos` },
      { icon: CalendarDays, label: 'Calendario', href: `${base}/padre/calendario` },
    ]
  }
  return []
}

// Items visibles en el bottom nav mobile (max 4)
function getBottomNavItems(navItems: NavItem[]): NavItem[] {
  return navItems.slice(0, 4)
}

// ============================================================
// Sidebar — visible en desktop (lg+)
// ============================================================

function Sidebar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()
  const { tenant } = useTenant()
  const { user, claims, logout } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-gray-100 bg-white">
      {/* Logo / Nombre institución */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b border-gray-100"
        style={{ borderBottomColor: 'var(--color-primary-light)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)' }}
        >
          {tenant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
          ) : (
            tenant.name.charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{tenant.name}</p>
          <p className="text-xs text-gray-400 capitalize">{claims?.role}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-link group',
                isActive && 'active'
              )}
            >
              <Icon
                size={18}
                className="shrink-0 transition-transform group-hover:scale-110"
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="ml-auto opacity-50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          >
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {user?.displayName ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

// ============================================================
// Bottom Nav — visible en mobile (< lg)
// ============================================================

function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()
  const mobileItems = getBottomNavItems(navItems)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex">
        {mobileItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors"
              style={{
                color: isActive ? 'var(--color-primary)' : '#9ca3af',
              }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none truncate max-w-full px-1">
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================
// AppShell — wrapper principal para dashboards autenticados
// ============================================================

export function AppShell({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const slug = (params?.slug as string) ?? ''
  const { claims, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!claims) return null

  const navItems = getNavItems(slug, claims.role)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar navItems={navItems} />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        {children}
      </main>

      <BottomNav navItems={navItems} />
    </div>
  )
}
