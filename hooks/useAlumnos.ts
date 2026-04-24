'use client'

import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Alumno } from '@/lib/types'

export function useAlumnos(tenantId: string | null, salaId?: string) {
  const [todos, setTodos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }

    const q = query(collection(db, `tenants/${tenantId}/alumnos`), limit(500))
    const unsub = onSnapshot(
      q,
      (snap) => {
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alumno)
        items = items.filter((a) => a.activo !== false)
        if (salaId) items = items.filter((a) => a.salaActualId === salaId)
        items.sort((a, b) =>
          `${a.datosPersonales?.apellido} ${a.datosPersonales?.nombre}`
            .localeCompare(`${b.datosPersonales?.apellido} ${b.datosPersonales?.nombre}`)
        )
        setTodos(items)
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) }
    )
    return unsub
  }, [tenantId, salaId])

  return { alumnos: todos, loading, error }
}

export function useAlumno(tenantId: string | null, alumnoId: string | null) {
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !alumnoId) { setLoading(false); return }

    const unsub = onSnapshot(
      doc(db, `tenants/${tenantId}/alumnos/${alumnoId}`),
      (snap) => {
        setAlumno(snap.exists() ? ({ id: snap.id, ...snap.data() } as Alumno) : null)
        setLoading(false)
      }
    )
    return unsub
  }, [tenantId, alumnoId])

  return { alumno, loading }
}
