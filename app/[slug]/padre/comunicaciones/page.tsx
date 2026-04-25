'use client'

import { useState, useMemo } from 'react'
import { Loader2, Filter, PenLine, X } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useNotasDeSala } from '@/hooks/useNotas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { acusarRecibo, createNota, addRespuesta } from '@/lib/services/cuaderno.service'
import { NotaCard } from '@/components/cuaderno/NotaCard'
import { TipoNota } from '@/lib/types'
import { TIPO_NOTA_CONFIG } from '@/lib/services/cuaderno.service'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'

type FiltroTipo = TipoNota | 'todos'

export default function PadreComunicacionesPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { salas } = useSalas(tenant.id)
  const { alumnos } = useAlumnos(tenant.id)

  const permitirNotasDePadres = tenant.configuracion?.permitirNotasDePadres ?? false

  // Alumnos vinculados a este padre
  const misAlumnos = useMemo(
    () => alumnos.filter((a) => a.tutorIds?.includes(user?.uid ?? '__none__')),
    [alumnos, user?.uid]
  )

  // Si hay varios hijos, selector
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState<string | null>(null)
  const alumnoActivo = misAlumnos.find((a) => a.id === alumnoSeleccionadoId) ?? misAlumnos[0] ?? null
  const salaId = alumnoActivo?.salaActualId ?? null
  const sala = salas.find((s) => s.id === salaId) ?? null

  const { notas, loading } = useNotasDeSala(tenant.id, salaId)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

  // Modal nueva nota
  const [modalOpen, setModalOpen] = useState(false)
  const [notaTitulo, setNotaTitulo] = useState('')
  const [notaContenido, setNotaContenido] = useState('')
  const [enviandoNota, setEnviandoNota] = useState(false)
  const [notaError, setNotaError] = useState<string | null>(null)

  const notasFiltradas = useMemo(
    () => filtroTipo === 'todos' ? notas : notas.filter((n) => n.tipo === filtroTipo),
    [notas, filtroTipo]
  )

  const notasNoLeidas = notas.filter(
    (n) => !n.acusesRecibo?.some((a) => a.tutorId === user?.uid && a.alumnoId === alumnoActivo?.id)
  ).length

  async function handleAcusar(notaId: string) {
    if (!salaId || !alumnoActivo || !user) return
    await acusarRecibo(tenant.id, salaId, notaId, {
      tutorId: user.uid,
      tutorNombre: user.displayName ?? user.email ?? 'Familiar',
      alumnoId: alumnoActivo.id,
      fecha: new Date().toISOString(),
    })
  }

  async function handleResponder(notaId: string, contenido: string) {
    if (!salaId || !user) return
    await addRespuesta(tenant.id, salaId, notaId, {
      id: crypto.randomUUID(),
      autorId: user.uid,
      autorNombre: user.displayName ?? user.email ?? 'Familiar',
      autorRol: 'padre',
      contenido,
      creadaEn: new Date().toISOString(),
    })
  }

  async function handleEnviarNota(e: React.FormEvent) {
    e.preventDefault()
    if (!notaTitulo.trim() || !notaContenido.trim() || !salaId || !user) return
    setEnviandoNota(true)
    setNotaError(null)
    try {
      await createNota(tenant.id, salaId, {
        titulo: notaTitulo.trim(),
        contenido: notaContenido.trim(),
        tipo: 'general',
        files: [],
        autorId: user.uid,
        autorNombre: user.displayName ?? user.email ?? 'Familiar',
        autorRol: 'padre',
        alumnosDestino: alumnoActivo ? [alumnoActivo.id] : [],
      })
      setNotaTitulo('')
      setNotaContenido('')
      setModalOpen(false)
    } catch (err: any) {
      setNotaError(err.message ?? 'Error al enviar la nota.')
    } finally {
      setEnviandoNota(false)
    }
  }

  // Padre sin hijos vinculados
  if (!loading && misAlumnos.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon="👧"
          titulo="Sin hijos vinculados"
          descripcion="Tu cuenta aún no tiene alumnos vinculados. Contactá a la institución para que activen tu acceso."
        />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
          {sala && (
            <p className="text-sm text-gray-500 mt-1">
              {sala.nombre} · {sala.nivel}
            </p>
          )}
        </div>
        {permitirNotasDePadres && salaId && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <PenLine size={16} />
            Nueva nota
          </button>
        )}
      </div>

      {/* Selector de hijo (si hay varios) */}
      {misAlumnos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {misAlumnos.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlumnoSeleccionadoId(a.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                alumnoActivo?.id === a.id
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {a.datosPersonales?.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Badge de notas sin leer */}
      {notasNoLeidas > 0 && (
        <div
          className="mb-5 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{
            backgroundColor: 'var(--color-primary-10)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {notasNoLeidas}
          </span>
          <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            {notasNoLeidas === 1
              ? 'Tenés 1 comunicado sin acusar recibo'
              : `Tenés ${notasNoLeidas} comunicados sin acusar recibo`}
          </p>
        </div>
      )}

      {/* Filtro por tipo */}
      {notas.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <button
            onClick={() => setFiltroTipo('todos')}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={
              filtroTipo === 'todos'
                ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' }
            }
          >
            Todos
          </button>
          {(['urgente', 'tarea', 'autorizacion', 'recordatorio', 'general'] as TipoNota[]).map((t) => {
            const cfg = TIPO_NOTA_CONFIG[t]
            const active = filtroTipo === t
            return (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={
                  active
                    ? { backgroundColor: cfg.border, color: cfg.color }
                    : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {cfg.emoji} {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <SkeletonList count={3} />
      ) : notasFiltradas.length === 0 ? (
        <EmptyState
          icon="✉️"
          titulo="Sin comunicaciones"
          descripcion={
            filtroTipo !== 'todos'
              ? 'No hay notas de este tipo por ahora.'
              : 'La institución no publicó comunicaciones todavía.'
          }
          accion={
            filtroTipo !== 'todos'
              ? { label: 'Ver todas', onClick: () => setFiltroTipo('todos') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {notasFiltradas.map((nota) => (
            <NotaCard
              key={nota.id}
              nota={nota}
              mode="padre"
              alumnoIdPadre={alumnoActivo?.id}
              tutorId={user?.uid}
              tutorNombre={user?.displayName ?? user?.email ?? 'Familiar'}
              onAcusar={handleAcusar}
              onResponder={handleResponder}
              puedeResponder={permitirNotasDePadres}
            />
          ))}
        </div>
      )}

      {/* Modal nueva nota */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setNotaTitulo(''); setNotaContenido(''); setNotaError(null) }}
        title="Escribir nota"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setModalOpen(false); setNotaTitulo(''); setNotaContenido(''); setNotaError(null) }}
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviarNota}
              disabled={enviandoNota || !notaTitulo.trim() || !notaContenido.trim()}
              className="btn-primary px-5 py-2"
            >
              {enviandoNota && <Loader2 size={15} className="animate-spin" />}
              {enviandoNota ? 'Enviando…' : '📤 Enviar nota'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleEnviarNota} className="space-y-4">
          {notaError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {notaError}
            </div>
          )}
          <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700">
            📬 Tu nota será enviada a la sala <strong>{sala?.nombre}</strong> y podrá verla el equipo de la institución.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto *</label>
            <input
              type="text"
              value={notaTitulo}
              onChange={(e) => setNotaTitulo(e.target.value)}
              placeholder="Ej: Consulta sobre la salida del viernes"
              className="input text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje *</label>
            <textarea
              value={notaContenido}
              onChange={(e) => setNotaContenido(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="input resize-none"
              rows={5}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
