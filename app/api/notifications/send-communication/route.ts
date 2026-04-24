import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendNoteEmail } from '@/lib/services/email.service'

const isDev = process.env.NODE_ENV === 'development'
const hasAdminCredentials =
  !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (!!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY)

/**
 * POST /api/notifications/send-communication
 * Envía notificaciones por email para una nota del cuaderno.
 * Requiere sesión activa de admin o docente del tenant.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar sesión
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let callerRole: string | null = null
    let callerTenantId: string | null = null

    if (isDev && !hasAdminCredentials) {
      // En desarrollo sin credenciales Admin: leer __claims (cookie no-httpOnly del login)
      const claimsCookie = request.cookies.get('__claims')?.value
      if (claimsCookie) {
        try {
          const parsed = JSON.parse(claimsCookie)
          callerRole = parsed.role ?? null
          callerTenantId = parsed.tenantId ?? null
        } catch {}
      }
    } else {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true)
      callerRole = (decodedToken.role as string) ?? null
      callerTenantId = (decodedToken.tenantId as string) ?? null
    }

    const ALLOWED_ROLES = ['superadmin', 'admin', 'docente', 'administrativo']
    if (!callerRole || !ALLOWED_ROLES.includes(callerRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 2. Parsear body
    let body: { tenantId?: string; salaId?: string; notaId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }
    const { tenantId, salaId, notaId } = body

    if (!tenantId || !salaId || !notaId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // 3. Verificar que el caller pertenezca al tenant (superadmin puede actuar en cualquiera)
    if (callerRole !== 'superadmin' && callerTenantId !== tenantId) {
      return NextResponse.json({ error: 'No autorizado para este tenant' }, { status: 403 })
    }

    // 1. Obtener la nota y el tenant
    const [notaDoc, tenantDoc] = await Promise.all([
      adminDb.doc(`tenants/${tenantId}/salas/${salaId}/notas/${notaId}`).get(),
      adminDb.doc(`tenants/${tenantId}`).get()
    ])

    if (!notaDoc.exists) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    const notaData = notaDoc.data()
    const tenantData = tenantDoc.data()
    const settings = tenantData?.configuracion?.emailSettings

    if (!settings?.enabled) {
      return NextResponse.json({ success: true, message: 'Envíos desactivados por configuración.' })
    }

    // 2. Determinar destinatarios (alumnos) y obtener template de email
    let alumnosIds: string[] = []
    let salaEmailTemplateUrl: string | null = null

    const salaDoc = await adminDb.doc(`tenants/${tenantId}/salas/${salaId}`).get()
    const salaData = salaDoc.data()
    salaEmailTemplateUrl = salaData?.emailTemplateUrl ?? null

    if (notaData?.alumnosDestino && notaData.alumnosDestino.length > 0) {
      alumnosIds = notaData.alumnosDestino
    } else {
      alumnosIds = salaData?.alumnoIds || []
    }

    // Resolver template: sala > general > null (usa default hardcoded)
    const generalTemplateUrl: string | null = tenantData?.configuracion?.emailTemplateUrl ?? null
    const templateUrl = salaEmailTemplateUrl ?? generalTemplateUrl ?? null

    let templateHtml: string | null = null
    if (templateUrl) {
      try {
        const res = await fetch(templateUrl)
        if (res.ok) templateHtml = await res.text()
      } catch {
        // Si falla la descarga del template, usa el default
      }
    }

    if (alumnosIds.length === 0) return NextResponse.json({ success: true, message: 'No hay alumnos destino.' })

    // 3. Obtener los emails de los tutores de esos alumnos
    // Buscamos en la colección /tenants/{tid}/tutores los que tengan el alumnoId en su lista
    // O más simple: consultamos los tutores filtrando por alumnoIds (si son pocos) o recorremos
    const tutoresSnap = await adminDb.collection(`tenants/${tenantId}/tutores`)
      .where('alumnoIds', 'array-contains-any', alumnosIds)
      .where('activo', '==', true)
      .get()

    const emails = Array.from(new Set(tutoresSnap.docs.map(d => d.data().email).filter(Boolean)))

    if (emails.length === 0) return NextResponse.json({ success: true, message: 'No hay tutores conectados con email.' })

    // 4. Enviar emails en paralelo (batching para evitar timeouts si son muchos)
    // Usamos el servicio de email
    const results = await Promise.allSettled(
      emails.map(email => sendNoteEmail(
        settings,
        email,
        notaData as any,
        tenantData?.config?.name || 'Había una vez',
        templateHtml
      ))
    )

    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ 
      success: true, 
      sentCount: successes,
      failCount: failures,
      totalRequested: emails.length
    })

  } catch (error: any) {
    console.error('[API/Notifications] Error:', error)
    return NextResponse.json({ error: 'Error al procesar notificaciones' }, { status: 500 })
  }
}
