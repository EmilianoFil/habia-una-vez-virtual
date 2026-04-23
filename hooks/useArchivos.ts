'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { SolicitudArchivo } from '@/lib/types'

export function useSolicitudes(tenantId: string | null, salaId?: string | null, alumnoId?: string | null) {
  const [solicitudes, setSolicitudes] = useState<SolicitudArchivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    // Para evitar la creación de Composite Indexes complejos por ahora en Firebase,
    // traeremos todas las solicitudes de la institución (si salaId o alumnoId se omiten)
    // o filtramos localmente si es necesario. (En procucción real a escala -> armar Composite Indexes)
    // Para simplificar, obtenemos los documentos en tiempo real y filtramos en frontend.
    
    const unsub = onSnapshot(
      collection(db, `tenants/${tenantId}/solicitudes`),
      (snap) => {
        let items = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }) as SolicitudArchivo)

        if (salaId) {
          items = items.filter(i => i.salaId === salaId)
        }
        if (alumnoId) {
          items = items.filter(i => i.alumnoId === alumnoId)
        }

        // Orden: pendientes primero (alerta), luego orden_crono_inverso
        items.sort((a, b) => {
          if (a.estado === 'pendiente' && b.estado === 'entregado') return -1;
          if (a.estado === 'entregado' && b.estado === 'pendiente') return 1;
          
          const ta = a.creadaEn?.toMillis?.() ?? 0
          const tb = b.creadaEn?.toMillis?.() ?? 0
          return tb - ta
        })

        setSolicitudes(items)
        setLoading(false)
      },
      (err) => {
        console.error('[useSolicitudes]', err)
        setLoading(false)
      }
    )

    return unsub
  }, [tenantId, salaId, alumnoId])

  return { solicitudes, loading }
}
