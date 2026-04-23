'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Evento } from '@/lib/types'

export function useEventos(tenantId: string | null, salaIdFilter?: string | null) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    // Traemos todos los eventos (ordenados por fecha). En este caso podríamos filtrar solo el año actual,
    // pero al ser un MVP, traerlos ordenados escala bien al principio.
    // En Firestore, no podemos hacer orderBy o >, < sin índices, pero acá no son miles de eventos.
    const q = query(
      collection(db, `tenants/${tenantId}/eventos`)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Evento)
        
        // Filtro local estricto:
        // Si hay un salaIdFilter (ej: padre logueado con un alumno), solo mostrar eventos de "institucion" o de "su sala".
        if (salaIdFilter) {
          items = items.filter(
            e => e.alcance.tipo === 'institucion' || (e.alcance.tipo === 'sala' && e.alcance.salaId === salaIdFilter)
          )
        }
        
        // Orden cronológico
        items.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        
        setEventos(items)
        setLoading(false)
      },
      (err) => {
        console.error('[useEventos]', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [tenantId, salaIdFilter])

  return { eventos, loading, error }
}
