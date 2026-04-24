'use client'

import { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { FileUp, FileText, Trash2, Loader2, Link as LinkIcon } from 'lucide-react'
import { AlumnoDocumento } from '@/lib/types'

interface DocumentUploadProps {
  documentos: AlumnoDocumento[]
  onChange: (docs: AlumnoDocumento[]) => void
  storagePath: string // e.g. "tenants/TID/alumnos/AID/medicos"
}

export function DocumentUpload({ documentos, onChange, storagePath }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [newName, setNewName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileName = newName.trim() || file.name
      const fileRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`)
      
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)

      const newDoc: AlumnoDocumento = {
        id: `doc-${Date.now()}`,
        nombre: fileName,
        url,
        fechaCarga: new Date().toISOString()
      }

      onChange([...documentos, newDoc])
      setNewName('')
    } catch (err) {
      console.error('[DocumentUpload] Error:', err)
      alert('Error al subir el documento')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeDoc(id: string) {
    onChange(documentos.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documentos.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{doc.nombre}</p>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600"
                >
                  <LinkIcon size={10} />
                  Ver archivo
                </a>
              </div>
            </div>
            <button 
              onClick={() => removeDoc(doc.id)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subir nuevo documento (Carnet, Certificado, etc.)</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            className="input text-sm flex-1" 
            placeholder="Nombre del documento (ej: Carnet Vacunación)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary px-6 py-2.5 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
            {uploading ? 'Subiendo...' : 'Elegir archivo'}
          </button>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
      </div>
    </div>
  )
}
