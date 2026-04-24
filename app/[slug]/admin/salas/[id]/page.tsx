'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, GraduationCap, Loader2, Mail, Phone, Calendar, CheckSquare, Square } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useDocentes } from '@/hooks/useDocentes'
import { PageHeader } from '@/components/ui/PageHeader'
import { TurnoBadge } from '@/components/ui/Badge'
import { getIniciales } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { updateSala } from '@/lib/services/salas.service'
import { HtmlTemplateUpload } from '@/components/ui/HtmlTemplateUpload'

export default function SalaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const slug = params.slug as string
  const salaId = params.id as string

  const { salas, loading: loadingSalas } = useSalas(tenant.id)
  const { alumnos, loading: loadingAlumnos } = useAlumnos(tenant.id, salaId)
  const { docentes, loading: loadingDocentes } = useDocentes(tenant.id)

  const [assignModal, setAssignModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function handleTemplateUpdate(url: string | null) {
    await updateSala(tenant.id, salaId, { emailTemplateUrl: url })
  }

  const sala = salas.find(s => s.id === salaId)
  const docentesDeSala = docentes.filter(d => d.salasIds?.includes(salaId))

  if (loadingSalas || loadingAlumnos || loadingDocentes) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!sala) {
    return (
      <div className="p-8 text-center uppercase tracking-widest text-gray-400">
        Sala no encontrada
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header con flecha atrás */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 transition-all border border-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{sala.nombre}</h1>
            <TurnoBadge turno={tenant.configuracion?.turnos?.find(t => t.id === sala.turnoId)?.nombre ?? 'Sin turno'} />
          </div>
          <p className="text-gray-500 font-medium">{sala.nivel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Principal: Listado de Alumnos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              Alumnos ({alumnos.length})
            </h2>
            <Link 
              href={`/${slug}/admin/alumnos/nuevo?salaId=${salaId}`}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              + Agregar alumno
            </Link>
          </div>

          {alumnos.length === 0 ? (
            <div className="card p-12 text-center bg-gray-50/50 border-dashed border-2">
              <p className="text-gray-400 font-medium">No hay alumnos asignados a esta sala aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alumnos.map((alumno) => (
                <Link 
                  key={alumno.id}
                  href={`/${slug}/admin/alumnos/${alumno.id}`}
                  className="card p-4 flex gap-4 hover:shadow-md hover:border-indigo-100 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50 group-hover:border-indigo-100 transition-colors">
                    {alumno.datosPersonales.foto ? (
                      <Image 
                        src={alumno.datosPersonales.foto} 
                        alt={alumno.datosPersonales.nombre} 
                        width={56} 
                        height={56} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-bold">
                        {getIniciales(alumno.datosPersonales.nombre, alumno.datosPersonales.apellido)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {alumno.datosPersonales.apellido}, {alumno.datosPersonales.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">
                        DNI {alumno.datosPersonales.dni || '---'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Columna Lateral: Detalles y Docentes */}
        <div className="space-y-8">
          {/* Docentes Asignados */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-emerald-500" />
              Docentes ({docentesDeSala.length})
            </h2>
            
            <div className="space-y-3">
              {docentesDeSala.length === 0 ? (
                <p className="text-sm text-gray-400">Sin docentes asignados.</p>
              ) : (
                docentesDeSala.map((docente) => (
                  <div key={docente.id} className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                      {getIniciales(docente.nombre, docente.apellido)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{docente.nombre} {docente.apellido}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail size={12} className="text-gray-300" />
                        <p className="text-[10px] text-gray-400 truncate">{docente.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <button 
                onClick={() => setAssignModal(true)}
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Gestionar docentes
              </button>
            </div>
          </div>

          {/* Estado por Jornada */}
          <div className="card p-5 bg-indigo-50/30 border-indigo-100 space-y-4">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Ocupación por Jornada</h3>

            <div className="space-y-4">
              {(tenant.configuracion?.turnos ?? []).length === 0 ? (
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-indigo-600/60 uppercase tracking-wider">Total</span>
                    <span className="text-indigo-900">{alumnos.length} / {sala.cupo}</span>
                  </div>
                  <div className="h-2.5 bg-indigo-100/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.min((alumnos.length / sala.cupo) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(tenant.configuracion?.turnos ?? []).map((turno) => {
                    const count = alumnos.filter(a => a.turnoId === turno.id).length
                    const pct = Math.min((count / sala.cupo) * 100, 100)
                    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                    return (
                      <div key={turno.id}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-indigo-700 truncate max-w-[120px]">{turno.nombre}</span>
                          <span className="text-indigo-900 shrink-0 ml-2">{count} / {sala.cupo}</span>
                        </div>
                        <div className="h-2 bg-indigo-100/50 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-0.5">{turno.inicio}–{turno.fin} · {sala.cupo - count} disponibles</p>
                      </div>
                    )
                  })}
                  <div className="border-t border-indigo-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Total sala</span>
                    <span className="text-sm font-black text-indigo-900">{alumnos.length} / {sala.cupo}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase">Nivel</p>
                <p className="text-sm font-black text-indigo-900 leading-tight">{sala.nivel}</p>
              </div>
            </div>
          </div>
          {/* Template de email de la sala */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Template de Email</h3>
            <HtmlTemplateUpload
              value={sala.emailTemplateUrl ?? null}
              onChange={handleTemplateUpdate}
              storagePath={`tenants/${tenant.id}/salas/${salaId}/email-template.html`}
              description="Reemplaza el template general para los correos de esta sala."
            />
          </div>
        </div>
      </div>

      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Asignar Docentes"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button 
              onClick={() => {
                setAssignModal(false)
                alert('Los docentes se asignan editando el perfil de cada docente.')
              }}
              className="btn-primary px-4 py-2"
            >
              Entendido
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Para asignar docentes a esta sala, debés ir a la sección de **Docentes** y editar el perfil del docente correspondiente.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {docentes.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-bold">{d.nombre} {d.apellido}</span>
                {d.salasIds?.includes(salaId) ? (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest">Asignado</span>
                ) : (
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-widest">No asignado</span>
                )}
              </div>
            ))}
          </div>
          <Link 
            href={`/${slug}/admin/equipo`}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            Ir a Equipo
          </Link>
        </div>
      </Modal>
    </div>
  )
}
