'use client'

import { useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
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

export default function DocenteAsistenciaPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { salas, loading: salasLoading } = useSalas(tenant.id)

  const [salaId, setSalaId] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string>(getTodayStr())

  const salaActiva = salaId ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaActiva) ?? null

  const { alumnos, loading: alumnosLoading } = useAlumnos(tenant.id, salaActiva)
  const { asistencia, loading: asistenciaLoading } = useAsistenciaDia(tenant.id, salaActiva, fecha)

  async function handleSave(registros: Record<string, RegistroAsistenciaAlumno>) {
    if (!salaActiva || !user) return
    await saveAsistenciaDia(tenant.id, salaActiva, fecha, {
      registros,
      registradaPorId: user.uid,
      registradaPorNombre: user.displayName ?? user.email ?? 'Docente',
    })
  }

  const isLoading = salasLoading || alumnosLoading || asistenciaLoading

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Asistencia"
        descripcion="Registro diario de alumnos"
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

      {salas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {salas.map((s) => (
            <button
              key={s.id}
              onClick={() => setSalaId(s.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                salaActiva === s.id
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <SkeletonList count={5} />
      ) : salas.length === 0 ? (
        <EmptyState
          icon="🎒"
          titulo="Sin salas asignadas"
          descripcion="Aún no tenés salas asignadas para tomar asistencia."
        />
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
    </div>
  )
}
