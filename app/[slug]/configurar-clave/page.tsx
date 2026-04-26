'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'

const PARENTESCO_OPCIONES = ['Mamá', 'Papá', 'Tutor/a', 'Abuelo/a', 'Otro']

export default function ConfigurarClavePage() {
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const slug = params.slug as string

  const [nombre, setNombre] = useState('')
  const [parentesco, setParentesco] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Link inválido</h2>
          <p className="text-sm text-gray-500">Este link no es válido. Pedile a la institución que te reenvíe el acceso.</p>
          <button onClick={() => router.push(`/${slug}/login`)} className="btn-primary w-full py-3">
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('Por favor ingresá tu nombre')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
          nombre: nombre.trim(),
          parentesco: parentesco || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${slug}/login`)
      }, 2500)
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error. Intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurá tu acceso</h1>
          <p className="text-sm text-gray-500 mt-2">
            Completá tus datos para ingresar a <strong>{tenant.name}</strong>.
          </p>
        </div>

        {success ? (
          <div className="card p-8 text-center space-y-4">
            <CheckCircle size={48} className="text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">¡Listo!</h2>
            <p className="text-sm text-gray-500">Tu acceso fue configurado. Te estamos redirigiendo al login...</p>
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: María García"
                  required
                  disabled={isSubmitting}
                  className="input disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parentesco / Rol <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select
                  value={parentesco}
                  onChange={e => setParentesco(e.target.value)}
                  disabled={isSubmitting}
                  className="input disabled:opacity-50"
                >
                  <option value="">Seleccioná...</option>
                  {PARENTESCO_OPCIONES.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={isSubmitting}
                    className="input pr-12 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Repetí la contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repetí tu contraseña"
                  required
                  disabled={isSubmitting}
                  className="input disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !nombre.trim() || !password || !confirm}
                className="btn-primary w-full py-3 mt-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {isSubmitting ? 'Configurando...' : 'Guardar y continuar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
