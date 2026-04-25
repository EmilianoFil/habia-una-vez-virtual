import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendWelcomeEmail } from '@/lib/services/email.service'

// ============================================================
// POST /api/admin/set-role — asignar rol dentro de un tenant
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión del usuario que hace la petición
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const callerToken = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    // Solo puede entrar si es superadmin (global) o admin del tenant específico
    const isSuperadmin = callerToken.role === 'superadmin'
    const isAdmin = callerToken.role === 'admin'

    // 2. Procesar body
    let email: string, role: string, tenantId: string, scope: string | undefined
    try {
      const body = await request.json()
      email = body?.email
      role = body?.role
      tenantId = body?.tenantId
      scope = body?.scope
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    if (!email || !role || !tenantId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Seguridad: si es admin (pero no superadmin), solo puede actuar en su propio tenant
    if (!isSuperadmin) {
      if (!isAdmin || callerToken.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Prohibido: No tienes permisos para este tenant' }, { status: 403 })
      }
      
      // Un admin no puede crear otros admins ni superadmins (por ahora)
      if (role === 'admin' || role === 'superadmin') {
        return NextResponse.json({ error: 'No tienes permisos para asignar este rol' }, { status: 403 })
      }
    }

    // 3. Buscar o crear usuario
    let userRecord
    let isNewUser = false
    try {
      userRecord = await adminAuth.getUserByEmail(email)
      // Si la cuenta existía pero estaba deshabilitada, la re-habilitamos
      if (userRecord.disabled) {
        await adminAuth.updateUser(userRecord.uid, { disabled: false })
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // CREAR USUARIO si no existe (con password aleatorio)
        const tempPassword = randomBytes(12).toString('base64url') + 'A1!'
        userRecord = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName: email.split('@')[0],
        })
        isNewUser = true
      } else {
        throw e
      }
    }

    // 4. Aplicar Custom Claims (incluyendo scope si viene)
    const claims: Record<string, any> = { role, tenantId }
    if (scope) claims.scope = scope

    await adminAuth.setCustomUserClaims(userRecord.uid, claims)

    // 5. Generar link de cambio de contraseña e intentar enviar email si está configurado
    const resetLink = await adminAuth.generatePasswordResetLink(email)

    // 6. Intentar enviar email (opcional, no bloquea la respuesta)
    try {
      const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get()
      const tenantData = tenantDoc.data()
      const emailSettings = tenantData?.config?.configuracion?.emailSettings
      if (emailSettings?.enabled) {
        const generalTemplateUrl: string | null = tenantData?.config?.configuracion?.emailTemplateUrl ?? null
        let templateHtml: string | null = null
        if (generalTemplateUrl) {
          const res = await fetch(generalTemplateUrl)
          if (res.ok) templateHtml = await res.text()
        }
        await sendWelcomeEmail(
          emailSettings,
          email,
          resetLink,
          tenantData.config.name,
          templateHtml
        )
      }
    } catch (mailErr) {
      console.error('[API/admin/set-role] Error al enviar mail:', mailErr)
      // No devolvemos error aquí para que el proceso de alta no falle
    }

    return NextResponse.json({ 
      success: true, 
      message: isNewUser ? `Usuario creado y rol ${role} asignado.` : `Rol ${role} asignado exitosamente.`,
      resetLink,
      uid: userRecord.uid
    })

  } catch (error: any) {
    console.error('[API/admin/set-role] Error:', error)
    return NextResponse.json({ error: 'Error interno al procesar permisos' }, { status: 500 })
  }
}
