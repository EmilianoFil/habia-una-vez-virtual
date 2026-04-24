'use client'

import { useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { FileCode, X, Loader2, Upload } from 'lucide-react'

interface HtmlTemplateUploadProps {
  value: string | null | undefined
  onChange: (url: string | null) => void
  storagePath: string
  label?: string
  description?: string
}

export function HtmlTemplateUpload({
  value,
  onChange,
  storagePath,
  label,
  description,
}: HtmlTemplateUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.html') && file.type !== 'text/html') {
      setError('Solo se permiten archivos .html')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file, { contentType: 'text/html' })
      const url = await getDownloadURL(storageRef)
      onChange(url)
    } catch (err: any) {
      setError('Error al subir el archivo: ' + (err.message ?? err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}

      {value ? (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <FileCode size={18} className="text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800 truncate">template.html</p>
            <p className="text-[10px] text-indigo-400 uppercase tracking-wider">Template activo</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-all"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-gray-400 hover:text-indigo-500 group"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin shrink-0" />
          ) : (
            <Upload size={18} className="shrink-0" />
          )}
          <span className="text-sm font-medium">
            {uploading ? 'Subiendo...' : 'Subir template.html'}
          </span>
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      <div className="text-[10px] text-gray-400 leading-relaxed space-y-0.5">
        <p>Variables disponibles en el template:</p>
        <p className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-500">
          {'{{titulo}} {{contenido}} {{contenido_texto}} {{autor}} {{rol}} {{institucion}} {{app_url}} {{fecha}}'}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
