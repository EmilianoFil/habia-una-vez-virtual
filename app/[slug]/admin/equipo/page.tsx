'use client'

import { useState } from 'react'
import {
  GraduationCap, Shield, Plus, Edit2, Trash2, Loader2,
  CheckCircle2, XCircle, Key, DoorOpen, Globe, Copy, UserX, UserCheck, Link as LinkIcon,
  RefreshCw
} from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useDocentes } from '@/hooks/useDocentes'
import { useSalas } from '@/hooks/useSalas'
import { createDocente, updateDocente, deactivateDocente } from '@/lib/services/docentes.service'
import { Docente, AccesoScope } from '@/lib/types'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { getIniciales } from '@/lib/utils'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Tab = 'docentes' | 'administrativos'
type AccessRole = 'docente' | 'administrativo'

const SCOPE_CONFIG: Record<AccesoScope, { label: string; description: string; icon: typeof Globe }> = {
  institucion: {
    label: 'Toda la institución',
    description: 'Ve alumnos, salas y comunicaciones de toda la escuela.',
    icon: Globe
  },
  salas_propias: {
    label: 'Solo sus salas',
    description: 'Solo puede ver y actuar en las salas que tiene asignadas.',
    icon: DoorOpen
  }
}

function AccesoBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
        <CheckCircle2 size={11} /> Activo
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
      <XCircle size={11} /> Sin acceso
    </span>
  )
}

function ScopeBadge({ scope }: { scope?: AccesoScope }) {
  if (!scope) return null
  const config = SCOPE_CONFIG[scope]
  const Icon = config.icon
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
      <Icon size={10} /> {config.label}
    </span>
  )
}

const DEFAULT_FORM = {
  nombre: '', apellido: '', email: '', telefono: '', dni: '',
  turno: { nombre: 'mañana', horarioIngreso: '08:00', horarioEgreso: '12:00' },
  salasIds: [] as string[]
}

const DEFAULT_ACCESS_FORM = {
  role: 'docente' as AccessRole,
  scope: 'salas_propias' as AccesoScope,
}

