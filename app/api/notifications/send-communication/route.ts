import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendNoteEmail } from '@/lib/services/email.service'

/**
 * POST /api/notifications/send-communication
 * Envía notificaciones por email para una nota del cuaderno
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, salaId, notaId } = await request.json()

    if (!tenantId || !salaId || !notaId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // 1. Obtener la nota y el tenant
    const [notaDoc, tenantDoc] = await Promise.all([
      adminDb.doc(`tenants/${tenantId}/salas/${salaId}/notas/${notaId}`).get(),
      adminDb.doc(`tenants/${tenantId}`).get()
    ])

    if (!notaDoc.exists) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    const notaData = notaDoc.data()
    const tenantData = tenantDoc.data()
    const settings = tenantData?.config?.configuracion?.emailSettings

    if (!settings?.enabled) {
      return NextResponse.json({ message: 'Envíos desactivados por configuración.' })
    }

    // 2. Determinar destinatarios (alumnos)
    let alumnosIds: string[] = []
    if (notaData?.alumnosDestino && notaData.alumnosDestino.length > 0) {
      alumnosIds = notaData.alumnosDestino
    } else {
      const salaDoc = await adminDb.doc(`tenants/${tenantId}/salas/${salaId}`).get()
      alumnosIds = salaDoc.data()?.alumnoIds || []
    }

    if (alumnosIds.length === 0) return NextResponse.json({ message: 'No hay alumnos destino.' })

    // 3. Obtener los emails de los tutores de esos alumnos
    // Buscamos en la colección /tenants/{tid}/tutores los que tengan el alumnoId en su lista
    // O más simple: consultamos los tutores filtrando por alumnoIds (si son pocos) o recorremos
    const tutoresSnap = await adminDb.collection(`tenants/${tenantId}/tutores`)
      .where('alumnoIds', 'array-contains-any', alumnosIds)
      .where('activo', '==', true)
      .get()

    const emails = Array.from(new Set(tutoresSnap.docs.map(d => d.data().email).filter(Boolean)))

    if (emails.length === 0) return NextResponse.json({ message: 'No hay tutores conectados con email.' })

    // 4. Enviar emails en paralelo (batching para evitar timeouts si son muchos)
    // Usamos el servicio de email
    const results = await Promise.allSettled(
      emails.map(email => sendNoteEmail(
        settings,
        email,
        notaData as any,
        tenantData?.config?.name || 'Había una vez'
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
