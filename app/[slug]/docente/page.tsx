'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { useAuth as useAuthCtx } from '@/contexts/AuthContext'
import { DoorOpen, BookOpen, ClipboardList, Bell, Loader2 } from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import Link from 'next/link'

export default function DocenteDashboardPage() {
  const { user, claims } = useAuth()
  const { tenant } = useTenant()
  const { salas: todasLasSalas, loading } = useSalas(tenant.id)

  const salas = claims?.scope === 'institucion'
    ? todasLasSalas
    : todasLasSalas.filter(s => s.docenteIds?.includes(user?.uid ?? ''))
  
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saludo}, {user?.displayName?.split(' ')[0] ?? 'Docente'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {[
          { icon: DoorOpen, label: 'Mis salas asignadas', value: loading ? <Loader2 size={16} className="animate-spin"/> : salas.length, desc: 'Activas' },
          { icon: BookOpen, label: 'Accesos rápidos', value: '→', desc: 'Cuaderno / Asistencia', href: true },
        ].map((card) => {
          const Icon = card.icon
          const Component = card.href ? Link : 'div'
          const props = card.href ? { href: `/${tenant.slug}/docente`, className: "card p-5 flex items-center gap-4 hover:shadow-md transition-all" } : { className: "card p-5 flex items-center gap-4" }
          
          return (
            <Component key={card.label} {...props as any}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary-10)' }}
              >
                <Icon size={22} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 flex items-center h-8">{card.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
                <p className="text-xs text-gray-400">{card.desc}</p>
              </div>
            </Component>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Mis salas</h2>
        {loading ? (
          <SkeletonGrid count={3} cols="grid-cols-1 md:grid-cols-3" />
        ) : salas.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No hay salas asignadas aún
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {salas.map(s => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{s.nombre}</h3>
                  <p className="text-xs text-gray-500">{s.nivel}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-gray-800">{s.alumnoIds?.length ?? 0}</span>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Alumnos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
