import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * POST /api/auth/setup-password
 * Permite a un usuario nuevo configurar su contraseña usando el token enviado por mail.
 * No requiere sesión activa — el token es la autorización.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token: string = body?.token
    const newPassword: string = body?.newPassword

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Verificar el token en Firestore
    const tokenDoc = await adminDb.doc(`setupLinks/${token}`).get()
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: 'El link es inválido o ya fue utilizado' }, { status: 400 })
    }

    const tokenData = tokenDoc.data()!
    if (Date.now() > tokenData.expiresAt) {
      await adminDb.doc(`setupLinks/${token}`).delete()
      return NextResponse.json({ error: 'El link expiró. Pedile a la institución que te reenvíe el acceso' }, { status: 400 })
    }

    // Actualizar la contraseña via Admin SDK
    await adminAuth.updateUser(tokenData.uid, { password: newPassword })

    // Invalidar el token (uso único)
    await adminDb.doc(`setupLinks/${token}`).delete()

    return NextResponse.json({ success: true, slug: tokenData.slug })
  } catch (error: any) {
    console.error('[API/setup-password]', error)
    return NextResponse.json({ error: 'Error al configurar la contraseña' }, { status: 500 })
  }
}
