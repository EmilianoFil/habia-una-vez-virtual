'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X as XIcon, Clock } from 'lucide-react'
import { Alumno, RegistroAsistenciaAlumno, EstadoAsistencia } from '@/lib/types'
import { cn, getIniciales } from '@/lib/utils'

interface AsistenciaTableProps {
  alumnos: Alumno[]
  asistenciaActual: Record<string, RegistroAsistenciaAlumno> | null
  onSave: (registros: Record<string, RegistroAsistenciaAlumno>) => Promise<void>
  readOnly?: boolean
}

export function AsistenciaTable({ alumnos, asistenciaActual, onSave, readOnly = false }: AsistenciaTableProps) {
  const [registros, setRegistros] = useState<Record<string, RegistroAsistenciaAlumno>>({})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Sincronizar estado inicial
  useEffect(() => {
    if (asistenciaActual) {
      setRegistros(asistenciaActual)
    } else {
      // Default: todos presentes si no hay registro
      const defaultRegs: Record<string, RegistroAsistenciaAlumno> = {}
      alumnos.forEach(a => {
        defaultRegs[a.id] = { estado: 'presente' }
      })
      setRegistros(defaultRegs)
    }
    setHasChanges(false)
  }, [asistenciaActual, alumnos])

  function handleSet(alumnoId: string, estado: EstadoAsistencia) {
    if (readOnly) return
    setRegistros(prev => ({
      ...prev,
      [alumnoId]: { ...prev[alumnoId], estado }
    }))
    setHasChanges(true)
  }

  function handleSetTodos(estado: EstadoAsistencia) {
    if (readOnly) return
    const next: Record<string, RegistroAsistenciaAlumno> = {}
    alumnos.forEach(a => {
      next[a.id] = { estado }
    })
    setRegistros(next)
    setHasChanges(true)
  }

  async function handleGuardar() {
    if (!hasChanges || readOnly) return
    setSaving(true)
    try {
      await onSave(registros)
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  if (alumnos.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No hay alumnos en esta sala.</p>
  }

  const presentes = Object.values(registros).filter(r => r.estado === 'presente').length
  const ausentes = Object.values(registros).filter(r => r.estado === 'ausente').length
  const tardes = Object.values(registros).filter(r => r.estado === 'tarde').length

  return (
    <div className="space-y-4">
      {/* Resumen y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card p-4">
        <div className="flex gap-4 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-semibold uppercase">Presentes</span>
            <span className="text-lg font-bold text-green-600">{presentes}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-semibold uppercase">Ausentes</span>
            <span className="text-lg font-bold text-red-600">{ausentes}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs font-semibold uppercase">Tardes</span>
            <span className="text-lg font-bold text-amber-600">{tardes}</span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button onClick={() => handleSetTodos('presente')} className="btn-secondary text-xs py-1.5 px-3">
              Todos presentes
            </button>
            <button
              onClick={handleGuardar}
              disabled={!hasChanges || saving}
              className={cn("btn-primary text-xs py-1.5 px-4 transition-all duration-300", 
                hasChanges ? "animate-pulse shadow-md" : "opacity-50"
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar asistencia'}
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Alumno</th>
              <th className="px-4 py-3 text-center">Asistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {alumnos.map((a) => {
              const reg = registros[a.id]
              const estado = reg?.estado ?? 'presente'
              const dp = a.datosPersonales
              const iniciales = getIniciales(dp?.nombre ?? '?', dp?.apellido)

              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                        {dp?.foto ? <img src={dp.foto} alt={dp.nombre} className="w-full h-full object-cover rounded-full" /> : iniciales}
                      </div>
                      <span className="font-medium text-gray-900">{dp?.apellido}, {dp?.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        disabled={readOnly}
                        onClick={() => handleSet(a.id, 'presente')}
                        className={cn(
                          "flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all",
                          estado === 'presente' ? "bg-green-100 text-green-700 shadow-sm border border-green-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-transparent",
                          readOnly && "cursor-default opacity-80"
                        )}
                        title="Presente"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        disabled={readOnly}
                        onClick={() => handleSet(a.id, 'tarde')}
                        className={cn(
                          "flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all",
                          estado === 'tarde' ? "bg-amber-100 text-amber-700 shadow-sm border border-amber-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-transparent",
                          readOnly && "cursor-default opacity-80"
                        )}
                        title="Llegada Tarde"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        disabled={readOnly}
                        onClick={() => handleSet(a.id, 'ausente')}
                        className={cn(
                          "flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all",
                          estado === 'ausente' ? "bg-red-100 text-red-700 shadow-sm border border-red-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-transparent",
                          readOnly && "cursor-default opacity-80"
                        )}
                        title="Ausente"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
