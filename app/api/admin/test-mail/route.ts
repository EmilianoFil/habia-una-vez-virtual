import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { EmailSettings } from '@/lib/types'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    if (!['admin', 'superadmin'].includes(decoded.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const settings: EmailSettings = body?.emailSettings

    if (!settings?.email || !settings?.appPassword) {
      return NextResponse.json({ error: 'Completá email y contraseña de aplicación antes de probar' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: settings.provider === 'gmail' ? 'gmail' : undefined,
      host: settings.provider === 'smtp' ? settings.host : undefined,
      port: settings.provider === 'smtp' ? settings.port : undefined,
      auth: { user: settings.email, pass: settings.appPassword },
      secure: settings.provider === 'smtp' && settings.port === 465,
    })

    await transporter.verify()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API/test-mail]', error)
    return NextResponse.json({ error: error?.message ?? 'Error al verificar la conexión' }, { status: 400 })
  }
}
