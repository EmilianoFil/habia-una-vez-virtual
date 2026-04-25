'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import {
  loginWithEmail,
  loginWithGoogle,
  googleProvider,
  getUserClaims,
  createSessionCookie,
  getRoleBasePath,
  getAuthErrorMessage,
} from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { user, claims, loading } = useAuth()
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (!loading && user && claims) {
      router.replace(getRoleBasePath(slug, claims.role))
    }
  }, [loading, user, claims, router, slug])

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await loginWithEmail(email, password)
      const userClaims = await getUserClaims(result.user, true) // force refresh para claims actualizados

      if (!userClaims) {
        setError('Tu cuenta no tiene permisos asignados. Contactá al administrador.')
        setIsSubmitting(false)
        return
      }

      // Verificar que el tenant coincide (excepto superadmin)
      if (
        userClaims.role !== 'superadmin' &&
        userClaims.tenantId &&
        userClaims.tenantId !== tenant.id
      ) {
        setError('Tu cuenta no pertenece a esta institución.')
        setIsSubmitting(false)
        return
      }

      await createSessionCookie(result.user)
      // Hard redirect: fuerza recarga completa para que el servidor lea la nueva cookie de sesión
      window.location.href = getRoleBasePath(slug, userClaims.role)
    } catch (err: any) {
      console.error('[Login] Error:', err)
      setError(err?.message || getAuthErrorMessage(err?.code ?? ''))
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await loginWithGoogle()
      const userClaims = await getUserClaims(result.user)

      if (!userClaims) {
        setError('Tu cuenta de Google no tiene permisos asignados. Contactá al administrador.')
        setIsSubmitting(false)
        return
      }

      if (
        userClaims.role !== 'superadmin' &&
        userClaims.tenantId &&
        userClaims.tenantId !== tenant.id
      ) {
        setError('Tu cuenta de Google no pertenece a esta institución.')
        setIsSubmitting(false)
        return
      }

      await createSessionCookie(result.user)
      window.location.href = getRoleBasePath(slug, userClaims.role)
    } catch (err: any) {
      console.error('[Login Google] Error:', err)
      setError(err?.message || getAuthErrorMessage(err?.code ?? ''))
      setIsSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo — branding (solo desktop) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Círculos decorativos */}
        <div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--color-primary-dark)' }}
        />
        <div
          className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        />

        {/* Contenido */}
        <div className="relative z-10 text-center">
          {tenant.logo ? (
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center overflow-hidden border border-white/10">
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          ) : (
            <div 
              className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center text-5xl font-bold border border-white/10"
              style={{ color: 'var(--color-primary-contrast)' }}
            >
              {tenant.name.charAt(0)}
            </div>
          )}

          <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--color-primary-contrast)' }}>{tenant.name}</h1>
          <p className="text-lg max-w-xs" style={{ color: 'var(--color-primary-contrast)', opacity: 0.8 }}>
            El portal digital de tu institución
          </p>

          {/* Features */}
          <div className="mt-12 space-y-3 text-left">
            {[
              '📚 Cuaderno de comunicaciones digital',
              '✅ Registro de asistencia',
              '📁 Gestión de archivos',
              '📅 Calendario de eventos',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-sm"
                style={{ color: 'var(--color-primary-contrast)', opacity: 0.9 }}
              >
                <span className="text-base">{feature.slice(0, 2)}</span>
                <span>{feature.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {tenant.logo ? (
                <Image src={tenant.logo} alt={tenant.name} width={48} height={48} className="object-contain" />
              ) : (
                tenant.name.charAt(0)
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Ingresá a tu cuenta</h2>
          <p className="text-gray-500 text-sm mb-8">
            Usá el email y contraseña que te dió la institución.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isSubmitting}
                className="input focus:ring-2 disabled:opacity-50"
                style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  className="input pr-12 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="btn-primary w-full py-3 mt-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : null}
              Ingresar
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Continuar con Google
          </button>

          {/* Contacto */}
          <p className="text-center text-xs text-gray-400 mt-8">
            ¿Problemas para ingresar?{' '}
            {tenant.contactInfo?.email ? (
              <a
                href={`mailto:${tenant.contactInfo.email}`}
                className="font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Contactá a la institución
              </a>
            ) : (
              <span>Contactá a la institución</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
