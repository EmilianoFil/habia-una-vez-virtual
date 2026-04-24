import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000 // 5 días
const SESSION_DURATION_S = 60 * 60 * 24 * 5        // 5 días en segundos
const isDev = process.env.NODE_ENV === 'development'

function hasAdminCredentials(): boolean {
  return (
    !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (!!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY)
  )
}

// ============================================================
// POST /api/auth/session — crear session cookie desde ID token
// ============================================================
export async function POST(request: NextRequest) {
  try {
    let idToken: string | undefined
    try {
      const body = await request.json()
      idToken = body?.idToken
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }
    if (!idToken) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })

    // --- DEV sin credenciales Admin: usar el idToken como session "liviana" ---
    if (isDev && !hasAdminCredentials()) {
      let claimsData = { role: null, tenantId: null, uid: '' }
      try {
        // Decodificamos el payload sin verificar (solo para dev)
        const payload = JSON.parse(
          Buffer.from(idToken.split('.')[1], 'base64url').toString()
        )
        claimsData = {
          role: payload.role ?? null,
          tenantId: payload.tenantId ?? null,
          uid: payload.sub ?? '',
        }
      } catch {}

      response.cookies.set('__session', `dev:${idToken.slice(0, 30)}`, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      })
      response.cookies.set('__claims', JSON.stringify(claimsData), {
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      })
      return response
    }

    // --- PRODUCCIÓN: Admin SDK ---
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })

    const claimsData = {
      role: decodedToken.role ?? null,
      tenantId: decodedToken.tenantId ?? null,
      uid: decodedToken.uid,
    }

    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_S,
      path: '/',
    })
    response.cookies.set('__claims', JSON.stringify(claimsData), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_S,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('[API/session] Error:', error?.errorInfo?.code ?? error)
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
  }
}

// ============================================================
// DELETE /api/auth/session — cerrar sesión
// ============================================================
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('__session')
  response.cookies.delete('__claims')
  return response
}
