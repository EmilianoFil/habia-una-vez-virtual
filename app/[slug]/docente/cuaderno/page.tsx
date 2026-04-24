'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
  const { salas } = useSalas(tenant.id)

  // Docente solo ve sus salas asignadas
  // TODO: filtrar por claims.docenteId cuando esté disponible
  // Por ahora muestra todas (el docente solo tiene acceso a /docente/* igual)
  const [salaId, setSalaId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const salaActiva = salaId ?? salas[0]?.id ?? null
  const sala = salas.find((s) => s.id === salaActiva) ?? null
  const { notas, loading } = useNotasDeSala(tenant.id, salaActiva)

  async function handleCreate(data: CreateNotaData) {
    if (!salaActiva) return
    const id = await createNota(tenant.id, salaActiva, data)
    
    // Notificar por mail (background)
    fetch('/api/notifications/send-communication', {
      method: 'POST',
      body: JSON.stringify({ tenantId: tenant.id, salaId: salaActiva, notaId: id })
    }).catch(err => console.error('[Notification] Error triggering email:', err))
  }

  async function handleToggle(notaId: string, visible: boolean) {
    if (!salaActiva) return
    await toggleVisibilidadNota(tenant.id, salaActiva, notaId, visible)
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
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
