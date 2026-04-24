'use client'

import { useState } from 'react'
import { Plus, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSalas } from '@/hooks/useSalas'
import { useNotasDeSala } from '@/hooks/useNotas'
import { createNota, toggleVisibilidadNota, CreateNotaData } from '@/lib/services/cuaderno.service'
import { NotaCard } from '@/components/cuaderno/NotaCard'
import { NuevaNotaModal } from '@/components/cuaderno/NuevaNotaModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DocenteCuadernoPage() {
  const { tenant } = useTenant()
  const { user, claims } = useAuth()
  const { salas: todasLasSalas } = useSalas(tenant.id)

  // Docentes con scope 'salas_propias' ven solo sus salas (uid en docenteIds).
  // Docentes con scope 'institucion' (ej. administrativos) ven todas.
  const salas = claims?.scope === 'institucion'
    ? todasLasSalas
    : todasLasSalas.filter((s) => s.docenteIds?.includes(user?.uid ?? ''))

  const [salaId, setSalaId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [emailToast, setEmailToast] = useState<{ type: 'ok' | 'warn' | 'info'; msg: string } | null>(null)

  function showToast(type: 'ok' | 'warn' | 'info', msg: string) {
    setEmailToast({ type, msg })
    setTimeout(() => setEmailToast(null), 5000)
  }

  const salaActiva = salaId ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaActiva) ?? null
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
        descripcion="Comunicaciones a las familias"
        accion={salaActiva ? { label: 'Nueva nota', onClick: () => setModalOpen(true), icon: Plus } : undefined}
      />

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
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : notas.length === 0 ? (
        <EmptyState
          icon="📝"
          titulo="Sin notas aún"
          descripcion="Publicá la primera nota para las familias de tu sala."
          accion={{ label: 'Nueva nota', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {notas.map((nota) => (
            <NotaCard
              key={nota.id}
              nota={nota}
              totalAlumnos={sala?.alumnoIds?.length ?? 0}
              mode="docente"
              onToggleVisibilidad={handleToggle}
            />
          ))}
        </div>
      )}

      <NuevaNotaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        autorId={user?.uid ?? ''}
        autorNombre={user?.displayName ?? user?.email?.split('@')[0] ?? 'Docente'}
        autorRol="docente"
      />
    </div>
  )
}
