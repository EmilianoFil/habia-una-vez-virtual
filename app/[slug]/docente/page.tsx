'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DoorOpen, BookOpen, ClipboardList, Bell } from 'lucide-react'

export default function DocenteDashboardPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saludo}, {user?.displayName?.split(' ')[0] ?? 'Docente'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
        </div>
        <button className="relative p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: DoorOpen, label: 'Mis salas asignadas', value: '—', desc: 'Turno asignado' },
          { icon: BookOpen, label: 'Notas publicadas', value: '—', desc: 'Este mes' },
          { icon: ClipboardList, label: 'Asistencia pendiente', value: '—', desc: 'Hoy' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary-10)' }}
              >
                <Icon size={22} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
                <p className="text-xs text-gray-400">{card.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Mis salas</h2>
        <div className="text-sm text-gray-400 text-center py-8">
          No hay salas asignadas aún
        </div>
      </div>
    </div>
  )
}
