'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Sala } from '@/lib/types'

export function useSalas(tenantId: string | null) {
  const [todas, setTodas] = useState<Sala[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    const unsub = onSnapshot(
      collection(db, `tenants/${tenantId}/salas`),
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Sala)
        setTodas(items.sort((a, b) => a.nombre.localeCompare(b.nombre)))
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) }
    )
    return unsub
  }, [tenantId])

  const salas = todas.filter((s) => s.activa !== false)
  const todasInclusoInactivas = todas

  return { salas, todasInclusoInactivas, loading, error }
}
