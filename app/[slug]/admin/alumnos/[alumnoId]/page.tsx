'use client'

import { ArrowLeft, Phone, Heart, Users, Shield, Loader2, BookOpen, Mail, Key, Edit2, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { useAlumno } from '@/hooks/useAlumnos'
import { useSalas } from '@/hooks/useSalas'
import { formatFecha, calcularEdadDetalle, getIniciales, formatRelativo } from '@/lib/utils'
import { vincularTutorAlumno } from '@/lib/services/alumnos.service'
import { TurnoBadge } from '@/components/ui/Badge'
import { useState } from 'react'
import { useTutores } from '@/hooks/useTutores'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

export default function AlumnoDetailPage() {
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const alumnoId = params.alumnoId as string
  const slug = params.slug as string

  const { alumno, loading } = useAlumno(tenant.id, alumnoId)
  const { salas } = useSalas(tenant.id)
  // Sin filtro por alumnoId: necesitamos detectar tutores ya registrados en otros hijos
  const { tutores } = useTutores(tenant.id)
  
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null) // email del que se está procesando
  const [togglingUid, setTogglingUid] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold text-gray-900">Alumno no encontrado</h2>
        <button onClick={() => router.back()} className="btn-secondary">← Volver</button>
      </div>
    )
  }

  const dp = alumno.datosPersonales
  const dm = alumno.datosMedicos
  const sala = salas.find((s) => s.id === alumno.salaActualId)
  const iniciales = getIniciales(dp?.nombre ?? '?', dp?.apellido)

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8">
        <div 
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-100"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {iniciales}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{dp?.apellido}, {dp?.nombre}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {dp?.fechaNacimiento && (
              <span className="text-sm text-gray-500">
                {calcularEdadDetalle(dp.fechaNacimiento)} — {formatFecha(dp.fechaNacimiento)}
              </span>
            )}
            {dp?.dni && <span className="text-sm text-gray-400">DNI {dp.dni}</span>}
          </div>
          {sala && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium text-gray-700">{sala.nombre}</span>
              <TurnoBadge turno={tenant.configuracion?.turnos?.find(t => t.id === sala.turnoId)?.nombre ?? 'Sin turno'} />
            </div>
          )}
        </div>
        <Link 
          href={`/${slug}/admin/alumnos/${alumnoId}/editar`}
          className="btn-primary self-start flex items-center gap-2"
        >
          <Edit2 size={16} /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos médicos */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Datos médicos</h3>
          </div>
          <div className="space-y-4">
            <InfoRow label="Obra Social" value={dm?.obraSocial} />
            <InfoRow label="Alergias" value={dm?.alergias} />
            <InfoRow label="Medicación" value={dm?.medicacionHabitual} />
            <InfoRow label="Pediatra" value={dm?.pediatraNombre ? `${dm.pediatraNombre} (${dm.pediatraTelefono})` : undefined} />
            
            <div className="border-t border-gray-50 pt-4 mt-4">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Documentación Adjunta</p>
              {dm?.documentos?.length ? (
                <div className="space-y-2">
                  {dm.documentos.map((doc, idx) => (
                    <a 
                      key={idx} 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group"
                    >
                      <FileText size={14} className="text-gray-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-semibold text-gray-600 truncate">{doc.nombre}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin documentos cargados</p>
              )}
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Contactos</h3>
          </div>
          {alumno.contactosEmergencia?.length > 0 ? (
            <div className="space-y-4">
              {alumno.contactosEmergencia.map((c, i) => (
                <div key={i} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.relacion}</p>
                    </div>
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={12} className="text-gray-300" />
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin contactos cargados</p>
          )}
        </div>

        {/* Autorizados */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Autorizados a retirar</h3>
          </div>
          {alumno.autorizados?.length > 0 ? (
            <div className="space-y-3">
              {alumno.autorizados.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  >
                    {a.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.foto} alt={a.nombre} className="w-full h-full object-cover" />
                    ) : getIniciales(a.nombre)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                    <p className="text-xs text-gray-400">{a.relacion} — DNI {a.dni || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin autorizados cargados</p>
          )}
        </div>

        {/* Historial de salas */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Historial de salas</h3>
          </div>
          {alumno.historialSalas?.length > 0 ? (
            <div className="space-y-2">
              {alumno.historialSalas.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{h.salaNombre}</p>
                  <p className="text-xs text-gray-400">{formatFecha(h.desde)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin historial</p>
          )}
        </div>

        {/* Gestión de Acceso */}
        <div className="card p-5 border-indigo-100 bg-indigo-50/10 lg:col-span-2 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Acceso para familiares</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Otorgá acceso a los familiares para que puedan ver el cuaderno y las comunicaciones de {dp.nombre} en tiempo real. 
            <strong> Solo aparecerán los contactos que tengan un mail cargado.</strong>
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alumno.contactosEmergencia?.filter(c => c.email).map((c, i) => {
              const tutor = tutores.find(t => t.email.toLowerCase() === c.email?.toLowerCase())
              // Tres estados: sin cuenta / cuenta existente pero no vinculada a este hijo / vinculada
              const isRegistered = !!tutor
              const hasAccess = isRegistered && (tutor!.alumnoIds?.includes(alumnoId) ?? false)
              const isEnabled = tutor?.activo !== false
              const isToggling = togglingUid === tutor?.uid

              return (
                <div key={i} className={`p-4 bg-white rounded-2xl border transition-all flex flex-col gap-4 ${
                  hasAccess ? 'border-emerald-100 shadow-sm' : 'border-indigo-100'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{c.nombre}</p>
                      <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                    </div>
                    {hasAccess && (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {isEnabled ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </div>

                  {hasAccess && tutor.lastLogin && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg self-start">
                      <Calendar size={10} />
                      Último ingreso: {formatRelativo(tutor.lastLogin)}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isRegistered ? (
                      // Sin cuenta: crear usuario + vincular
                      <button
                        disabled={grantingAccess === c.email}
                        onClick={async () => {
                          if (!confirm(`¿Dar acceso a ${c.nombre} (${c.email}) como padre?`)) return
                          setGrantingAccess(c.email || null)
                          try {
                            const res = await fetch('/api/admin/set-role', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: c.email, role: 'padre', tenantId: tenant.id, scope: 'salas_propias' })
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)
                            await vincularTutorAlumno(tenant.id, alumnoId, data.uid, { nombre: c.nombre, email: c.email! })
                            alert('Acceso concedido correctamente.')
                          } catch (err: any) {
                            alert('Error: ' + err.message)
                          } finally {
                            setGrantingAccess(null)
                          }
                        }}
                        className="btn-primary py-2.5 text-xs w-full flex items-center justify-center gap-2"
                      >
                        {grantingAccess === c.email ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                        {grantingAccess === c.email ? 'Procesando...' : 'Conceder acceso'}
                      </button>
                    ) : !hasAccess ? (
                      // Ya tiene cuenta (en otro hijo) pero no está vinculado a éste
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          <Key size={10} />
                          Ya tiene acceso al portal (otro hijo)
                        </div>
                        <button
                          disabled={grantingAccess === c.email}
                          onClick={async () => {
                            setGrantingAccess(c.email || null)
                            try {
                              await vincularTutorAlumno(tenant.id, alumnoId, tutor!.uid, { nombre: c.nombre, email: c.email! })
                              alert(`${c.nombre} ahora puede ver también a ${alumno.datosPersonales.nombre}.`)
                            } catch (err: any) {
                              alert('Error: ' + err.message)
                            } finally {
                              setGrantingAccess(null)
                            }
                          }}
                          className="btn-primary py-2 text-xs w-full flex items-center justify-center gap-2"
                        >
                          {grantingAccess === c.email ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                          {grantingAccess === c.email ? 'Vinculando...' : 'Vincular a este alumno'}
                        </button>
                      </div>
                    ) : (
                      <button 
                        disabled={isToggling}
                        onClick={async () => {
                          if (isEnabled && !confirm(`¿Deshabilitar el acceso de ${c.nombre}?`)) return
                          setTogglingUid(tutor.uid)
                          try {
                            const res = await fetch('/api/admin/toggle-user-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ uid: tutor.uid, disabled: isEnabled, tenantId: tenant.id })
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)

                            await updateDoc(doc(db, `tenants/${tenant.id}/tutores/${tutor.uid}`), {
                              activo: !isEnabled
                            })
                          } catch (err: any) {
                            alert('Error: ' + err.message)
                          } finally {
                            setTogglingUid(null)
                          }
                        }}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isEnabled 
                            ? 'border-red-100 text-red-500 hover:bg-red-50' 
                            : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {isToggling ? <Loader2 size={14} className="animate-spin" /> : (isEnabled ? <Shield size={14} /> : <Key size={14} />)}
                        {isEnabled ? 'Desactivar acceso' : 'Habilitar acceso'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {alumno.contactosEmergencia?.filter(c => c.email).length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-xl">💡</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Para dar acceso a un familiar, primero editá el alumno y asegurate de que sus contactos tengan un email cargado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-700">{value?.trim() || <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}
