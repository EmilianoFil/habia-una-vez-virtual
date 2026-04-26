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

    // 5. Obtener datos del tenant para construir el link y enviar mail
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get()
    const tenantData = tenantDoc.data()
    const tenantSlug: string = tenantData?.config?.slug ?? tenantId

    // 6. Generar token de setup y guardarlo en Firestore (expira en 48h)
    const setupToken = randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000
    await adminDb.doc(`setupLinks/${setupToken}`).set({
      uid: userRecord.uid,
      email,
      tenantId,
      slug: tenantSlug,
      createdAt: Date.now(),
      expiresAt,
    })

    const APP_URL = process.env.APP_URL ?? 'https://habia-una-vez-virtual.web.app'
    const setupLink = `${APP_URL}/${tenantSlug}/configurar-clave?token=${setupToken}`

    // 7. Intentar enviar email (opcional, no bloquea la respuesta)
    let mailStatus: 'sent' | 'skipped' | 'error' = 'skipped'
    let mailError: string | null = null

    try {
      const emailSettings = tenantData?.configuracion?.emailSettings
      if (!emailSettings?.enabled) {
        mailStatus = 'skipped'
        mailError = 'Email desactivado o no configurado en Ajustes'
      } else {
        const generalTemplateUrl: string | null = tenantData?.configuracion?.emailTemplateUrl ?? null
        let templateHtml: string | null = null
        if (generalTemplateUrl) {
          const res = await fetch(generalTemplateUrl)
          if (res.ok) templateHtml = await res.text()
        }
        await sendWelcomeEmail(
          emailSettings,
          email,
          setupLink,
          tenantData?.config?.name ?? 'Institución',
          templateHtml
        )
        mailStatus = 'sent'
      }
    } catch (mailErr: any) {
      console.error('[API/admin/set-role] Error al enviar mail:', mailErr)
      mailStatus = 'error'
      mailError = mailErr?.message ?? 'Error desconocido al enviar mail'
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? `Usuario creado y rol ${role} asignado.` : `Rol ${role} asignado exitosamente.`,
      setupLink,
      uid: userRecord.uid,
      mailStatus,
      mailError,
    })

  } catch (error: any) {
    console.error('[API/admin/set-role] Error:', error)
    return NextResponse.json({ error: 'Error interno al procesar permisos' }, { status: 500 })
  }
}
