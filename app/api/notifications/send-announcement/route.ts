import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendAnnouncementEmail } from '@/lib/services/email.service'
import { FieldValue } from 'firebase-admin/firestore'

const isDev = process.env.NODE_ENV === 'development'
const hasAdminCredentials =
  !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  (!!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY)

/**
 * POST /api/notifications/send-announcement
 * Envía un comunicado institucional a TODOS los tutores activos del tenant.
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
    let callerUid: string | null = null

    if (isDev && !hasAdminCredentials) {
      const claimsCookie = request.cookies.get('__claims')?.value
      if (claimsCookie) {
        try {
          const parsed = JSON.parse(claimsCookie)
          callerRole = parsed.role ?? null
          callerTenantId = parsed.tenantId ?? null
          callerUid = parsed.uid ?? null
        } catch {}
      }
    } else {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true)
      callerRole = (decodedToken.role as string) ?? null
      callerTenantId = (decodedToken.tenantId as string) ?? null
      callerUid = decodedToken.uid ?? null
    }

    if (!callerRole || !['superadmin', 'admin', 'administrativo'].includes(callerRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 2. Parsear body
    let body: { tenantId?: string; titulo?: string; contenido?: string; autorNombre?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const { tenantId, titulo, contenido, autorNombre } = body
    if (!tenantId || !titulo || !contenido) {
      return NextResponse.json({ error: 'Faltan parámetros: tenantId, titulo, contenido' }, { status: 400 })
    }

    if (callerRole !== 'superadmin' && callerTenantId !== tenantId) {
      return NextResponse.json({ error: 'No autorizado para este tenant' }, { status: 403 })
    }

    // 3. Obtener config del tenant
    const tenantDoc = await adminDb.doc(`tenants/${tenantId}`).get()
    const tenantData = tenantDoc.data()
    const settings = tenantData?.configuracion?.emailSettings

    if (!settings?.enabled) {
      return NextResponse.json({ success: true, message: 'Envíos desactivados por configuración.' })
    }

    // 4. Resolver template general
    const generalTemplateUrl: string | null = tenantData?.configuracion?.emailTemplateUrl ?? null
    let templateHtml: string | null = null
    if (generalTemplateUrl) {
      try {
        const res = await fetch(generalTemplateUrl)
        if (res.ok) templateHtml = await res.text()
      } catch {}
    }

    // 5. Obtener todos los tutores activos
    const tutoresSnap = await adminDb
      .collection(`tenants/${tenantId}/tutores`)
      .where('activo', '==', true)
      .get()

    const emails = Array.from(
      new Set(tutoresSnap.docs.map(d => d.data().email as string).filter(Boolean))
    )

    if (emails.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay tutores registrados con email.' })
    }

    const tenantName = tenantData?.config?.name ?? 'Institución'
    const autor = autorNombre ?? 'Administración'

    // 6. Enviar emails
    const results = await Promise.allSettled(
      emails.map(email =>
        sendAnnouncementEmail(settings, email, titulo, contenido, autor, tenantName, templateHtml)
      )
    )

    const sentCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length

    // 7. Guardar historial en Firestore
    await adminDb.collection(`tenants/${tenantId}/comunicados`).add({
      titulo,
      contenido,
      autorId: callerUid,
      autorNombre: autor,
      creadoEn: FieldValue.serverTimestamp(),
      sentCount,
      failCount,
      totalDestinatarios: emails.length,
    })

    return NextResponse.json({ success: true, sentCount, failCount, totalRequested: emails.length })
  } catch (error: any) {
    console.error('[API/Announcement] Error:', error)
    return NextResponse.json({ error: 'Error al enviar comunicado' }, { status: 500 })
  }
}
