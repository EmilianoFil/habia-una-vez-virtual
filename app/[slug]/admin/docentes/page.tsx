'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Loader2, Clock } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useDocentes } from '@/hooks/useDocentes'
import { useSalas } from '@/hooks/useSalas'
import { createDocente, updateDocente, deactivateDocente } from '@/lib/services/docentes.service'
import { Docente } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { TurnoBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { getIniciales } from '@/lib/utils'

const TURNOS = ['mañana', 'tarde', 'vespertino', 'completo'] as const
const TURNO_LABELS: Record<string, string> = {
  mañana: 'Mañana', tarde: 'Tarde', vespertino: 'Vespertino', completo: 'Completo'
}

const DEFAULT_FORM = {
  nombre: '', apellido: '', email: '', telefono: '', dni: '',
  turno: { nombre: 'mañana', horarioIngreso: '08:00', horarioEgreso: '12:00' },
  salasIds: [] as string[]
}

export default function DocentesPage() {
  const { tenant } = useTenant()
  const { docentes, loading } = useDocentes(tenant.id)
  const { salas } = useSalas(tenant.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function setTurnoField(key: string, value: string) {
    setForm((prev) => ({ ...prev, turno: { ...prev.turno, nombre: key === 'nombre' ? value : prev.turno.nombre, horarioIngreso: key === 'horarioIngreso' ? value : prev.turno.horarioIngreso, horarioEgreso: key === 'horarioEgreso' ? value : prev.turno.horarioEgreso } }))
  }
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

  async function handleDeactivate(d: Docente) {
    if (!confirm(`¿Desactivar a ${d.nombre} ${d.apellido}?`)) return
    await deactivateDocente(tenant.id, d.id)
  }

  function getSalasNombres(salasIds: string[]): string {
    if (!salasIds?.length) return 'Sin salas'
    return salasIds
      .map((id) => salas.find((s) => s.id === id)?.nombre ?? id)
      .join(', ')
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Docentes"
        descripcion={`${docentes.length} docente${docentes.length !== 1 ? 's' : ''}`}
        accion={{ label: 'Nuevo docente', onClick: openCreate, icon: Plus }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : docentes.length === 0 ? (
        <EmptyState
          icon="👩‍🏫"
          titulo="No hay docentes cargados"
          descripcion="Agregá el equipo docente de la institución."
          accion={{ label: 'Nuevo docente', onClick: openCreate }}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Docente</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Turno</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Salas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docentes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-secondary)' }}
                      >
                        {getIniciales(d.nombre, d.apellido)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{d.apellido}, {d.nombre}</p>
                        {d.dni && <p className="text-xs text-gray-400">DNI {d.dni}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <TurnoBadge turno={d.turno?.nombre ?? 'mañana'} />
                      {d.turno && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {d.turno.horarioIngreso} – {d.turno.horarioEgreso}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">{getSalasNombres(d.salasIds)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDeactivate(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDocente ? `Editar docente` : 'Nuevo docente'}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary px-5 py-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editingDocente ? 'Guardar cambios' : 'Crear docente'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input className="input" value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} placeholder="María" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido *</label>
              <input className="input" value={form.apellido} onChange={(e) => setField('apellido', e.target.value)} placeholder="López" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="maria@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
              <input className="input" value={form.dni} onChange={(e) => setField('dni', e.target.value)} placeholder="12.345.678" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
            <input className="input" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} placeholder="+54 11 1234-5678" />
          </div>

          {/* Salas asignadas */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Salas asignadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {salas.map((sala) => (
                <label 
                  key={sala.id} 
                  className={`flex items-center gap-2 p-2 rounded-xl border text-sm transition-all cursor-pointer ${
                    form.salasIds.includes(sala.id) 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={form.salasIds.includes(sala.id)}
                    onChange={() => toggleSala(sala.id)}
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    form.salasIds.includes(sala.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                  }`}>
                    {form.salasIds.includes(sala.id) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="truncate">{sala.nombre}</span>
                </label>
              ))}
            </div>
            {salas.length === 0 && <p className="text-xs text-gray-400">No hay salas creadas.</p>}
          </div>

          {!editingDocente && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
              💡 El acceso a la plataforma (cuenta de usuario) se configura por separado desde el panel de administración.
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
