import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Institución no encontrada',
}

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-8 bg-gray-50">
      <div className="text-center max-w-md animate-fade-in">
        <div className="text-8xl mb-6">🏫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Institución no encontrada
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          No encontramos ninguna institución registrada con ese nombre.
          Verificá que la URL sea correcta o contactate con la administración.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
