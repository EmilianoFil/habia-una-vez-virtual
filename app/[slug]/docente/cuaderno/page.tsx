'use client'

import { useState, useMemo } from 'react'
import { Plus, Loader2, CheckCircle, AlertCircle, Info, UserRound, MessageSquarePlus } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useNotasDeSala } from '@/hooks/useNotas'
import { useAlumnos } from '@/hooks/useAlumnos'
import { createNota, toggleVisibilidadNota, addRespuesta, CreateNotaData } from '@/lib/services/cuaderno.service'
import { NotaCard } from '@/components/cuaderno/NotaCard'
import { NuevaNotaModal } from '@/components/cuaderno/NuevaNotaModal'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DocenteCuadernoPage() {
  const { tenant } = useTenant()
  const { user, claims } = useAuth()
  const { salas: todasLasSalas } = useSalas(tenant.id)
  const { alumnos } = useAlumnos(tenant.id)

  // Docentes con scope 'salas_propias' ven solo sus salas (uid en docenteIds).
  // Docentes con scope 'institucion' (ej. administrativos) ven todas.
  const salas = claims?.scope === 'institucion'
    ? todasLasSalas
    : todasLasSalas.filter((s) => s.docenteIds?.includes(user?.uid ?? ''))

  const [salaId, setSalaId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [emailToast, setEmailToast] = useState<{ type: 'ok' | 'warn' | 'info'; msg: string } | null>(null)

  // Nota individual
  const [notaIndModal, setNotaIndModal] = useState(false)
  const [notaIndAlumnoId, setNotaIndAlumnoId] = useState<string>('')
  const [notaIndTitulo, setNotaIndTitulo] = useState('')
  const [notaIndContenido, setNotaIndContenido] = useState('')
  const [notaIndSaving, setNotaIndSaving] = useState(false)
  const [notaIndError, setNotaIndError] = useState<string | null>(null)
  const [notaIndOk, setNotaIndOk] = useState(false)

  function showToast(type: 'ok' | 'warn' | 'info', msg: string) {
    setEmailToast({ type, msg })
    setTimeout(() => setEmailToast(null), 5000)
  }

  const salaActiva = salaId ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaActiva) ?? null

  // Alumnos activos de la sala activa
  const alumnosDeSala = useMemo(
    () => alumnos.filter((a) => a.salaActualId === salaActiva && a.activo !== false),
    [alumnos, salaActiva]
  )

  const { notas, loading } = useNotasDeSala(tenant.id, salaActiva)

  async function handleCreate(data: CreateNotaData) {
    if (!salaActiva) return
    const id = await createNota(tenant.id, salaActiva, data)

    try {
      const res = await fetch('/api/notifications/send-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, salaId: salaActiva, notaId: id })
      })
      const json = await res.json()
      if (!res.ok) {
        showToast('warn', `Nota publicada. No se pudo enviar el mail: ${json.error ?? 'error desconocido'}`)
      } else if (json.message) {
        showToast('info', `Nota publicada. ${json.message}`)
      } else {
        const fails = json.failCount > 0 ? ` (${json.failCount} fallaron)` : ''
        showToast(json.failCount > 0 ? 'warn' : 'ok', `Nota publicada. ${json.sentCount} mail${json.sentCount !== 1 ? 's' : ''} enviados${fails}.`)
      }
    } catch {
      showToast('warn', 'Nota publicada, pero no se pudo verificar el envío de mails.')
    }
  }

  async function handleToggle(notaId: string, visible: boolean) {
    if (!salaActiva) return
    await toggleVisibilidadNota(tenant.id, salaActiva, notaId, visible)
  }

  async function handleResponder(notaId: string, contenido: string) {
    if (!salaActiva || !user) return
    await addRespuesta(tenant.id, salaActiva, notaId, {
      id: crypto.randomUUID(),
      autorId: user.uid,
      autorNombre: user.displayName ?? user.email?.split('@')[0] ?? 'Docente',
      autorRol: 'docente',
      contenido,
      creadaEn: new Date().toISOString(),
    })
  }

  async function handleEnviarNotaIndividual(e: React.FormEvent) {
    e.preventDefault()
    if (!notaIndAlumnoId || !notaIndTitulo.trim() || !notaIndContenido.trim() || !salaActiva) return
    setNotaIndSaving(true)
    setNotaIndError(null)
    try {
      await createNota(tenant.id, salaActiva, {
        titulo: notaIndTitulo.trim(),
        contenido: notaIndContenido.trim(),
        tipo: 'general',
        files: [],
        autorId: user?.uid ?? '',
        autorNombre: user?.displayName ?? user?.email?.split('@')[0] ?? 'Docente',
        autorRol: 'docente',
        alumnosDestino: [notaIndAlumnoId],
      })
      setNotaIndOk(true)
      setNotaIndTitulo('')
      setNotaIndContenido('')
      setNotaIndAlumnoId('')
      setTimeout(() => { setNotaIndOk(false); setNotaIndModal(false) }, 1500)
    } catch (err: any) {
      setNotaIndError(err.message ?? 'Error al enviar la nota.')
    } finally {
      setNotaIndSaving(false)
    }
  }

  const alumnoSeleccionado = alumnosDeSala.find(a => a.id === notaIndAlumnoId)

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {emailToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold max-w-sm transition-all ${
          emailToast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          emailToast.type === 'warn' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {emailToast.type === 'ok' ? <CheckCircle size={18} className="shrink-0 text-emerald-500" /> :
           emailToast.type === 'warn' ? <AlertCircle size={18} className="shrink-0 text-amber-500" /> :
           <Info size={18} className="shrink-0 text-blue-500" />}
          <span>{emailToast.msg}</span>
        </div>
      )}

      {/* Header con dos acciones */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuaderno</h1>
          <p className="text-sm text-gray-500 mt-1">Comunicaciones a las familias</p>
        </div>
        {salaActiva && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => { setNotaIndAlumnoId(''); setNotaIndTitulo(''); setNotaIndContenido(''); setNotaIndError(null); setNotaIndOk(false); setNotaIndModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-indigo-50"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <UserRound size={16} />
              Nota individual
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Plus size={16} />
              Nueva nota
            </button>
          </div>
        )}
      </div>

      {salas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {salas.map((s) => (
            <button
              key={s.id}
              onClick={() => setSalaId(s.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                salaActiva === s.id
                  ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : notas.length === 0 ? (
        <EmptyState
          icon="📝"
          titulo="Sin notas aún"
          descripcion="Publicá la primera nota para las familias de tu sala."
          accion={{ label: 'Nueva nota', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {notas.map((nota) => {
            const destinoId = nota.alumnosDestino?.[0]
            const destinoAlumno = destinoId ? alumnos.find(a => a.id === destinoId) : undefined
            const destinoNombre = destinoAlumno
              ? `${destinoAlumno.datosPersonales?.nombre} ${destinoAlumno.datosPersonales?.apellido}`
              : undefined
            return (
              <NotaCard
                key={nota.id}
                nota={nota}
                totalAlumnos={sala?.alumnoIds?.length ?? 0}
                mode="docente"
                onToggleVisibilidad={handleToggle}
                onResponder={handleResponder}
                alumnoDestinoNombre={destinoNombre}
              />
            )
          })}
        </div>
      )}

      {/* Modal nota para toda la sala */}
      <NuevaNotaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        autorId={user?.uid ?? ''}
        autorNombre={user?.displayName ?? user?.email?.split('@')[0] ?? 'Docente'}
        autorRol="docente"
      />

      {/* Modal nota individual */}
      <Modal
        open={notaIndModal}
        onClose={() => !notaIndSaving && setNotaIndModal(false)}
        title="Nota individual"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setNotaIndModal(false)} disabled={notaIndSaving} className="btn-secondary px-4 py-2">Cancelar</button>
            <button
              onClick={handleEnviarNotaIndividual}
              disabled={notaIndSaving || !notaIndAlumnoId || !notaIndTitulo.trim() || !notaIndContenido.trim()}
              className="btn-primary px-5 py-2"
            >
              {notaIndSaving && <Loader2 size={15} className="animate-spin" />}
              {notaIndSaving ? 'Enviando…' : '📤 Enviar nota'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {notaIndOk && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-semibold">
              ✅ Nota enviada. Solo los familiares de {alumnoSeleccionado?.datosPersonales?.nombre} la verán.
            </div>
          )}
          {notaIndError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{notaIndError}</div>
          )}

          {/* Selector de alumno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Para quién es la nota? *</label>
            {alumnosDeSala.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay alumnos activos en esta sala.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {alumnosDeSala.map((a) => {
                  const selected = notaIndAlumnoId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setNotaIndAlumnoId(a.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: selected ? 'var(--color-primary)' : '#e5e7eb',
                        backgroundColor: selected ? 'var(--color-primary-10, #eef2ff)' : 'white',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: selected ? 'var(--color-primary)' : '#9ca3af' }}
                      >
                        {a.datosPersonales?.nombre?.[0]}{a.datosPersonales?.apellido?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{a.datosPersonales?.nombre}</p>
                        <p className="text-[10px] text-gray-400 truncate">{a.datosPersonales?.apellido}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {notaIndAlumnoId && (
            <>
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
                📌 Solo los familiares de <strong>{alumnoSeleccionado?.datosPersonales?.nombre} {alumnoSeleccionado?.datosPersonales?.apellido}</strong> verán esta nota.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto *</label>
                <input
                  type="text"
                  value={notaIndTitulo}
                  onChange={e => setNotaIndTitulo(e.target.value)}
                  placeholder="Ej: Avance personal, conducta, recordatorio..."
                  className="input"
                  disabled={notaIndSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje *</label>
                <textarea
                  value={notaIndContenido}
                  onChange={e => setNotaIndContenido(e.target.value)}
                  placeholder="Escribí el mensaje..."
                  className="input resize-none"
                  rows={4}
                  disabled={notaIndSaving}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
