'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Tutor {
  id: string
  uid: string
  nombre: string
  email: string
  activo: boolean
  alumnoIds: string[]
  lastLogin?: string
}

export function useTutores(tenantId: string | null, alumnoId?: string) {
  const [tutores, setTutores] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    let q = query(collection(db, `tenants/${tenantId}/tutores`))
    if (alumnoId) {
      q = query(q, where('alumnoIds', 'array-contains', alumnoId))
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tutor))
        setTutores(items)
        setLoading(false)
      }
    )
    return unsub
  }, [tenantId, alumnoId])

  return { tutores, loading }
}
