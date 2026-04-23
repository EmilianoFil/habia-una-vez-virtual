'use client'

import { useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useAsistenciaDia } from '@/hooks/useAsistencia'
import { saveAsistenciaDia } from '@/lib/services/asistencia.service'
import { AsistenciaTable } from '@/components/asistencia/AsistenciaTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RegistroAsistenciaAlumno } from '@/lib/types'

function getTodayStr() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset*60*1000))
  return localDate.toISOString().split('T')[0]
}

export default function AdminAsistenciaPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { salas, loading: salasLoading } = useSalas(tenant.id)

  const [salaSeleccionada, setSalaSeleccionada] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string>(getTodayStr())

  const salaId = salaSeleccionada ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaId) ?? null

  const { alumnos, loading: alumnosLoading } = useAlumnos(tenant.id, salaId)
  const { asistencia, loading: asistenciaLoading } = useAsistenciaDia(tenant.id, salaId, fecha)

  async function handleSave(registros: Record<string, RegistroAsistenciaAlumno>) {
    if (!salaId || !user) return
    await saveAsistenciaDia(tenant.id, salaId, fecha, {
      registros,
      registradaPorId: user.uid,
      registradaPorNombre: user.displayName ?? user.email ?? 'Admin',
    })
  }

  const isLoading = salasLoading || alumnosLoading || asistenciaLoading

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Asistencia"
        descripcion="Visualizar o modificar la asistencia general"
      >
        <div className="relative">
          <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            max={getTodayStr()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input pl-9 py-2 text-sm max-w-[150px]"
          />
        </div>
      </PageHeader>

      {/* Tabs de salas */}
      {salasLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : salas.length === 0 ? (
        <EmptyState
          icon="🏫"
          titulo="Aún no hay salas"
          descripcion="Para ver la asistencia, creá salas y agregá alumnos en la sección Salas."
        />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {salas.map((s) => (
              <button
                key={s.id}
                onClick={() => setSalaSeleccionada(s.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  (salaId === s.id)
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                      }
                    : {
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                      }
                }
              >
                <span>{s.nombre}</span>
              </button>
            ))}
          </div>

          {!isLoading && asistencia && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700 flex items-center gap-2 max-w-3xl">
              <span className="font-semibold">Última actualización:</span> 
              {asistencia.registradaPorNombre} a las {asistencia.actualizadaEn ? new Date(asistencia.actualizadaEn.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : alumnos.length === 0 ? (
            <EmptyState
              icon="🎒"
              titulo="Sala vacía"
              descripcion="No hay alumnos en esta sala."
            />
          ) : (
            <div className="max-w-3xl">
              <AsistenciaTable
                alumnos={alumnos}
                asistenciaActual={asistencia?.registros ?? null}
                onSave={handleSave}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
