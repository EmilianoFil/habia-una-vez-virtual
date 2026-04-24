'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { useAlumnos } from '@/hooks/useAlumnos'
import { updateAlumno } from '@/lib/services/alumnos.service'
import { ContactoEmergencia, AutorizadoRetiro } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loader2, Plus, Trash2, Save, Phone, Mail, User, Shield } from 'lucide-react'

const EMPTY_CONTACTO: ContactoEmergencia = { nombre: '', relacion: '', telefono: '', email: '' }
const EMPTY_AUTORIZADO: AutorizadoRetiro = { nombre: '', relacion: '', telefono: '', dni: '', foto: null, email: '' }

export default function MisHijosPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const { alumnos, loading } = useAlumnos(tenant.id)

  const misAlumnos = useMemo(
    () => alumnos.filter(a => a.tutorIds?.includes(user?.uid ?? '__none__')),
    [alumnos, user?.uid]
  )

  const [alumnoId, setAlumnoId] = useState<string | null>(null)
  const alumno = misAlumnos.find(a => a.id === alumnoId) ?? misAlumnos[0] ?? null

  const [contactos, setContactos] = useState<ContactoEmergencia[]>([])
  const [autorizados, setAutorizados] = useState<AutorizadoRetiro[]>([])
  const [editMode, setEditMode] = useState<'contactos' | 'autorizados' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Cuando cambia el alumno activo, resetear el form
  function startEdit(mode: 'contactos' | 'autorizados') {
    if (!alumno) return
    if (mode === 'contactos') setContactos(alumno.contactosEmergencia?.map(c => ({ ...c })) ?? [])
    else setAutorizados(alumno.autorizados?.map(a => ({ ...a })) ?? [])
    setEditMode(mode)
  }

  function cancelEdit() {
    setEditMode(null)
  }

  async function handleSave() {
    if (!alumno || !editMode) return
    setSaving(true)
    try {
      if (editMode === 'contactos') {
        await updateAlumno(tenant.id, alumno.id, { contactosEmergencia: contactos })
      } else {
        await updateAlumno(tenant.id, alumno.id, { autorizados })
      }
      setSaved(true)
      setEditMode(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
  }

  if (misAlumnos.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader titulo="Mis hijos" descripcion="Datos de contacto y autorizados" />
        <div className="card p-8 text-center">
          <p className="text-gray-400">No hay alumnos vinculados a tu cuenta.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
      <PageHeader titulo="Mis hijos" descripcion="Editá los contactos de emergencia y los autorizados a retirar" />

      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-semibold flex items-center gap-2">
          ✓ Cambios guardados correctamente
        </div>
      )}

      {/* Selector de hijo */}
      {misAlumnos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {misAlumnos.map(a => (
            <button
              key={a.id}
              onClick={() => { setAlumnoId(a.id); setEditMode(null) }}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                (alumno?.id === a.id)
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {a.datosPersonales.nombre} {a.datosPersonales.apellido}
            </button>
          ))}
        </div>
      )}

      {alumno && (
        <div className="space-y-6">
          {/* Info básica del alumno */}
          <div className="card p-5 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {alumno.datosPersonales.nombre.charAt(0)}{alumno.datosPersonales.apellido?.charAt(0) ?? ''}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {alumno.datosPersonales.nombre} {alumno.datosPersonales.apellido}
              </p>
              <p className="text-sm text-gray-400">DNI {alumno.datosPersonales.dni || '—'}</p>
            </div>
          </div>

          {/* Contactos de emergencia */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" /> Contactos de emergencia
              </h2>
              {editMode !== 'contactos' && (
                <button onClick={() => startEdit('contactos')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Editar
                </button>
              )}
            </div>

            {editMode === 'contactos' ? (
              <div className="space-y-4">
                {contactos.map((c, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => setContactos(contactos.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre</label>
                        <input className="input mt-1 py-1.5 text-sm" value={c.nombre}
                          onChange={e => setContactos(contactos.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Relación</label>
                        <input className="input mt-1 py-1.5 text-sm" value={c.relacion} placeholder="Mamá, Papá, Abuelo..."
                          onChange={e => setContactos(contactos.map((x, j) => j === i ? { ...x, relacion: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                        <input className="input mt-1 py-1.5 text-sm" value={c.telefono}
                          onChange={e => setContactos(contactos.map((x, j) => j === i ? { ...x, telefono: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
                        <input className="input mt-1 py-1.5 text-sm" type="email" value={c.email ?? ''}
                          onChange={e => setContactos(contactos.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setContactos([...contactos, { ...EMPTY_CONTACTO }])}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Agregar contacto
                </button>
                <div className="flex gap-3 pt-2">
                  <button onClick={cancelEdit} className="btn-secondary flex-1 py-2 text-sm">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(alumno.contactosEmergencia ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin contactos cargados</p>
                ) : (
                  alumno.contactosEmergencia.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <User size={14} className="text-gray-300 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{c.nombre} <span className="font-normal text-gray-400">({c.relacion})</span></p>
                        <p className="text-xs text-gray-400">{c.telefono}{c.email ? ` · ${c.email}` : ''}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Autorizados a retirar */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield size={16} className="text-emerald-500" /> Autorizados a retirar
              </h2>
              {editMode !== 'autorizados' && (
                <button onClick={() => startEdit('autorizados')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Editar
                </button>
              )}
            </div>

            {editMode === 'autorizados' ? (
              <div className="space-y-4">
                {autorizados.map((a, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => setAutorizados(autorizados.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre</label>
                        <input className="input mt-1 py-1.5 text-sm" value={a.nombre}
                          onChange={e => setAutorizados(autorizados.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Relación</label>
                        <input className="input mt-1 py-1.5 text-sm" value={a.relacion}
                          onChange={e => setAutorizados(autorizados.map((x, j) => j === i ? { ...x, relacion: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teléfono</label>
                        <input className="input mt-1 py-1.5 text-sm" value={a.telefono}
                          onChange={e => setAutorizados(autorizados.map((x, j) => j === i ? { ...x, telefono: e.target.value } : x))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DNI</label>
                        <input className="input mt-1 py-1.5 text-sm" value={a.dni}
                          onChange={e => setAutorizados(autorizados.map((x, j) => j === i ? { ...x, dni: e.target.value } : x))} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setAutorizados([...autorizados, { ...EMPTY_AUTORIZADO }])}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Agregar autorizado
                </button>
                <div className="flex gap-3 pt-2">
                  <button onClick={cancelEdit} className="btn-secondary flex-1 py-2 text-sm">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(alumno.autorizados ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin autorizados cargados</p>
                ) : (
                  alumno.autorizados.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <Shield size={14} className="text-gray-300 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{a.nombre} <span className="font-normal text-gray-400">({a.relacion})</span></p>
                        <p className="text-xs text-gray-400">DNI {a.dni || '—'} · {a.telefono}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
