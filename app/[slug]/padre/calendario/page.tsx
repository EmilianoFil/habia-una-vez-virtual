'use client'

import { useState, useMemo } from 'react'
import { CalendarHeart, Loader2, Users, HelpCircle } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useEventos } from '@/hooks/useCalendario'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useSalas } from '@/hooks/useSalas'
import { Evento } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function PadreCalendarioPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { alumnos, loading: alumnosLoading } = useAlumnos(tenant.id)
  const { salas, loading: salasLoading } = useSalas(tenant.id)

  const misAlumnos = useMemo(
    () => alumnos.filter((a) => a.tutorIds?.includes(user?.uid ?? '__none__')),
    [alumnos, user?.uid]
  )

  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null)
  const alumnoActivo = misAlumnos.find((a) => a.id === alumnoSeleccionadoId) ?? misAlumnos[0] ?? null
  const salaIdActiva = alumnoActivo?.salaActualId ?? null

  const { eventos, loading: eventosLoading } = useEventos(tenant.id, salaIdActiva)

  const isLoading = alumnosLoading || eventosLoading || salasLoading

  if (!isLoading && misAlumnos.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon="👧"
          titulo="Sin hijos vinculados"
          descripcion="Tu cuenta aún no tiene alumnos vinculados. Contactá a la institución."
        />
      </div>
    )
  }

  // Agrupación
  const eventosFuturos = eventos.filter(e => new Date(e.fecha).getTime() >= new Date().setHours(0,0,0,0))
  const eventosPasados = eventos.filter(e => new Date(e.fecha).getTime() < new Date().setHours(0,0,0,0))

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative max-w-4xl">
      <PageHeader
        titulo="Calendario"
        descripcion="Eventos e información importante"
      />

      {misAlumnos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {misAlumnos.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlumnoSeleccionadoId(a.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                alumnoActivo?.id === a.id
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {a.datosPersonales?.nombre}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : eventosFuturos.length === 0 && eventosPasados.length === 0 ? (
        <EmptyState
          icon="📅"
          titulo="Sin eventos a la vista"
          descripcion="Por el momento no hay eventos agendados para esta sala."
        />
      ) : (
        <div className="space-y-8">
          {eventosFuturos.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <CalendarHeart size={16} /> Próximamente
              </h2>
              <div className="space-y-3">
                {eventosFuturos.map((ev) => (
                  <EventRow key={ev.id} ev={ev} salas={salas} />
                ))}
              </div>
            </div>
          )}

          {eventosPasados.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-10 mb-4 px-1 opacity-60">
                Anteriores
              </h2>
              <div className="space-y-3 opacity-60 grayscale-[50%]">
                {eventosPasados.map((ev) => (
                  <EventRow key={ev.id} ev={ev} salas={salas} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventRow({ ev, salas }: { ev: Evento, salas: any[] }) {
  const d = new Date(ev.fecha)
  const isInstitucion = ev.alcance.tipo === 'institucion'
  const salaNombre = salas.find(s => s.id === ev.alcance.salaId)?.nombre ?? 'Sala'

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden">
      <div className="flex flex-col items-center justify-center w-14 h-16 rounded-xl shrink-0 bg-gray-50 border border-gray-100">
        <span className="text-[10px] font-bold uppercase text-gray-400 leading-none mb-1">
          {d.toLocaleDateString('es-AR', { month: 'short' })}
        </span>
        <span className="text-xl font-black text-gray-800 leading-none">
          {d.getDate()}
        </span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-gray-900 text-base">{ev.nombre}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
            {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
          </span>
          {isInstitucion ? (
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 ml-1">
              General
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 ml-1">
              Específico {salaNombre}
            </span>
          )}
        </div>
        
        {ev.descripcion && (
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{ev.descripcion}</p>
        )}
      </div>

      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg" style={{ backgroundColor: isInstitucion ? 'var(--color-primary)' : '#f59e0b' }} />
    </div>
  )
}
