'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { createSolicitudMasiva } from '@/lib/services/archivos.service'
import { useAlumnos } from '@/hooks/useAlumnos'

interface NuevaSolicitudModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  salaId: string
  creadaPorId: string
  creadaPorNombre: string
}

export function NuevaSolicitudModal({
  open,
  onClose,
  tenantId,
  salaId,
  creadaPorId,
  creadaPorNombre,
}: NuevaSolicitudModalProps) {
  const { alumnos, loading: alumnosLoading } = useAlumnos(tenantId, salaId)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setTitulo('')
    setDescripcion('')
    setFechaLimite('')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('El título de la solicitud es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    
    try {
      const data = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        salaId,
        fechaLimite: fechaLimite || null,
        creadaPorId,
        creadaPorNombre,
        alumnos: alumnos.map(a => ({
          id: a.id,
          nombre: `${a.datosPersonales?.apellido}, ${a.datosPersonales?.nombre}`
        }))
      }
      
      await createSolicitudMasiva(tenantId, data)
      handleClose()
    } catch (err: any) {
      setError(err.message ?? 'Error al crear solicitud')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Solicitar Documentación"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="btn-secondary px-4 py-2">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving || alumnos.length === 0}
            className="btn-primary px-5 py-2"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? 'Enviando...' : `Solicitar a ${alumnos.length} alumnos`}
          </button>
        </div>
      }
    >
      {alumnosLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : alumnos.length === 0 ? (
        <div className="p-4 bg-gray-50 text-gray-500 rounded-xl text-center text-sm">
          No podés hacer una solicitud porque esta sala no tiene alumnos inscritos aún.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <strong>Atención:</strong> Al crear la solicitud, se generará 1 pedido pendiente en el portal de la familia para <strong>cada uno de los {alumnos.length} alumnos</strong> de la sala.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Qué archivo necesitás? *</label>
            <input 
              type="text" 
              className="input text-sm font-semibold" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              placeholder="Ej: Ficha Médica 2026, Apto Físico, Autorización viaje..." 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Detalles o instrucciones adicionales</label>
            <textarea 
              className="input resize-none text-sm" 
              rows={3} 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              placeholder="Ej: El apto físico debe estar sellado por un pediatra. Podés subir foto o PDF." 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha límite de entrega <span className="text-gray-400 font-normal">(Opcional)</span></label>
            <input 
              type="date" 
              className="input text-sm" 
              value={fechaLimite} 
              onChange={(e) => setFechaLimite(e.target.value)} 
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
