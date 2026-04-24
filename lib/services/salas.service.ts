import {
  collection, doc, addDoc, updateDoc, writeBatch,
  arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Sala } from '@/lib/types'

type CreateSalaData = Pick<Sala, 'nombre' | 'turnoId' | 'nivel' | 'cupo'>

export async function createSala(tenantId: string, data: CreateSalaData): Promise<string> {
  const ref = await addDoc(collection(db, `tenants/${tenantId}/salas`), {
    ...data,
    docenteIds: [],
    alumnoIds: [],
    activa: true,
    tenantId,
    creadaEn: serverTimestamp(),
  })
  return ref.id
}

export async function updateSala(
  tenantId: string,
  salaId: string,
  data: Partial<CreateSalaData & { emailTemplateUrl: string | null }>
): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/salas/${salaId}`), {
    ...data,
    actualizadaEn: serverTimestamp(),
  })
}

export async function deactivateSala(tenantId: string, salaId: string): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/salas/${salaId}`), { activa: false })
}

export async function addDocenteToSala(
  tenantId: string,
  salaId: string,
  docenteId: string
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, `tenants/${tenantId}/salas/${salaId}`), {
    docenteIds: arrayUnion(docenteId),
  })
  batch.update(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), {
    salasIds: arrayUnion(salaId),
  })
  await batch.commit()
}

export async function removeDocenteFromSala(
  tenantId: string,
  salaId: string,
  docenteId: string
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, `tenants/${tenantId}/salas/${salaId}`), {
    docenteIds: arrayRemove(docenteId),
  })
  batch.update(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), {
    salasIds: arrayRemove(salaId),
  })
  await batch.commit()
}
