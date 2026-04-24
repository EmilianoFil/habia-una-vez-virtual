import {
  collection, doc, addDoc, updateDoc, serverTimestamp,
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

export async function updateDocente(
  tenantId: string,
  docenteId: string,
  data: Partial<CreateDocenteData>
): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), {
    ...data,
    actualizadoEn: serverTimestamp(),
  })
}

export async function deactivateDocente(tenantId: string, docenteId: string): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/docentes/${docenteId}`), { activo: false })
}
