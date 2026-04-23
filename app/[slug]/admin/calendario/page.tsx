'use client'

import { useState } from 'react'
import { Plus, Loader2, Edit2, Trash2, CalendarHeart, Users, HelpCircle } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useEventos } from '@/hooks/useCalendario'
import { useSalas } from '@/hooks/useSalas'
import { createEvento, updateEvento, deleteEvento } from '@/lib/services/calendario.service'
import { Evento } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatFecha } from '@/lib/utils'

const DEFAULT_FORM: {
  nombre: string
  fecha: string
  descripcion: string
  alcance: Evento['alcance']
  recordatorioDias: number
} = {
  nombre: '',
  fecha: '',
  descripcion: '',
  alcance: { tipo: 'institucion' },
  recordatorioDias: 1,
}

export default function AdminCalendarioPage() {
  const { tenant } = useTenant()
  const { eventos, loading } = useEventos(tenant.id)
  const { salas } = useSalas(tenant.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingEvent(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(e: Evento) {
    setEditingEvent(e)
    setForm({
      nombre: e.nombre,
      fecha: e.fecha.slice(0, 16), // YYYY-MM-DDThh:mm
      descripcion: e.descripcion,
      alcance: e.alcance,
      recordatorioDias: e.recordatorioDias ?? 0,
    })
    setError(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.fecha) {
      setError('El nombre y la fecha son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const dbData = {
        ...form,
        // Convert 'YYYY-MM-DDThh:mm' local string to valid ISO or just keep it formatted
        fecha: new Date(form.fecha).toISOString(),
      }
      if (editingEvent) {
        await updateEvento(tenant.id, editingEvent.id, dbData)
      } else {
        await createEvento(tenant.id, dbData)
      }
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar el evento')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e: Evento) {
    if (!confirm(`¿Eliminar el evento "${e.nombre}"?`)) return
    await deleteEvento(tenant.id, e.id)
  }

  // Agrupación por Mes/Año
  const eventosFuturos = eventos.filter(e => new Date(e.fecha).getTime() >= new Date().setHours(0,0,0,0))
  const eventosPasados = eventos.filter(e => new Date(e.fecha).getTime() < new Date().setHours(0,0,0,0))

  return (
    <div className="p-6 lg:p-8 animate-fade-in relative max-w-4xl">
      <PageHeader
        titulo="Calendario y Eventos"
        descripcion="Administrá las fechas importantes de la institución."
        accion={{ label: 'Nuevo evento', onClick: openCreate, icon: Plus }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : eventos.length === 0 ? (
        <EmptyState
          icon="📅"
          titulo="Calendario vacío"
          descripcion="Empezá agregando feriados, actos escolares o reuniones de padres."
          accion={{ label: 'Crear evento', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-8">
          {/* Próximos eventos (Agenda View) */}
          {eventosFuturos.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Próximos eventos</h2>
              <div className="space-y-3">
                {eventosFuturos.map((ev) => (
                  <EventRow key={ev.id} ev={ev} onEdit={() => openEdit(ev)} onDelete={() => handleDelete(ev)} salas={salas} />
                ))}
              </div>
            </div>
          )}

          {/* Eventos pasados */}
          {eventosPasados.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-10 mb-4 px-1 opacity-60">Eventos anteriores</h2>
              <div className="space-y-3 opacity-60 grayscale-[50%]">
                {eventosPasados.map((ev) => (
                  <EventRow key={ev.id} ev={ev} onEdit={() => openEdit(ev)} onDelete={() => handleDelete(ev)} salas={salas} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Agregar/Editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary px-5 py-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              Guardar evento
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del evento *</label>
            <input className="input" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej: Acto 9 de Julio" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora *</label>
              <input type="datetime-local" className="input" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alcance</label>
              <select className="input" value={form.alcance.tipo} onChange={(e) => setForm({...form, alcance: { tipo: e.target.value as any, salaId: '' }})}>
                <option value="institucion">Toda la institución</option>
                <option value="sala">Una sala específica</option>
              </select>
            </div>
          </div>

          {form.alcance.tipo === 'sala' && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <label className="block text-sm font-semibold text-blue-900 mb-1.5">¿Para qué sala?</label>
              <select className="input" value={form.alcance.salaId} onChange={(e) => setForm({...form, alcance: { ...form.alcance, salaId: e.target.value }})} required>
                <option value="">Seleccioná la sala</option>
                {salas.map(s => <option key={s.id} value={s.id}>{s.nombre} - {s.nivel}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción <span className="font-normal text-gray-400">(Opcional)</span></label>
            <textarea className="input resize-none" rows={3} value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} placeholder="Detalles de vestimenta, horarios específicos, etc." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enviar recordatorio automático</label>
            <select className="input" value={form.recordatorioDias} onChange={(e) => setForm({...form, recordatorioDias: Number(e.target.value)})}>
              <option value={0}>No enviar</option>
              <option value={1}>1 día antes</option>
              <option value={2}>2 días antes</option>
              <option value={7}>1 semana antes</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function EventRow({ ev, onEdit, onDelete, salas }: { ev: Evento, onEdit: () => void, onDelete: () => void, salas: any[] }) {
  const d = new Date(ev.fecha)
  const isInstitucion = ev.alcance.tipo === 'institucion'
  const salaNombre = salas.find(s => s.id === ev.alcance.salaId)?.nombre ?? 'Sala desconocida'

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow group relative overflow-hidden">
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center w-14 h-16 rounded-xl shrink-0 bg-gray-50 border border-gray-100">
        <span className="text-[10px] font-bold uppercase text-gray-400 leading-none mb-1">
          {d.toLocaleDateString('es-AR', { month: 'short' })}
        </span>
        <span className="text-xl font-black text-gray-800 leading-none">
          {d.getDate()}
        </span>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-gray-900 text-base">{ev.nombre}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
            {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
          </span>
          {isInstitucion ? (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-primary bg-primary/10" style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-10)' }}>
              <Users size={12} /> Toda la inst.
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-amber-700 bg-amber-100 border border-amber-200">
              <HelpCircle size={12} className="text-amber-600" /> {salaNombre}
            </span>
          )}
        </div>
        
        {ev.descripcion && (
          <p className="text-sm text-gray-500 leading-relaxed truncate">{ev.descripcion}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><Edit2 size={16} /></button>
        <button onClick={onDelete} className="p-2 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
      </div>

      {/* Decorative left accent */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg" style={{ backgroundColor: isInstitucion ? 'var(--color-primary)' : '#f59e0b' }} />
    </div>
  )
}
