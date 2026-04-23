'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AsistenciaDia } from '@/lib/types'

export function useAsistenciaDia(tenantId: string | null, salaId: string | null, fechaStr: string /* YYYY-MM-DD */) {
  const [asistencia, setAsistencia] = useState<AsistenciaDia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !salaId || !fechaStr) {
      setAsistencia(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = onSnapshot(
      doc(db, `tenants/${tenantId}/salas/${salaId}/asistencias/${fechaStr}`),
      (snap) => {
        if (snap.exists()) {
          setAsistencia({ id: snap.id, ...snap.data() } as AsistenciaDia)
        } else {
          setAsistencia(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('[useAsistenciaDia]', err)
        setLoading(false)
      }
    )

    return unsub
  }, [tenantId, salaId, fechaStr])

  return { asistencia, loading }
}
