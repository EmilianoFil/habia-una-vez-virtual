import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bienvenidos',
  description: 'Plataforma digital de gestión para jardines de infantes y escuelas primarias.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-xl font-bold">
            ✨
          </div>
          <span className="font-bold text-lg">Había una vez Virtual</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="mailto:hola@habíaunavez.com" className="text-slate-400 hover:text-white transition-colors">
            Contacto
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Plataforma en construcción — acceso por institución
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            La plataforma digital
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              para tu institución educativa
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Gestión de alumnos, cuaderno de comunicaciones, asistencia, archivos
            y más — todo en un solo lugar, con el branding de tu jardín.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: '📚', label: 'Cuaderno Digital' },
              { icon: '📋', label: 'Asistencia' },
              { icon: '📁', label: 'Archivos' },
              { icon: '📅', label: 'Calendario' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm text-slate-300 font-medium">{feature.label}</div>
              </div>
            ))}
          </div>

          {/* CTA info */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md mx-auto backdrop-blur-sm">
            <div className="text-slate-400 text-sm mb-4">
              ¿Tenés tu institución registrada?
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-4 py-3 text-slate-300 text-sm font-mono">
              <span className="text-slate-500">app.dominio.com/</span>
              <span className="text-indigo-400">tu-institucion</span>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Si tu institución ya está registrada, accedé desde el link
              que te dimos al crear tu cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-600 text-sm">
        © {new Date().getFullYear()} Había una vez Virtual — Todos los derechos reservados
      </footer>
    </main>
  )
}
