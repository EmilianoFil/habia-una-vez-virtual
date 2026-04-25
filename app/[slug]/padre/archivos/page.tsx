'use client'

import { useState, useMemo, useRef } from 'react'
import { FileUp, Loader2, CheckCircle2, Clock, Upload, FileText } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useSolicitudes } from '@/hooks/useArchivos'
import { entregarArchivo } from '@/lib/services/archivos.service'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function PadreArchivosPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { alumnos, loading: alumnosLoading } = useAlumnos(tenant.id)

  const misAlumnos = useMemo(
    () => alumnos.filter((a) => a.tutorIds?.includes(user?.uid ?? '__none__')),
    [alumnos, user?.uid]
  )

  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null)
  const alumnoActivo = misAlumnos.find((a) => a.id === alumnoSeleccionadoId) ?? misAlumnos[0] ?? null
  
  // Obtenemos todas las solicitudes de la base (filtradas a este alumno).
  const { solicitudes, loading: solicitudesLoading } = useSolicitudes(tenant.id, null, alumnoActivo?.id)

  // Subida
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const isLoading = alumnosLoading || solicitudesLoading

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeUploadId) return
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy pesado. El límite es 5MB.')
      return
    }

    setUploading(true)
    try {
      await entregarArchivo(tenant.id, activeUploadId, file)
      // Success: UI auto updates via listener
    } catch (err: any) {
      alert('Error al subir el archivo: ' + err.message)
    } finally {
      setUploading(false)
      setActiveUploadId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function triggerUpload(solId: string) {
    setActiveUploadId(solId)
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 0)
  }

  if (!isLoading && misAlumnos.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState icon="👧" titulo="Sin alumnos vinculados" descripcion="Contactá a la institución para que te asignen tu alumno." />
      </div>
    )
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const entregadas = solicitudes.filter(s => s.estado === 'entregado')

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative max-w-4xl">
      <PageHeader
        titulo="Documentación Requerida"
        descripcion="Subí las fichas médicas, autorizaciones o planillas solicitadas por la institución."
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
        <SkeletonList count={3} />
      ) : solicitudes.length === 0 ? (
        <EmptyState
          icon="✨"
          titulo="Todo al día"
          descripcion="La institución no ha solicitado ningún documento para este alumno por el momento."
        />
      ) : (
        <div className="space-y-8">
          {/* Input oculto reutilizable para subir PDFs/Imágenes */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf"
          />

          {pendientes.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <AlertDot /> Tareas Pendientes ({pendientes.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pendientes.map(sol => (
                  <div key={sol.id} className="card p-5 border-l-4 border-red-400 relative overflow-hidden group">
                    <h3 className="font-bold text-gray-900 mb-1 leading-snug pr-8">{sol.titulo}</h3>
                    {sol.descripcion && <p className="text-xs text-gray-500 mb-3">{sol.descripcion}</p>}
                    
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        Pedido por: {sol.creadaPorNombre}
                      </span>
                      <button
                        disabled={uploading}
                        onClick={() => triggerUpload(sol.id)}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        {uploading && activeUploadId === sol.id ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                        {uploading && activeUploadId === sol.id ? 'Subiendo...' : 'Subir Archivo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entregadas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <CheckCircle2 size={16}/> Entregados
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 opacity-80">
                {entregadas.map(sol => (
                  <div key={sol.id} className="card p-5 border-l-4 border-green-400 relative overflow-hidden bg-gray-50/50">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-700 mb-1">{sol.titulo}</h3>
                    </div>
                    {sol.archivoNombre && (
                      <a href={sol.archivoUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-xs font-semibold text-blue-600 hover:underline">
                        <FileText size={14}/>
                        {sol.archivoNombre}
                      </a>
                    )}
                    <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                      Entregado el: {sol.entregadaEn ? new Date(sol.entregadaEn.seconds * 1000).toLocaleDateString() : '...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertDot() {
  return (
    <span className="flex h-2.5 w-2.5 relative">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
    </span>
  )
}
