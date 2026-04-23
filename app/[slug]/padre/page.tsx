'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { BookOpen, FolderOpen, CalendarDays, Bell } from 'lucide-react'

export default function PadreDashboardPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user?.displayName?.split(' ')[0] ?? 'Familia'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
        </div>
        <button className="relative p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-500" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          />
        </button>
      </div>

      {/* Selector hijo */}
      <div className="card p-4 flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          —
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Mis hijos</p>
          <p className="text-xs text-gray-400">No hay alumnos vinculados aún</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { icon: BookOpen, label: 'Comunicaciones recientes', desc: 'No hay notas nuevas', emoji: '📚' },
          { icon: FolderOpen, label: 'Archivos pendientes', desc: 'No hay solicitudes pendientes', emoji: '📁' },
          { icon: CalendarDays, label: 'Próximos eventos', desc: 'No hay eventos próximos', emoji: '📅' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{card.emoji}</span>
                <h2 className="font-semibold text-gray-900 text-sm">{card.label}</h2>
              </div>
              <p className="text-sm text-gray-400 text-center py-4">{card.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
