'use client'

import { useState, useRef } from 'react'
import { Loader2, X, Paperclip, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { TipoNota } from '@/lib/types'
import { TIPO_NOTA_CONFIG, CreateNotaData } from '@/lib/services/cuaderno.service'

const TIPOS: TipoNota[] = ['general', 'tarea', 'recordatorio', 'urgente', 'autorizacion']

interface NuevaNotaModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateNotaData) => Promise<void>
  autorId: string
  autorNombre: string
  autorRol: 'admin' | 'docente'
  defaultTipo?: TipoNota
}

export function NuevaNotaModal({
  open,
  onClose,
  onSubmit,
  autorId,
  autorNombre,
  autorRol,
  defaultTipo = 'general',
}: NuevaNotaModalProps) {
  const [tipo, setTipo] = useState<TipoNota>(defaultTipo)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setTipo(defaultTipo)
    setTitulo('')
    setContenido('')
    setFiles([])
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    setFiles((prev) => {
      const all = [...prev, ...newFiles]
      // Limitar a 5 archivos
      return all.slice(0, 5)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('El título es obligatorio.'); return }
    if (!contenido.trim()) { setError('El contenido no puede estar vacío.'); return }

    setSaving(true)
    setError(null)
    try {
      await onSubmit({ titulo: titulo.trim(), contenido: contenido.trim(), tipo, files, autorId, autorNombre, autorRol })
      resetForm()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Error al publicar la nota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nueva nota"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="btn-secondary px-4 py-2">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary px-5 py-2"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? 'Publicando…' : '📤 Publicar nota'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Tipo selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de nota</label>
          <div className="grid grid-cols-5 gap-2">
            {TIPOS.map((t) => {
              const cfg = TIPO_NOTA_CONFIG[t]
              const selected = tipo === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center"
                  style={{
                    borderColor: selected ? cfg.border : 'transparent',
                    backgroundColor: selected ? cfg.bg : '#f9fafb',
                    color: selected ? cfg.color : '#9ca3af',
                  }}
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className="text-[10px] font-semibold leading-tight">{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={
              tipo === 'tarea' ? 'Ej: Traer materiales el lunes' :
              tipo === 'urgente' ? 'Ej: Cambio de horario hoy' :
              tipo === 'recordatorio' ? 'Ej: Acto del 25 de mayo' :
              tipo === 'autorizacion' ? 'Ej: Autorización salida didáctica' :
              'Título de la nota'
            }
            className="input text-base font-semibold"
            required
          />
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenido *</label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribí el mensaje para las familias..."
            className="input resize-none"
            rows={5}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{contenido.length} caracteres</p>
        </div>

        {/* Adjuntos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjuntos <span className="text-gray-400 font-normal">(hasta 5 archivos)</span>
          </label>

          {files.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl"
                >
                  <Paperclip size={13} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Upload size={16} />
              Seleccionar archivos
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileAdd}
          />
        </div>
      </form>
    </Modal>
  )
}
