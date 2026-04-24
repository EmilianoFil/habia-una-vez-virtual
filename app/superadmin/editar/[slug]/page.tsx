'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ArrowLeft, Building, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditarTenantPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#64748b'
  })

  useEffect(() => {
    async function loadTenant() {
      try {
        const tenantRef = doc(db, 'tenants', slug)
        const snap = await getDoc(tenantRef)
        
        if (!snap.exists()) {
          setError('La institución no existe.')
          setLoading(false)
          return
        }

        const data = snap.data()
        setFormData({
          name: data.config?.name || 'Sin nombre',
          primaryColor: data.config?.primaryColor || '#4f46e5',
          secondaryColor: data.config?.secondaryColor || '#64748b'
        })
      } catch (err) {
        console.error('Error al cargar tenant:', err)
        setError('Error al cargar datos de la institución.')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      loadTenant()
    }
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!formData.name) {
        throw new Error('El nombre de la institución es obligatorio.')
      }

      const tenantRef = doc(db, 'tenants', slug)
      
      await updateDoc(tenantRef, {
        'config.name': formData.name,
        'config.primaryColor': formData.primaryColor,
        'config.secondaryColor': formData.secondaryColor,
        updatedAt: serverTimestamp()
      })

      router.push('/superadmin')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar la institución.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/superadmin" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Building size={16} />
            </div>
            <span className="font-bold">Editar Institución</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Nombre de la Institución *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">URL / Slug de acceso</label>
              <div className="flex items-center relative">
                <span className="absolute left-4 text-slate-500 text-sm pointer-events-none">habia-una-vez-virtual.web.app/</span>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-[230px] pr-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500">El slug no se puede cambiar luego de crear la institución.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                  Color Primario
                  <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">{formData.primaryColor}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-slate-950 border border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                  Color Secundario
                  <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">{formData.secondaryColor}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer bg-slate-950 border border-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Link 
                href="/superadmin"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar cambios
              </button>
            </div>

          </form>
        )}
      </main>
    </div>
  )
}
