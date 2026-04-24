import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { UserRole } from '@/lib/types'

// ============================================================
// POST /api/superadmin/set-role — asignar rol a un usuario
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión del superadmin
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true)
    if (decodedToken.role !== 'superadmin') {
      return NextResponse.json({ error: 'Prohibido: Se requiere superadmin' }, { status: 403 })
    }

    // 2. Procesar body
    let email: string, role: string, tenantId: string | undefined
    try {
      const body = await request.json()
      email = body?.email
      role = body?.role
      tenantId = body?.tenantId
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    if (!email || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const validRoles: UserRole[] = ['admin', 'docente', 'padre', 'superadmin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // 3. Buscar usuario por email
    let userRecord
    try {
      userRecord = await adminAuth.getUserByEmail(email)
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'El usuario no está registrado en Firebase' }, { status: 404 })
      }
      throw e
    }

    // 4. Aplicar Custom Claims
    const claims = {
      role,
      tenantId: role === 'superadmin' ? null : tenantId
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, claims)

    return NextResponse.json({ 
      success: true, 
      message: `Rol ${role} asignado a ${email} correctamente.` 
    })

  } catch (error: any) {
    console.error('[API/set-role] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
