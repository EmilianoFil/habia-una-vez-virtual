'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useSolicitudes } from '@/hooks/useArchivos'
import { useEventos } from '@/hooks/useCalendario'
import { useNotasDeSala } from '@/hooks/useNotas'
import { BookOpen, FolderOpen, CalendarDays, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PadreDashboardPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()

  const { alumnos, loading: alumnosLoading } = useAlumnos(tenant.id)
  
  const misAlumnos = useMemo(
    () => alumnos.filter((a) => a.tutorIds?.includes(user?.uid ?? '__none__')),
    [alumnos, user?.uid]
  )

  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null)
  const alumnoActivo = misAlumnos.find((a) => a.id === alumnoSeleccionadoId) ?? misAlumnos[0] ?? null
  const salaIdActiva = alumnoActivo?.salaActualId ?? null

  const { solicitudes, loading: solicitudesLoading } = useSolicitudes(tenant.id, null, alumnoActivo?.id)
  const { eventos, loading: eventosLoading } = useEventos(tenant.id, salaIdActiva)
  const { notas, loading: notasLoading } = useNotasDeSala(tenant.id, salaIdActiva)

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const notasNoLeidas = notas.filter(
    (n) => !n.acusesRecibo?.some((a) => a.tutorId === user?.uid && a.alumnoId === alumnoActivo?.id)
  )
  const eventosFuturos = eventos.filter(e => new Date(e.fecha).getTime() >= new Date().setHours(0,0,0,0))

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user?.displayName?.split(' ')[0] ?? 'Familia'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
        </div>
      </div>

      {alumnosLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-300"/></div>
      ) : misAlumnos.length === 0 ? (
        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-3">👧</span>
          <h2 className="font-bold text-gray-900">Sin alumnos vinculados</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">Contactá al jardín para que vinculen tu cuenta con tus hijos y así puedas ver sus comunicaciones.</p>
        </div>
      ) : (
        <>
          {misAlumnos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
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
                  <img src={a.datosPersonales?.foto ?? ''} alt="" className="w-5 h-5 rounded-full object-cover bg-black/10" />
                  {a.datosPersonales?.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/${tenant.slug}/padre/comunicaciones`} className="card p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📚</span>
                <h2 className="font-semibold text-gray-900 text-sm">Comunicaciones</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {notasLoading ? <Loader2 size={14} className="animate-spin"/> : notasNoLeidas.length > 0 ? <span className="text-red-500 font-bold">{notasNoLeidas.length} sin leer</span> : 'Al día'}
                </p>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>

            <Link href={`/${tenant.slug}/padre/archivos`} className="card p-5 group hover:shadow-md transition-shadow focus:outline-none">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📁</span>
                <h2 className="font-semibold text-gray-900 text-sm">Documentación</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {solicitudesLoading ? <Loader2 size={14} className="animate-spin"/> : pendientes.length > 0 ? <span className="text-amber-500 font-bold">{pendientes.length} pendientes</span> : 'Todo entregado'}
                </p>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>

            <Link href={`/${tenant.slug}/padre/calendario`} className="card p-5 group hover:shadow-md transition-shadow focus:outline-none">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">📅</span>
                <h2 className="font-semibold text-gray-900 text-sm">Calendario</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {eventosLoading ? <Loader2 size={14} className="animate-spin"/> : eventosFuturos.length > 0 ? <span className="text-blue-500 font-bold">{eventosFuturos.length} próximos</span> : 'Sin eventos cerca'}
                </p>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
