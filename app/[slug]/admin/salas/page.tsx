'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Users, GraduationCap, Edit2, Trash2, Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { createSala, updateSala, deactivateSala } from '@/lib/services/salas.service'
import { Sala } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { TurnoBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TurnoConfig } from '@/lib/types'

const DEFAULT_FORM = { nombre: '', turnoId: '', nivel: '', cupo: 20 }

export default function SalasPage() {
  const { tenant } = useTenant()
  const params = useParams()
  const slug = params.slug as string
  const { salas, loading } = useSalas(tenant.id)

  const configTurnos = tenant.configuracion?.turnos ?? []
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSala, setEditingSala] = useState<Sala | null>(null)
  const [form, setForm] = useState({ ...DEFAULT_FORM, turnoId: configTurnos[0]?.id ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingSala(null)
    setForm({ ...DEFAULT_FORM, turnoId: configTurnos[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  function openEdit(sala: Sala) {
    setEditingSala(sala)
    setForm({ nombre: sala.nombre, turnoId: sala.turnoId, nivel: sala.nivel, cupo: sala.cupo })
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.nivel.trim()) {
      setError('Nombre y nivel son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingSala) {
        await updateSala(tenant.id, editingSala.id, form)
      } else {
        await createSala(tenant.id, form)
      }
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(sala: Sala) {
    if (!confirm(`¿Desactivar la sala "${sala.nombre}"? Los alumnos no se eliminarán.`)) return
    await deactivateSala(tenant.id, sala.id)
  }

  const turnoLabels: Record<string, string> = {
    mañana: 'Mañana', tarde: 'Tarde', vespertino: 'Vespertino', completo: 'Completo'
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        titulo="Salas"
        descripcion={`${salas.length} sala${salas.length !== 1 ? 's' : ''} activa${salas.length !== 1 ? 's' : ''}`}
        accion={{ label: 'Nueva sala', onClick: openCreate, icon: Plus }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : salas.length === 0 ? (
        <EmptyState
          icon="🏫"
          titulo="No hay salas todavía"
          descripcion="Creá la primera sala para empezar a organizar los alumnos."
          accion={{ label: 'Nueva sala', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {salas.map((sala) => (
            <div key={sala.id} className="card p-5 flex flex-col gap-4 group hover:shadow-md transition-shadow">
              {/* Accent bar */}
              <div
                className="h-1 rounded-full -mt-5 -mx-5 mb-1"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
              <Link 
                href={`/${slug}/admin/salas/${sala.id}`}
                className="flex flex-col gap-4 group-hover:no-underline"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                      {sala.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{sala.nivel}</p>
                  </div>
                  <TurnoBadge turno={configTurnos.find(t => t.id === sala.turnoId)?.nombre ?? 'Sin turno'} />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span>
                      <strong className="text-gray-900">{sala.alumnoIds?.length ?? 0}</strong>/{sala.cupo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    <span>
                      <strong className="text-gray-900">{sala.docenteIds?.length ?? 0}</strong> docente{sala.docenteIds?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Barra de ocupación */}
                <div className="space-y-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((sala.alumnoIds?.length ?? 0) / sala.cupo) * 100)}%`,
                        backgroundColor: 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {sala.cupo - (sala.alumnoIds?.length ?? 0)} lugar{sala.cupo - (sala.alumnoIds?.length ?? 0) !== 1 ? 'es' : ''} disponible{sala.cupo - (sala.alumnoIds?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => openEdit(sala)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => handleDeactivate(sala)}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSala ? `Editar: ${editingSala.nombre}` : 'Nueva sala'}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary px-5 py-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editingSala ? 'Guardar cambios' : 'Crear sala'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre de la sala *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Sala Amarilla, 1° Grado A"
              className="input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Turno *</label>
              <select
                value={form.turnoId}
                onChange={(e) => setForm({ ...form, turnoId: e.target.value })}
                className="input text-sm"
              >
                {configTurnos.length > 0 ? (
                  configTurnos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))
                ) : (
                  <option value="">Configurá turnos primero</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupo máx *</label>
              <input
                type="number"
                value={form.cupo}
                onChange={(e) => setForm({ ...form, cupo: Number(e.target.value) })}
                min={1}
                max={100}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nivel / Año *
            </label>
            <input
              type="text"
              value={form.nivel}
              onChange={(e) => setForm({ ...form, nivel: e.target.value })}
              placeholder="Ej: Jardín 4 años, 2° Grado"
              className="input"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
