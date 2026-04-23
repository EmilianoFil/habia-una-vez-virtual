import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AsistenciaDia, RegistroAsistenciaAlumno } from '@/lib/types'

export async function saveAsistenciaDia(
  tenantId: string,
  salaId: string,
  fechaStr: string, // YYYY-MM-DD
  data: {
    registros: Record<string, RegistroAsistenciaAlumno>
    registradaPorId: string
    registradaPorNombre: string
  }
): Promise<void> {
  const docRef = doc(db, `tenants/${tenantId}/salas/${salaId}/asistencias/${fechaStr}`)
  
  await setDoc(docRef, {
    registros: data.registros,
    registradaPorId: data.registradaPorId,
    registradaPorNombre: data.registradaPorNombre,
    fecha: fechaStr,
    salaId,
    tenantId,
    actualizadaEn: serverTimestamp(),
  }, { merge: true }) // merge to avoid overwriting existing data completely if we append fields
}

export async function getAsistenciaDia(
  tenantId: string,
  salaId: string,
  fechaStr: string
): Promise<AsistenciaDia | null> {
  const docRef = doc(db, `tenants/${tenantId}/salas/${salaId}/asistencias/${fechaStr}`)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as AsistenciaDia
}
