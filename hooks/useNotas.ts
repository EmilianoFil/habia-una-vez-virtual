'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NotaCuaderno } from '@/lib/types'

/** Notas en tiempo real para una sala específica (admin / docente) */
export function useNotasDeSala(tenantId: string | null, salaId: string | null) {
  const [notas, setNotas] = useState<NotaCuaderno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !salaId) { setLoading(false); return }

    const unsub = onSnapshot(
      collection(db, `tenants/${tenantId}/salas/${salaId}/notas`),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as NotaCuaderno)
          .filter((n) => n.visible !== false)
          .sort((a, b) => {
            const ta = a.creadaEn?.toMillis?.() ?? 0
            const tb = b.creadaEn?.toMillis?.() ?? 0
            return tb - ta
          })
        setNotas(items)
        setLoading(false)
      },
      (err) => { console.error('[useNotas]', err); setLoading(false) }
    )
    return unsub
  }, [tenantId, salaId])

  return { notas, loading }
}
