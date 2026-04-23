import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from '@/lib/types'

// ============================================================
// Middleware — protección de rutas por sesión
//
// Lógica:
// - Rutas públicas: /, /api/*, /superadmin/login, /[slug]/login
// - Rutas protegidas: todo lo demás
// - En desarrollo SIN admin credentials: pass-through (auth es client-side)
// - En producción: verifica cookie __session + redirige según rol
// ============================================================

const isDev = process.env.NODE_ENV === 'development'
const hasAdminCredentials =
  !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (!!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY)

function getRoleBasePath(slug: string, role: UserRole): string {
  switch (role) {
    case 'superadmin': return '/superadmin'
    case 'admin': return `/${slug}/admin`
    case 'docente': return `/${slug}/docente`
    case 'padre': return `/${slug}/padre`
    default: return `/${slug}/login`
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar rutas internas de Next.js, assets y API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon') ||
    pathname.includes('/icons/') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next()
  }

  // En desarrollo sin credenciales: dejar pasar todo (RoleGuard client-side)
  if (isDev && !hasAdminCredentials) {
    return NextResponse.next()
  }

  const parts = pathname.split('/').filter(Boolean)
  const firstSegment = parts[0]        // slug o 'superadmin'
  const secondSegment = parts[1]       // 'login', 'admin', 'docente', 'padre', etc.
  const isLoginPage = secondSegment === 'login' || pathname === '/superadmin/login'
  const isRootPage = !firstSegment     // ruta "/"

  const sessionCookie = request.cookies.get('__session')?.value
  const claimsCookie = request.cookies.get('__claims')?.value

  let parsedClaims: { role: UserRole; tenantId?: string } | null = null
  if (claimsCookie) {
    try { parsedClaims = JSON.parse(claimsCookie) } catch {}
  }

  // --- Superadmin routes ---
  if (firstSegment === 'superadmin') {
    if (pathname === '/superadmin/login') {
      // Si ya está logueado como superadmin, redirigir a su panel
      if (sessionCookie && parsedClaims?.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.next()
    }
    // Panel superadmin: requiere sesión + rol superadmin
    if (!sessionCookie || parsedClaims?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
    return NextResponse.next()
  }

  // --- Landing (/) ---
  if (isRootPage || !firstSegment) {
    return NextResponse.next()
  }

  // --- Tenant routes /[slug]/*** ---
  const slug = firstSegment

  if (isLoginPage) {
    // Ya logueado → redirigir a su dashboard
    if (sessionCookie && parsedClaims?.role) {
      return NextResponse.redirect(
        new URL(getRoleBasePath(slug, parsedClaims.role), request.url)
      )
    }
    return NextResponse.next()
  }

  // Rutas protegidas del tenant
  if (!sessionCookie) {
    return NextResponse.redirect(new URL(`/${slug}/login`, request.url))
  }

  // Verificación de rol vs ruta
  if (parsedClaims?.role && secondSegment) {
    const expectedSegment = parsedClaims.role === 'superadmin'
      ? 'superadmin'
      : parsedClaims.role // 'admin', 'docente', 'padre'

    // Si el role segment no coincide con la ruta solicitada, redirigir al correcto
    if (
      secondSegment !== expectedSegment &&
      ['admin', 'docente', 'padre'].includes(secondSegment)
    ) {
      return NextResponse.redirect(
        new URL(getRoleBasePath(slug, parsedClaims.role), request.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}
