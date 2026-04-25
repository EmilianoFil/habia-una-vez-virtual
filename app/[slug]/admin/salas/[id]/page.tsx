'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, GraduationCap, Mail, Edit2, Save, X, Loader2 } from 'lucide-react'
import { SkeletonCard, SkeletonGrid, SkeletonList } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { useDocentes } from '@/hooks/useDocentes'
import { getIniciales } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { updateSala } from '@/lib/services/salas.service'
import { HtmlTemplateUpload } from '@/components/ui/HtmlTemplateUpload'
import { PhotoUpload } from '@/components/ui/PhotoUpload'

// ─── helpers de horario ──────────────────────────────────────
function toMin(time: string): number {
  const [h, m] = (time ?? '00:00').split(':').map(Number)
  return h * 60 + m
}
function turnosOverlap(
  a: { inicio: string; fin: string },
  b: { inicio: string; fin: string }
): boolean {
  return toMin(a.inicio) < toMin(b.fin) && toMin(b.inicio) < toMin(a.fin)
}

export default function SalaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useTenant()
  const slug = params.slug as string
  const salaId = params.id as string

  const { salas, loading: loadingSalas } = useSalas(tenant.id)
  const { alumnos, loading: loadingAlumnos } = useAlumnos(tenant.id, salaId)
  const { docentes, loading: loadingDocentes } = useDocentes(tenant.id)

  // ── edición de datos básicos ──
  const [editingInfo, setEditingInfo] = useState(false)
  const [infoForm, setInfoForm] = useState({ nombre: '', nivel: '', cupo: 20 })
  const [savingInfo, setSavingInfo] = useState(false)

  const [assignModal, setAssignModal] = useState(false)

  async function handleTemplateUpdate(url: string | null) {
    await updateSala(tenant.id, salaId, { emailTemplateUrl: url })
  }
  async function handleLogoUpdate(url: string | null) {
    await updateSala(tenant.id, salaId, { logo: url })
  }

  function startEditInfo() {
    if (!sala) return
    setInfoForm({ nombre: sala.nombre, nivel: sala.nivel, cupo: sala.cupo })
    setEditingInfo(true)
  }
  async function saveInfo() {
    if (!infoForm.nombre.trim() || !infoForm.nivel.trim()) return
    setSavingInfo(true)
    try {
      await updateSala(tenant.id, salaId, {
        nombre: infoForm.nombre.trim(),
        nivel: infoForm.nivel.trim(),
        cupo: Number(infoForm.cupo),
      })
      setEditingInfo(false)
    } finally {
      setSavingInfo(false)
    }
  }

  const sala = salas.find(s => s.id === salaId)
  const docentesDeSala = docentes.filter(d => d.salasIds?.includes(salaId))
  const turnos = tenant.configuracion?.turnos ?? []

  if (loadingSalas || loadingAlumnos || loadingDocentes) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SkeletonGrid count={4} cols="grid-cols-1 md:grid-cols-2" />
          </div>
          <div className="space-y-4">
            <SkeletonList count={2} />
          </div>
        </div>
      </div>
    )
  }

  if (!sala) {
    return <div className="p-8 text-center uppercase tracking-widest text-gray-400">Sala no encontrada</div>
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 transition-all border border-gray-100 shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        {sala.logo && !editingInfo && (
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
            <Image src={sala.logo} alt={sala.nombre} width={56} height={56} className="w-full h-full object-cover" />
          </div>
        )}

        {editingInfo ? (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={infoForm.nombre}
                onChange={e => setInfoForm(f => ({ ...f, nombre: e.target.value }))}
                className="input flex-1 font-bold text-lg py-2"
                placeholder="Nombre de la sala"
              />
              <input
                type="number"
                value={infoForm.cupo}
                onChange={e => setInfoForm(f => ({ ...f, cupo: Number(e.target.value) }))}
                className="input w-24 py-2 text-center"
                placeholder="Cupo"
                min={1}
                max={200}
              />
            </div>
            <input
              value={infoForm.nivel}
              onChange={e => setInfoForm(f => ({ ...f, nivel: e.target.value }))}
              className="input py-2 text-sm"
              placeholder="Nivel / Año (ej: Jardín 4 años)"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={saveInfo}
                disabled={savingInfo}
                className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1.5"
              >
                {savingInfo ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar
              </button>
              <button
                onClick={() => setEditingInfo(false)}
                disabled={savingInfo}
                className="btn-secondary px-4 py-1.5 text-sm flex items-center gap-1.5"
              >
                <X size={13} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{sala.nombre}</h1>
              <p className="text-gray-500 font-medium">{sala.nivel} · cupo {sala.cupo}</p>
            </div>
            <button
              onClick={startEditInfo}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
            >
              <Edit2 size={14} /> Editar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Principal: Alumnos */}
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
                      {alumno.turnoId && (() => {
                        const t = turnos.find(t => t.id === alumno.turnoId)
                        return t ? (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {t.nombre}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-8">
          {/* Docentes */}
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
              <button onClick={() => setAssignModal(true)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                + Gestionar docentes
              </button>
            </div>
          </div>

          {/* Ocupación por Jornada */}
          <div className="card p-5 bg-indigo-50/30 border-indigo-100 space-y-4">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Ocupación por Jornada</h3>
            <div className="space-y-3">
              {turnos.length === 0 ? (
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
                <>
                  {turnos.map((turno) => {
                    // Cuenta alumnos físicamente presentes: los que tienen un turno
                    // que se superpone horariamente con este turno
                    const count = alumnos.filter(a => {
                      const aTurno = turnos.find(t => t.id === a.turnoId)
                      if (!aTurno) return false
                      return turnosOverlap(aTurno, turno)
                    }).length
                    const pct = Math.min((count / sala.cupo) * 100, 100)
                    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                    const exactCount = alumnos.filter(a => a.turnoId === turno.id).length
                    return (
                      <div key={turno.id}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-indigo-700 truncate max-w-[130px]">{turno.nombre}</span>
                          <span className="text-indigo-900 shrink-0 ml-2">{count} / {sala.cupo}</span>
                        </div>
                        <div className="h-2 bg-indigo-100/50 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-0.5">
                          {turno.inicio}–{turno.fin}
                          {count !== exactCount && (
                            <span className="ml-1 text-indigo-500/70">· {exactCount} propios + {count - exactCount} solapados</span>
                          )}
                          {count === exactCount && (
                            <span className="ml-1">· {sala.cupo - count} disponibles</span>
                          )}
                        </p>
                      </div>
                    )
                  })}
                  <div className="border-t border-indigo-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Inscriptos totales</span>
                    <span className="text-sm font-black text-indigo-900">{alumnos.length} / {sala.cupo}</span>
                  </div>
                  <p className="text-[10px] text-indigo-400 leading-relaxed">
                    Cada barra muestra los alumnos físicamente presentes en ese horario, incluyendo turnos superpuestos.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Logo de la sala</h3>
            <div className="flex items-center gap-4">
              <PhotoUpload
                value={sala.logo ?? null}
                onChange={handleLogoUpdate}
                storagePath={`tenants/${tenant.id}/salas/${salaId}/logo`}
                size="lg"
                shape="square"
              />
              <p className="text-xs text-gray-400 leading-relaxed">
                Se muestra en el listado y encabezado. Recomendado: imagen cuadrada.
              </p>
            </div>
          </div>

          {/* Template de email */}
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

      {/* Modal docentes */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Gestionar Docentes"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary px-4 py-2">Cerrar</button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Para asignar docentes a esta sala, editá el perfil del docente en la sección Equipo.
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
