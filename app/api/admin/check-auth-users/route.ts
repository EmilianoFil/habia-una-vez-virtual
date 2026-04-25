import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * POST /api/admin/check-auth-users
 * Verifica qué UIDs siguen existiendo en Firebase Auth.
 * body: { uids: string[] }
 * returns: { results: { uid: string; exists: boolean }[] }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('__session')?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await adminAuth.verifySessionCookie(sessionCookie, true)

    const body = await request.json()
    const uids: string[] = body?.uids ?? []

    if (!Array.isArray(uids) || uids.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const { users } = await adminAuth.getUsers(uids.map(uid => ({ uid })))
    const foundUids = new Set(users.map(u => u.uid))

    const results = uids.map(uid => ({ uid, exists: foundUids.has(uid) }))

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('[API/check-auth-users]', error)
    return NextResponse.json({ error: 'Error al verificar usuarios' }, { status: 500 })
  }
}