export default function EquipoPage() {
  const { tenant } = useTenant()
  const { docentes, loading } = useDocentes(tenant.id)
  const { salas } = useSalas(tenant.id)

  const [tab, setTab] = useState<Tab>('docentes')
  const [modalOpen, setModalOpen] = useState(false)
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [resetLinkModal, setResetLinkModal] = useState<{ email: string; link: string } | null>(null)
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [accessForm, setAccessForm] = useState(DEFAULT_ACCESS_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingUid, setTogglingUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filtrar según tab — "sin acceso asignado" va a Docentes por defecto
  const docentesList = docentes.filter(d => !d.acceso || d.acceso.role === 'docente')
  const administrativosList = docentes.filter(d => d.acceso?.role === 'administrativo')
  const visibleList = tab === 'docentes' ? docentesList : administrativosList

  function toggleSala(salaId: string) {
    setForm(prev => ({
      ...prev,
      salasIds: prev.salasIds.includes(salaId)
        ? prev.salasIds.filter(id => id !== salaId)
        : [...prev.salasIds, salaId]
    }))
  }

  function openCreate() {
    setEditingDocente(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(d: Docente) {
    setEditingDocente(d)
    setForm({
      nombre: d.nombre, apellido: d.apellido, email: d.email,
      telefono: d.telefono, dni: d.dni,
      turno: d.turno ?? DEFAULT_FORM.turno,
      salasIds: d.salasIds ?? []
    })
    setError(null)
    setModalOpen(true)
  }

  function openAccessModal(d: Docente) {
    setEditingDocente(d)
    setAccessForm({
      role: d.acceso?.role ?? 'docente',
      scope: d.acceso?.scope ?? 'salas_propias'
    })
    setError(null)
    setAccessModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      setError('Nombre, apellido y email son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingDocente) {
        await updateDocente(tenant.id, editingDocente.id, form)
      } else {
        await createDocente(tenant.id, form)
      }
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleGrantAccess() {
    if (!editingDocente) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingDocente.email,
          role: accessForm.role,
          tenantId: tenant.id,
          scope: accessForm.scope
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Guardar acceso en Firestore
      await updateDoc(doc(db, `tenants/${tenant.id}/docentes/${editingDocente.id}`), {
        uid: data.uid,
        acceso: {
          habilitado: true,
          role: accessForm.role,
          scope: accessForm.scope,
          invitadoEn: new Date().toISOString()
        }
      })

      setAccessModalOpen(false)

      // Siempre mostrar el link, el mail puede o no haberse enviado
      setResetLinkModal({ email: editingDocente.email, link: data.resetLink })

    } catch (err: any) {
      setError(err.message ?? 'Error al dar acceso')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAccess(d: Docente, disable: boolean) {
    if (disable && !confirm(`¿Deshabilitar la cuenta de ${d.nombre} ${d.apellido}? No podrá iniciar sesión.`)) return
    if (!d.uid) return

    setTogglingUid(d.uid)
    try {
      const res = await fetch('/api/admin/toggle-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: d.uid, disabled: disable, tenantId: tenant.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Actualizar estado en Firestore
      await updateDoc(doc(db, `tenants/${tenant.id}/docentes/${d.id}`), {
        'acceso.habilitado': !disable
      })
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setTogglingUid(null)
    }
  }

  async function handleResendLink(email: string) {
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: editingDocente?.acceso?.role ?? 'docente',
          tenantId: tenant.id,
          scope: editingDocente?.acceso?.scope ?? 'salas_propias'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResetLinkModal({ email, link: data.resetLink })
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeactivate(d: Docente) {
    if (!confirm(`¿Eliminar a ${d.nombre} ${d.apellido} del equipo?`)) return
    await deactivateDocente(tenant.id, d.id)
  }

  function getSalasNombres(salasIds: string[]): string {
    if (!salasIds?.length) return 'Sin salas asignadas'
    return salasIds.map(id => salas.find(s => s.id === id)?.nombre ?? id).join(', ')
  }

  const tabs = [
    { id: 'docentes' as Tab, label: 'Docentes', icon: GraduationCap, count: docentesList.length },
    { id: 'administrativos' as Tab, label: 'Administrativos', icon: Shield, count: administrativosList.length },
  ]

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Equipo & Accesos"
        descripcion="Gestioná el personal de la institución y sus permisos de acceso al sistema."
        accion={{ label: 'Agregar persona', onClick: openCreate, icon: Plus }}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={tab === t.id ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              <Icon size={15} />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-white text-gray-400'
              }`}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-300" /></div>
      ) : visibleList.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">{tab === 'docentes' ? '👩‍🏫' : '🗂️'}</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {tab === 'docentes' ? 'Aún no hay docentes' : 'No hay personal administrativo'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {tab === 'docentes'
              ? 'Agregá al equipo docente y asignales salas y accesos al sistema.'
              : 'Agregá personal de gestión (secretaría, dirección) que necesite acceso sin ser docente.'}
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 mx-auto">
            <Plus size={16} /> Agregar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleList.map(d => {
            const isEnabled = !!d.acceso?.habilitado
            const hasUid = !!d.uid
            const isToggling = togglingUid === d.uid

            return (
              <div key={d.id} className={`card p-5 hover:shadow-md transition-all group ${!isEnabled && hasUid ? 'opacity-60' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: isEnabled ? 'var(--color-secondary)' : '#9ca3af' }}
                    >
                      {getIniciales(d.nombre, d.apellido)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{d.apellido}, {d.nombre}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{d.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeactivate(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Salas */}
                <div className="mb-4">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Salas</p>
                  <p className="text-xs text-gray-500">{getSalasNombres(d.salasIds)}</p>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <AccesoBadge enabled={isEnabled} />
                  {isEnabled && d.acceso?.scope && <ScopeBadge scope={d.acceso.scope} />}
                </div>

                {/* Acciones */}
                <div className="pt-3 border-t border-gray-50 space-y-2">
                  {hasUid ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAccessModal(d)}
                          className="flex-1 text-xs py-2 px-3 rounded-xl border border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Shield size={12} /> Cambiar permisos
                        </button>
                        <button
                          disabled={isToggling}
                          onClick={() => handleToggleAccess(d, isEnabled)}
                          className={`text-xs py-2 px-3 rounded-xl border font-semibold transition-colors flex items-center gap-1.5 ${
                            isEnabled
                              ? 'border-red-100 text-red-400 hover:bg-red-50'
                              : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {isToggling
                            ? <Loader2 size={12} className="animate-spin" />
                            : isEnabled ? <UserX size={12} /> : <UserCheck size={12} />}
                          {isEnabled ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleResendLink(d.email)}
                        className="w-full text-xs py-2 rounded-xl border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={11} /> Reenviar link de acceso
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openAccessModal(d)}
                      className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Key size={13} /> Dar acceso al sistema
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== Modal crear/editar ===== */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDocente ? 'Editar persona' : 'Agregar al equipo'}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary px-5 py-2 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingDocente ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="María" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido *</label>
              <input className="input" value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} placeholder="López" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="maria@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input className="input" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11 1234-5678" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
            <input className="input" value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} placeholder="12.345.678" />
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Salas asignadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {salas.map(sala => (
                <label
                  key={sala.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    form.salasIds.includes(sala.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={form.salasIds.includes(sala.id)} onChange={() => toggleSala(sala.id)} />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                    form.salasIds.includes(sala.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                  }`}>
                    {form.salasIds.includes(sala.id) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="truncate text-xs font-medium">{sala.nombre}</span>
                </label>
              ))}
            </div>
            {salas.length === 0 && <p className="text-xs text-gray-400">No hay salas creadas aún.</p>}
          </div>
        </form>
      </Modal>

      {/* ===== Modal permisos de acceso ===== */}
      <Modal
        open={accessModalOpen}
        onClose={() => { setAccessModalOpen(false); setError(null) }}
        title={`Permisos — ${editingDocente?.nombre} ${editingDocente?.apellido}`}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAccessModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button onClick={handleGrantAccess} disabled={saving} className="btn-primary px-5 py-2 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              <Key size={14} /> {editingDocente?.uid ? 'Actualizar permisos' : 'Dar acceso'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {getIniciales(editingDocente?.nombre ?? '', editingDocente?.apellido)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{editingDocente?.nombre} {editingDocente?.apellido}</p>
              <p className="text-xs text-gray-400">{editingDocente?.email}</p>
            </div>
          </div>

          {/* Tipo de rol */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Tipo de acceso</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { role: 'docente', label: 'Docente', desc: 'Cuaderno, asistencia y sus salas.', icon: GraduationCap },
                { role: 'administrativo', label: 'Administrativo', desc: 'Gestión general sin funciones docentes.', icon: Shield }
              ] as const).map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setAccessForm(p => ({ ...p, role: opt.role }))}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      accessForm.role === opt.role ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                      accessForm.role === opt.role ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}><Icon size={16} /></div>
                    <p className={`text-sm font-bold ${accessForm.role === opt.role ? 'text-indigo-900' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">¿Qué puede ver?</label>
            <div className="space-y-2">
              {(Object.entries(SCOPE_CONFIG) as [AccesoScope, (typeof SCOPE_CONFIG)[AccesoScope]][]).map(([scope, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setAccessForm(p => ({ ...p, scope }))}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      accessForm.scope === scope ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      accessForm.scope === scope ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}><Icon size={18} /></div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${accessForm.scope === scope ? 'text-indigo-900' : 'text-gray-700'}`}>{config.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{config.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      accessForm.scope === scope ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'
                    }`}>
                      {accessForm.scope === scope && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
            <span className="text-base">📧</span>
            <span>Se generará un <strong>link de acceso</strong> que podrás copiar y enviar a {editingDocente?.email}. Si tenés email configurado, también se enviará automáticamente.</span>
          </div>
        </div>
      </Modal>

      {/* ===== Modal con link de acceso (fallback cuando no hay email) ===== */}
      <Modal
        open={!!resetLinkModal}
        onClose={() => setResetLinkModal(null)}
        title="✅ Acceso concedido"
        size="md"
        footer={
          <button onClick={() => setResetLinkModal(null)} className="btn-primary px-6 py-2.5 w-full">
            Listo
          </button>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 text-sm">Cuenta lista para usar</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {resetLinkModal?.email} ya tiene acceso al sistema.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Link para configurar contraseña</p>
            <p className="text-xs text-gray-500 mb-3">
              Compartí este link con la persona para que pueda elegir su contraseña e ingresar al sistema. El link expira en 24 horas.
            </p>
            <div className="relative">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-xs text-gray-500 font-mono break-all">
                {resetLinkModal?.link}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetLinkModal?.link ?? '')
                  alert('¡Link copiado!')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>Si configuraste el email de la institución en <strong>Configuración → Mails</strong>, este link también se envió automáticamente. Podés compartirlo también por WhatsApp.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
