import {
  collection, doc, addDoc, updateDoc, serverTimestamp,
  writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Docente } from '@/lib/types'

export type CreateDocenteData = Pick<
  Docente,
  'nombre' | 'apellido' | 'email' | 'telefono' | 'dni' | 'turno' | 'salasIds'
>

export async function createDocente(
  tenantId: string,
  data: CreateDocenteData
): Promise<string> {
  const ref = await addDoc(collection(db, `tenants/${tenantId}/docentes`), {
    ...data,
    salasIds: [],
    uid: null,
    activo: true,
    tenantId,
    creadoEn: serverTimestamp(),
  })
  return ref.id
}

/**
 * Actualiza un docente y sincroniza sala.docenteIds en las salas afectadas.
 * oldSalasIds: lista anterior de salas (para saber cuáles remover).
 */
export async function updateDocente(
  tenantId: string,
  docenteId: string,
  data: Partial<CreateDocenteData>,
  oldSalasIds?: string[]
): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), {
    ...data,
    actualizadoEn: serverTimestamp(),
  })

  // Sincronizar sala.docenteIds si se actualizó salasIds
  if (data.salasIds !== undefined && oldSalasIds !== undefined) {
    const added = data.salasIds.filter(id => !oldSalasIds.includes(id))
    const removed = oldSalasIds.filter(id => !data.salasIds!.includes(id))

    for (const salaId of added) {
      batch.update(doc(db, `tenants/${tenantId}/salas/${salaId}`), {
        docenteIds: arrayUnion(docenteId),
      })
    }
    for (const salaId of removed) {
      batch.update(doc(db, `tenants/${tenantId}/salas/${salaId}`), {
        docenteIds: arrayRemove(docenteId),
      })
    }
  }

  await batch.commit()
}

export async function deactivateDocente(tenantId: string, docenteId: string): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), { activo: false })
}
