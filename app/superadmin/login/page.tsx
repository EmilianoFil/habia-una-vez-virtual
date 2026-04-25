'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {
  getUserClaims,
  createSessionCookie,
  getAuthErrorMessage,
} from '@/lib/auth'

export default function SuperadminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya hay sesión de servidor activa (cookie __claims) y es superadmin, redirigir
  useEffect(() => {
    try {
      const claimsCookie = document.cookie
        .split('; ')
        .find(c => c.startsWith('__claims='))
        ?.split('=')
        .slice(1)
        .join('=')
      if (claimsCookie) {
        const claims = JSON.parse(decodeURIComponent(claimsCookie))
        if (claims?.role === 'superadmin') {
          window.location.href = '/superadmin'
        }
      }
    } catch {}
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      // Forzar refresh para obtener los claims más recientes del servidor
      const claims = await getUserClaims(result.user, true)

      if (claims?.role !== 'superadmin') {
        setError('No tenés permisos de superadmin.')
        await auth.signOut()
        setIsSubmitting(false)
        return
      }

      await createSessionCookie(result.user)
      // Hard redirect: fuerza recarga completa para que el servidor lea la cookie de sesión
      window.location.href = '/superadmin'
    } catch (err: any) {
      setError(err?.message || getAuthErrorMessage(err?.code ?? ''))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Superadmin</h1>
          <p className="text-slate-400 text-sm mt-1">Acceso restringido</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
