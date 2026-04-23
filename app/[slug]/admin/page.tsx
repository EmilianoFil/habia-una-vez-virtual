'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useDocentes } from '@/hooks/useDocentes'
import {
  Users, DoorOpen, GraduationCap, Copy,
  TrendingUp, Bell, Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  
  const { salas, loading: salasLoading } = useSalas(tenant.id)
  const { alumnos, loading: alLoading } = useAlumnos(tenant.id)
  const { docentes, loading: docLoading } = useDocentes(tenant.id)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const statCards = [
    { icon: Users, label: 'Alumnos', value: alLoading ? <Loader2 size={16} className="animate-spin"/> : alumnos.length, color: '#6366f1' },
    { icon: DoorOpen, label: 'Salas', value: salasLoading ? <Loader2 size={16} className="animate-spin"/> : salas.length, color: '#ec4899' },
    { icon: GraduationCap, label: 'Docentes', value: docLoading ? <Loader2 size={16} className="animate-spin"/> : docentes.length, color: '#10b981' },
  ]

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saludo}, {user?.displayName?.split(' ')[0] ?? 'Admin'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Panel general de la institución</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${card.color}18` }}
              >
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900 flex items-center h-8">{card.value}</p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-gray-900">Accesos directos</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Publicar nota', emoji: '📝', href: 'cuaderno' },
            { label: 'Pedir archivo', emoji: '📂', href: 'archivos' },
            { label: 'Tomar asistencia', emoji: '✋', href: 'asistencia' },
            { label: 'Agendar evento', emoji: '📅', href: 'calendario' },
          ].map((action) => (
            <Link
              key={action.label}
              href={`/${tenant.slug}/admin/${action.href}`}
              className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-center"
            >
              <span className="text-2xl mb-1">{action.emoji}</span>
              <span className="text-xs font-semibold text-gray-600">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
