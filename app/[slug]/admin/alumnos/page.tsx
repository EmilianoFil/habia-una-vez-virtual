'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Search, Filter } from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useSalas } from '@/hooks/useSalas'
import { PageHeader } from '@/components/ui/PageHeader'
import { TurnoBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getIniciales } from '@/lib/utils'
import { Alumno } from '@/lib/types'

export default function AlumnosPage() {
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const { alumnos, loading } = useAlumnos(tenant.id)
  const { salas } = useSalas(tenant.id)

  const [busqueda, setBusqueda] = useState('')
  const [filtroSala, setFiltroSala] = useState('')

  const alumnosFiltrados = useMemo(() => {
    let lista = alumnos
    if (filtroSala) lista = lista.filter((a) => a.salaActualId === filtroSala)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter((a) =>
        `${a.datosPersonales?.nombre} ${a.datosPersonales?.apellido}`.toLowerCase().includes(q) ||
        a.datosPersonales?.dni?.includes(q)
      )
    }
    return lista
  }, [alumnos, filtroSala, busqueda])

  function getSalaNombre(salaId: string | null): string {
    if (!salaId) return 'Sin sala'
    return salas.find((s) => s.id === salaId)?.nombre ?? 'Sin sala'
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Alumnos"
        descripcion={`${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''} activo${alumnos.length !== 1 ? 's' : ''}`}
        accion={{
          label: 'Nuevo alumno',
          onClick: () => router.push(`/${slug}/admin/alumnos/nuevo`),
          icon: Plus,
        }}
      >
        {/* Buscar */}
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar alumno o DNI..."
            className="input pl-9 py-2 text-sm w-56"
          />
        </div>

        {/* Filtro sala */}
        <div className="relative hidden sm:block">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filtroSala}
            onChange={(e) => setFiltroSala(e.target.value)}
            className="input pl-9 py-2 text-sm w-48 appearance-none"
          >
            <option value="">Todas las salas</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </PageHeader>

      {/* Buscar mobile */}
      <div className="sm:hidden mb-4 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar alumno..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <select
          value={filtroSala}
          onChange={(e) => setFiltroSala(e.target.value)}
          className="input py-2 text-sm"
        >
          <option value="">Todas las salas</option>
          {salas.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
        </select>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : alumnos.length === 0 ? (
        <EmptyState
          icon="🎒"
          titulo="No hay alumnos todavía"
          descripcion="Comenzá agregando el primer alumno a la institución."
          accion={{ label: 'Nuevo alumno', onClick: () => router.push(`/${slug}/admin/alumnos/nuevo`) }}
        />
      ) : alumnosFiltrados.length === 0 ? (
        <EmptyState
          icon="🔍"
          titulo="Sin resultados"
          descripcion="No hay alumnos que coincidan con tu búsqueda."
          accion={{ label: 'Limpiar filtros', onClick: () => { setBusqueda(''); setFiltroSala('') } }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Alumno</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">DNI</th>
                  <th className="px-4 py-3 text-left">Sala</th>
                  <th className="px-4 py-3 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alumnosFiltrados.map((alumno) => (
                  <AlumnoRow
                    key={alumno.id}
                    alumno={alumno}
                    salaNombre={getSalaNombre(alumno.salaActualId)}
                    onClick={() => router.push(`/${slug}/admin/alumnos/${alumno.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AlumnoRow({
  alumno,
  salaNombre,
  onClick,
}: {
  alumno: Alumno
  salaNombre: string
  onClick: () => void
}) {
  const dp = alumno.datosPersonales
  const iniciales = getIniciales(dp?.nombre ?? '?', dp?.apellido)

  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {dp?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dp.foto} alt={dp.nombre} className="w-full h-full object-cover" />
            ) : (
              iniciales
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {dp?.apellido}, {dp?.nombre}
            </p>
            <p className="text-xs text-gray-400 sm:hidden">DNI {dp?.dni || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{dp?.dni || '—'}</td>
      <td className="px-4 py-3">
        <span className="text-gray-600 text-xs">{salaNombre}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--color-primary)' }}
        >
          Ver →
        </span>
      </td>
    </tr>
  )
}
