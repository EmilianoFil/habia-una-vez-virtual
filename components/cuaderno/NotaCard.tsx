'use client'

import { useState } from 'react'
import { FileText, Image, Download, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, MessageSquare, Send } from 'lucide-react'
import { NotaCuaderno, Respuesta } from '@/lib/types'
import { TIPO_NOTA_CONFIG } from '@/lib/services/cuaderno.service'
import { formatRelativo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NotaCardProps {
  nota: NotaCuaderno
  /** Cantidad total de alumnos en la sala (para calcular % acuses) */
  totalAlumnos?: number
  /** Modo vista */
  mode: 'admin' | 'docente' | 'padre'
  /** ID del alumno del padre (para checkear si ya acusó) */
  alumnoIdPadre?: string
  /** UID del tutor (para checkear acuse y enviarlo) */
  tutorId?: string
  tutorNombre?: string
  onAcusar?: (notaId: string) => Promise<void>
  onToggleVisibilidad?: (notaId: string, visible: boolean) => Promise<void>
  onResponder?: (notaId: string, contenido: string) => Promise<void>
  /** Si el padre puede responder (feature flag) */
  puedeResponder?: boolean
}

function fileTipoIcon(tipo: string) {
  if (tipo.startsWith('image/')) return <Image size={14} />
  return <FileText size={14} />
}

function formatTamaño(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function autorRolLabel(rol: string) {
  if (rol === 'admin') return 'Administración'
  if (rol === 'docente') return 'Docente'
  if (rol === 'padre') return 'Familia'
  return rol
}

export function NotaCard({
  nota,
  totalAlumnos = 0,
  mode,
  alumnoIdPadre,
  tutorId,
  tutorNombre,
  onAcusar,
  onToggleVisibilidad,
  onResponder,
  puedeResponder = false,
}: NotaCardProps) {
  const config = TIPO_NOTA_CONFIG[nota.tipo] ?? TIPO_NOTA_CONFIG.general
  const [expandido, setExpandido] = useState(false)
  const [acusando, setAcusando] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [enviandoReply, setEnviandoReply] = useState(false)

  const yaAcusó = alumnoIdPadre
    ? nota.acusesRecibo?.some((a) => a.alumnoId === alumnoIdPadre && a.tutorId === tutorId)
    : false

  const cantAcuses = nota.acusesRecibo?.length ?? 0
  const respuestas = nota.respuestas ?? []
  const contenidoLargo = nota.contenido?.length > 200
  const contenidoMostrado =
    contenidoLargo && !expandido
      ? nota.contenido.slice(0, 200).trim() + '…'
      : nota.contenido

  const canReply = onResponder && (
    mode === 'admin' ||
    mode === 'docente' ||
    (mode === 'padre' && puedeResponder)
  )

  async function handleAcusar() {
    if (!onAcusar) return
    setAcusando(true)
    try {
      await onAcusar(nota.id)
    } finally {
      setAcusando(false)
    }
  }

  async function handleToggle() {
    if (!onToggleVisibilidad) return
    setToggling(true)
    try {
      await onToggleVisibilidad(nota.id, !nota.visible)
    } finally {
      setToggling(false)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || !onResponder) return
    setEnviandoReply(true)
    try {
      await onResponder(nota.id, replyText.trim())
      setReplyText('')
    } finally {
      setEnviandoReply(false)
    }
  }

  return (
    <article
      className="card overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeft: `4px solid ${config.border}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipo badge */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            <span>{config.emoji}</span>
            {config.label}
          </span>
          {/* Padre badge */}
          {nota.autorRol === 'padre' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100">
              👨‍👩‍👧 Familia
            </span>
          )}
          {/* Urgente pulse */}
          {nota.tipo === 'urgente' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{formatRelativo(nota.creadaEn)}</span>
          {/* Toggle visibilidad (solo admin/docente) */}
          {(mode === 'admin' || mode === 'docente') && onToggleVisibilidad && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
              title={nota.visible ? 'Ocultar nota' : 'Mostrar nota'}
            >
              {toggling ? <Loader2 size={14} className="animate-spin" /> :
                nota.visible ? <Eye size={14} /> : <EyeOff size={14} />
              }
            </button>
          )}
        </div>
      </div>

      {/* Autor */}
      <p className="px-5 text-xs text-gray-400 -mt-1 mb-3">
        {nota.autorNombre} · {autorRolLabel(nota.autorRol)}
      </p>

      {/* Contenido */}
      <div className="px-5">
        <h3 className="font-bold text-gray-900 text-base mb-2 leading-snug">
          {nota.titulo}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {contenidoMostrado}
        </p>
        {contenidoLargo && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="text-xs font-medium mt-1.5 flex items-center gap-1 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {expandido ? (
              <><ChevronUp size={13} /> Ver menos</>
            ) : (
              <><ChevronDown size={13} /> Ver más</>
            )}
          </button>
        )}
      </div>

      {/* Adjuntos */}
      {nota.adjuntos?.length > 0 && (
        <div className="px-5 mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">ADJUNTOS</p>
          <div className="flex flex-col gap-1.5">
            {nota.adjuntos.map((adj, i) => (
              <a
                key={i}
                href={adj.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  {fileTipoIcon(adj.tipo)}
                </span>
                <span className="text-sm text-gray-700 truncate flex-1">{adj.nombre}</span>
                <span className="text-xs text-gray-400">{formatTamaño(adj.tamaño)}</span>
                <Download size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Respuestas */}
      {(respuestas.length > 0 || canReply) && (
        <div className="px-5 mt-4">
          {/* Toggle para mostrar/ocultar respuestas */}
          {respuestas.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 text-xs font-semibold mb-2 hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              <MessageSquare size={13} />
              {respuestas.length} {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
              {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {showReplies && respuestas.length > 0 && (
            <div className="space-y-2.5 mb-3 pl-3 border-l-2 border-gray-100">
              {respuestas.map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-800 text-xs">{r.autorNombre}</span>
                    <span className="text-[10px] text-gray-400">{autorRolLabel(r.autorRol)}</span>
                    <span className="text-[10px] text-gray-300 ml-auto">{formatRelativo(r.creadaEn)}</span>
                  </div>
                  <p className="text-gray-600 mt-0.5 leading-snug whitespace-pre-wrap">{r.contenido}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input para nueva respuesta */}
          {canReply && (
            <form onSubmit={handleReply} className="flex items-end gap-2 mt-2 mb-1">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribí una respuesta..."
                className="flex-1 input resize-none py-2 text-sm min-h-[40px] max-h-[100px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(e as any)
                  }
                }}
                disabled={enviandoReply}
              />
              <button
                type="submit"
                disabled={enviandoReply || !replyText.trim()}
                className="p-2.5 rounded-xl text-white disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {enviandoReply ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className={cn(
          'px-5 py-4 mt-4 flex items-center justify-between border-t border-gray-50',
          nota.tipo === 'urgente' ? 'bg-red-50/40' : ''
        )}
      >
        {/* Acuses stats */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(3, cantAcuses) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                ✓
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {cantAcuses > 0
              ? totalAlumnos > 0
                ? `${cantAcuses} de ${totalAlumnos} acusaron recibo`
                : `${cantAcuses} acuse${cantAcuses !== 1 ? 's' : ''} de recibo`
              : 'Sin acuses aún'}
          </span>
        </div>

        {/* Botón acusar (solo padre, y solo si no acusó) */}
        {mode === 'padre' && !yaAcusó && onAcusar && (
          <button
            onClick={handleAcusar}
            disabled={acusando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {acusando ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Acusar recibo
          </button>
        )}
        {mode === 'padre' && yaAcusó && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
            <CheckCircle2 size={13} />
            Recibo acusado
          </span>
        )}
      </div>
    </article>
  )
}
