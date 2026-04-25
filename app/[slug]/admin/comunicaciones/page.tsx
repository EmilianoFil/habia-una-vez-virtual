'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Megaphone, Send, CheckCircle, AlertCircle, Info, Loader2, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Comunicado {
  id: string
  titulo: string
  contenido: string
  autorNombre: string
  creadoEn: Timestamp | null
  sentCount: number
  failCount: number
  totalDestinatarios: number
}

type ToastType = 'ok' | 'warn' | 'info'

export default function AdminComunicacionesPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()

  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null)

  function showToast(type: ToastType, msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 6000)
  }

  // Cargar historial de comunicados
  useEffect(() => {
    if (!tenant.id) return
    const q = query(
      collection(db, `tenants/${tenant.id}/comunicados`),
      orderBy('creadoEn', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setComunicados(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comunicado)))
      setLoading(false)
    })
    return unsub
  }, [tenant.id])

  function openModal() {
    setTitulo('')
    setContenido('')
    setModalOpen(true)
  }

  async function handleSend() {
    if (!titulo.trim() || !contenido.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/notifications/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          autorNombre: user?.displayName ?? user?.email?.split('@')[0] ?? 'Administración',
        }),
      })
      const json = await res.json()
      setModalOpen(false)

      if (!res.ok) {
        showToast('warn', `Error al enviar: ${json.error ?? 'error desconocido'}`)
      } else if (json.message) {
        showToast('info', json.message)
      } else {
        const fails = json.failCount > 0 ? ` (${json.failCount} fallaron)` : ''
        showToast(
          json.failCount > 0 ? 'warn' : 'ok',
          `Comunicado enviado a ${json.sentCount} familia${json.sentCount !== 1 ? 's' : ''}${fails}.`
        )
      }
    } catch {
      showToast('warn', 'No se pudo verificar el envío.')
    } finally {
      setSending(false)
    }
  }

  function formatFecha(ts: Timestamp | null) {
    if (!ts) return '—'
    return ts.toDate().toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold max-w-sm transition-all ${
          toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          toast.type === 'warn' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'ok' ? <CheckCircle size={18} className="shrink-0 text-emerald-500" /> :
           toast.type === 'warn' ? <AlertCircle size={18} className="shrink-0 text-amber-500" /> :
           <Info size={18} className="shrink-0 text-blue-500" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <PageHeader
        titulo="Comunicados"
        descripcion="Enviá mensajes a todas las familias registradas"
        accion={{ label: 'Nuevo comunicado', onClick: openModal, icon: Megaphone }}
      />

      {/* Historial */}
      {loading ? (
        <SkeletonList count={3} />
      ) : comunicados.length === 0 ? (
        <div className="card p-10 text-center">
          <Megaphone size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">Sin comunicados enviados aún</p>
          <p className="text-sm text-gray-400 mt-1">Los comunicados llegan por email a todas las familias registradas.</p>
          <button onClick={openModal} className="btn-primary mt-5 px-6 py-2.5 text-sm">
            Enviar primer comunicado
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {comunicados.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{c.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.contenido}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <Users size={11} />
                  {c.sentCount ?? 0}
                  {c.failCount > 0 && (
                    <span className="text-amber-600 ml-1">· {c.failCount} fallaron</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{c.autorNombre}</span>
                <span>·</span>
                <span>{formatFecha(c.creadoEn)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !sending && setModalOpen(false)}
        title="Nuevo comunicado"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setModalOpen(false)}
              disabled={sending}
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !titulo.trim() || !contenido.trim()}
              className="btn-primary px-5 py-2 flex items-center gap-2"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Enviando...' : 'Enviar a todos'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>Se enviará un email a <strong>todas las familias registradas</strong> en el sistema.</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto *</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Reunión de padres — 15 de mayo"
              className="input"
              maxLength={100}
              disabled={sending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje *</label>
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder="Escribí el cuerpo del comunicado..."
              className="input min-h-[140px] resize-y"
              disabled={sending}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
