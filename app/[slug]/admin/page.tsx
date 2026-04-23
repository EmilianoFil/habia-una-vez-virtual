'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import {
  Users, DoorOpen, GraduationCap, BookOpen,
  FolderOpen, ClipboardList, TrendingUp, Bell
} from 'lucide-react'

const statCards = [
  { icon: Users, label: 'Alumnos activos', value: '—', color: '#6366f1' },
  { icon: DoorOpen, label: 'Salas', value: '—', color: '#ec4899' },
  { icon: GraduationCap, label: 'Docentes', value: '—', color: '#10b981' },
  { icon: BookOpen, label: 'Notas este mes', value: '—', color: '#f59e0b' },
  { icon: FolderOpen, label: 'Archivos pendientes', value: '—', color: '#ef4444' },
  { icon: ClipboardList, label: 'Presentes hoy', value: '—', color: '#3b82f6' },
]

export default function AdminDashboardPage() {
  const { claims, user } = useAuth()
  const { tenant } = useTenant()
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saludo}, {user?.displayName?.split(' ')[0] ?? 'Admin'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Panel de administración — {tenant.name}
          </p>
        </div>
        <button className="relative p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-500" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-gray-900">Acciones rápidas</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Nueva nota', emoji: '📝', href: 'admin/cuaderno/nueva' },
            { label: 'Tomar asistencia', emoji: '✅', href: 'admin/asistencia' },
            { label: 'Subir archivo', emoji: '📁', href: 'admin/archivos' },
            { label: 'Crear evento', emoji: '📅', href: 'admin/calendario' },
          ].map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all text-center group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {action.emoji}
              </span>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder notice */}
      <div
        className="mt-6 p-4 rounded-xl border text-sm"
        style={{
          backgroundColor: 'var(--color-primary-10)',
          borderColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
        }}
      >
        Los datos reales se cargarán cuando se implementen los módulos (Paso 3 en adelante).
      </div>
    </div>
  )
}
