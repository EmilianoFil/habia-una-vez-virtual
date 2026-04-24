'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Docente } from '@/lib/types'

export function useDocentes(tenantId: string | null) {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    const q = query(collection(db, `tenants/${tenantId}/docentes`), limit(500))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Docente)
          .filter((d) => d.activo !== false)
          .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
        setDocentes(items)
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) }
    )
    return unsub
  }, [tenantId])

  return { docentes, loading, error }
}
