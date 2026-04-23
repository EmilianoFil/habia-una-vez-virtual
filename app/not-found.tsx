import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white flex items-center justify-center px-8">
      <div className="text-center max-w-md animate-fade-in">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-4">Página no encontrada</h1>
        <p className="text-slate-400 mb-8">
          La URL que buscás no existe o la institución no está registrada en la plataforma.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          ← Ir al inicio
        </Link>
      </div>
    </main>
  )
}
