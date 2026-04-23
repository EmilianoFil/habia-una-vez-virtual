'use client'

import { useState } from 'react'
import { FileUp, Loader2, Search, Filter, CheckCircle2, Clock, Download, XCircle } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useSolicitudes } from '@/hooks/useArchivos'
import { rechazarArchivo } from '@/lib/services/archivos.service'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { NuevaSolicitudModal } from '@/components/archivos/NuevaSolicitudModal'

export default function DocenteArchivosPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { salas, loading: salasLoading } = useSalas(tenant.id)

  const [salaSeleccionada, setSalaSeleccionada] = useState<string | null>(null)
  const salaIdActiva = salaSeleccionada ?? salas[0]?.id ?? null
  const sala = salas.find(s => s.id === salaIdActiva)

  const { solicitudes, loading: solicitudesLoading } = useSolicitudes(tenant.id, salaIdActiva)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'entregado'>('todos')

  const listadoFiltrado = solicitudes.filter(s => {
    if (filtroEstado !== 'todos' && s.estado !== filtroEstado) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return s.alumnoNombre.toLowerCase().includes(q) || s.titulo.toLowerCase().includes(q)
    }
    return true
  })

  async function handleRechazar(id: string) {
    if (!confirm('Esto indicará al padre que el archivo no sirve y deberá volver a subirlo. ¿Continuar?')) return
    await rechazarArchivo(tenant.id, id)
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Documentación"
        descripcion="Pedí fichas médicas o autorizaciones a las familias de tu sala."
        accion={salaIdActiva ? { label: 'Nueva Solicitud', icon: FileUp, onClick: () => setModalOpen(true) } : undefined}
      />

      {salasLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
      ) : salas.length === 0 ? (
        <EmptyState
          icon="📂"
          titulo="Sin salas"
          descripcion="Aún no tenés salas asignadas."
        />
      ) : (
        <>
          {salas.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {salas.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSalaSeleccionada(s.id)}
                  className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={
                    (salaIdActiva === s.id)
                      ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar alumno o documento..." 
                className="input pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400 ml-2 sm:ml-0" />
              <select className="input text-sm w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)}>
                <option value="todos">Todos</option>
                <option value="pendiente">Faltan entregar</option>
                <option value="entregado">Entregados</option>
              </select>
            </div>
          </div>

          {solicitudesLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
          ) : listadoFiltrado.length === 0 ? (
            <EmptyState
              icon="✅"
              titulo="No hay documentos pendientes"
              descripcion="Todo en orden o no hiciste requerimientos."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-4">Alumno</th>
                      <th className="px-5 py-4">Documento Solicitado</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Archivo / Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listadoFiltrado.map(sol => {
                      const isEntregado = sol.estado === 'entregado'
                      return (
                        <tr key={sol.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-900">{sol.alumnoNombre}</td>
                          <td className="px-5 py-3">
                            <span className="block font-medium text-gray-800">{sol.titulo}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              isEntregado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isEntregado ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                              {isEntregado ? 'Entregado' : 'Falta Entregar'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {isEntregado && sol.archivoUrl ? (
                              <div className="flex items-center gap-3">
                                <a href={sol.archivoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                  <Download size={13}/> Bajar archivo
                                </a>
                                <button onClick={() => handleRechazar(sol.id)} title="Rechazar si no es válido" className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                                  <XCircle size={15}/>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Esperando subida...</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {salaIdActiva && (
        <NuevaSolicitudModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tenantId={tenant.id}
          salaId={salaIdActiva}
          creadaPorId={user?.uid ?? ''}
          creadaPorNombre={user?.displayName ?? user?.email ?? 'Docente'}
        />
      )}
    </div>
  )
}
