import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// Middleware — ejecuta en el Edge, antes de renderizar
//
// Por ahora: pass-through básico.
// En pasos siguientes: verificación de sesión y roles.
// ============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pasar sin tocar rutas internas de Next.js y assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // TODO (Paso 2): verificar Firebase Auth session cookie
  // y redirigir si no hay sesión o el rol no tiene acceso a la ruta

  return NextResponse.next()
}

export const config = {
  // Aplica el middleware a todas las rutas excepto la raíz /api y assets estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
