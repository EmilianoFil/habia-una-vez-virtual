import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { doc, updateDoc } from 'firebase/firestore'

/**
 * POST /api/admin/toggle-user-status
 * Habilita o deshabilita una cuenta de Firebase Auth
 * Body: { uid, disabled: boolean, tenantId }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const callerToken = await adminAuth.verifySessionCookie(sessionCookie, true)
    const isSuperadmin = callerToken.role === 'superadmin'
    const isAdmin = callerToken.role === 'admin'

    let uid: string, disabled: boolean, tenantId: string
    try {
      const body = await request.json()
      uid = body?.uid
      disabled = body?.disabled
      tenantId = body?.tenantId
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    if (!uid || disabled === undefined || !tenantId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    if (!isSuperadmin) {
      if (!isAdmin || callerToken.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
      }
    }

    await adminAuth.updateUser(uid, { disabled })

    return NextResponse.json({ 
      success: true, 
      message: disabled ? 'Cuenta deshabilitada.' : 'Cuenta habilitada.',
    })
  } catch (error: any) {
    console.error('[API/toggle-user-status] Error:', error)
    return NextResponse.json({ error: error.message ?? 'Error interno' }, { status: 500 })
  }
}
