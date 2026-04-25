'use client'

import { useState } from 'react'
import { Plus, Loader2, BookOpen, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useNotasDeSala } from '@/hooks/useNotas'
import { createNota, toggleVisibilidadNota, addRespuesta, CreateNotaData } from '@/lib/services/cuaderno.service'
import { NotaCard } from '@/components/cuaderno/NotaCard'
import { NuevaNotaModal } from '@/components/cuaderno/NuevaNotaModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminCuadernoPage() {
  const { tenant } = useTenant()
  const { user, claims } = useAuth()
  const { salas, loading: salasLoading } = useSalas(tenant.id)

  const [salaSeleccionada, setSalaSeleccionada] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [emailToast, setEmailToast] = useState<{ type: 'ok' | 'warn' | 'info'; msg: string } | null>(null)

  function showToast(type: 'ok' | 'warn' | 'info', msg: string) {
    setEmailToast({ type, msg })
    setTimeout(() => setEmailToast(null), 5000)
  }

  // Sala activa — usa la primera si no hay selección
  const salaId = salaSeleccionada ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaId) ?? null

  const { notas, loading: notasLoading } = useNotasDeSala(tenant.id, salaId)

  async function handleCreate(data: CreateNotaData) {
    if (!salaId) return
    const id = await createNota(tenant.id, salaId, data)

    try {
      const res = await fetch('/api/notifications/send-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, salaId, notaId: id })
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

  async function handleToggleVisibilidad(notaId: string, visible: boolean) {
    if (!salaId) return
    await toggleVisibilidadNota(tenant.id, salaId, notaId, visible)
  }

  async function handleResponder(notaId: string, contenido: string) {
    if (!salaId || !user) return
    await addRespuesta(tenant.id, salaId, notaId, {
      id: crypto.randomUUID(),
      autorId: user.uid,
      autorNombre: user.displayName ?? user.email?.split('@')[0] ?? 'Admin',
      autorRol: 'admin',
      contenido,
      creadaEn: new Date().toISOString(),
    })
  }

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
      <PageHeader
        titulo="Cuaderno"
        descripcion="Comunicaciones por sala"
        accion={salaId ? { label: 'Nueva nota', onClick: () => setModalOpen(true), icon: Plus } : undefined}
      />

      {/* Selector de salas */}
      {salasLoading ? (
        <SkeletonList count={3} />
      ) : salas.length === 0 ? (
        <EmptyState
          icon="🏫"
          titulo="Creá salas primero"
          descripcion="Para publicar notas, necesitás al menos una sala creada."
        />
      ) : (
        <>
          {/* Tabs de salas */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {salas.map((s) => (
              <button
                key={s.id}
                onClick={() => setSalaSeleccionada(s.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  (salaId === s.id)
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                      }
                    : {
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                      }
                }
              >
                <span>{s.nombre}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={
                    salaId === s.id
                      ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }
                      : { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                  }
                >
                  {s.alumnoIds?.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Info de sala seleccionada */}
          {sala && (
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={15} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                {sala.nombre} · {sala.nivel} · {sala.alumnoIds?.length ?? 0} alumnos
              </span>
            </div>
          )}

          {/* Notas */}
          {notasLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : notas.length === 0 ? (
            <EmptyState
              icon="📝"
              titulo="Sin notas en esta sala"
              descripcion="Publicá la primera nota del cuaderno para las familias."
              accion={{ label: 'Nueva nota', onClick: () => setModalOpen(true) }}
            />
          ) : (
            <div className="space-y-4">
              {notas.map((nota) => (
                <NotaCard
                  key={nota.id}
                  nota={nota}
                  totalAlumnos={sala?.alumnoIds?.length ?? 0}
                  mode="admin"
                  onToggleVisibilidad={handleToggleVisibilidad}
                  onResponder={handleResponder}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal nueva nota */}
      <NuevaNotaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        autorId={user?.uid ?? ''}
        autorNombre={user?.displayName ?? user?.email?.split('@')[0] ?? 'Admin'}
        autorRol="admin"
      />
    </div>
  )
}
