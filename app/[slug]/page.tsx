'use client'

import Image from 'next/image'
import { useTenant } from '@/contexts/TenantContext'

// ============================================================
// Página de bienvenida del tenant — placeholder del Paso 1
// Se reemplazará con dashboard real en pasos siguientes
// ============================================================

export default function TenantHomePage() {
  const { tenant } = useTenant()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header básico con branding */}
      <header
        className="px-6 py-4 flex items-center gap-4 shadow-sm"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="flex items-center gap-3">
          {tenant.logo ? (
            <Image
              src={tenant.logo}
              alt={`Logo de ${tenant.name}`}
              width={40}
              height={40}
              className="rounded-xl object-contain bg-white p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {tenant.name.charAt(0)}
            </div>
          )}
          <span className="text-white font-bold text-lg">{tenant.name}</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-2xl mx-auto text-center animate-slide-up">
          {/* Ícono principal */}
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center text-5xl"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            🎒
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            ¡Bienvenidos a{' '}
            <span style={{ color: 'var(--color-primary)' }}>
              {tenant.name}
            </span>
            !
          </h1>

          <p className="text-lg text-gray-500 mb-12 leading-relaxed">
            La plataforma digital de tu institución está lista.
            Pronto acá vas a encontrar el cuaderno de comunicaciones,
            la asistencia, el calendario y mucho más.
          </p>

          {/* Cards de módulos en coming soon */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {[
              { icon: '📚', label: 'Cuaderno', desc: 'Comunicaciones' },
              { icon: '✅', label: 'Asistencia', desc: 'Registro diario' },
              { icon: '📁', label: 'Archivos', desc: 'Documentos' },
              { icon: '📅', label: 'Calendario', desc: 'Eventos' },
              { icon: '👨‍👩‍👧', label: 'Alumnos', desc: 'Gestión' },
              { icon: '📢', label: 'Comunicados', desc: 'Para todos' },
            ].map((mod) => (
              <div
                key={mod.label}
                className="card p-5 flex flex-col gap-2 opacity-60 cursor-default"
              >
                <div className="text-2xl">{mod.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{mod.label}</div>
                <div className="text-xs text-gray-500">{mod.desc}</div>
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Próximamente
                </div>
              </div>
            ))}
          </div>

          {/* Tenant info debug — solo en dev */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-12 text-left bg-gray-100 rounded-xl p-4 text-xs text-gray-500">
              <summary className="cursor-pointer font-mono font-semibold mb-2">
                🛠 Debug: Tenant Config
              </summary>
              <pre className="overflow-auto">{JSON.stringify(tenant, null, 2)}</pre>
            </details>
          )}
        </div>
      </main>
    </div>
  )
}
