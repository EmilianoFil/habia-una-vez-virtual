import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Evento } from '@/lib/types'

export type CreateEventoData = Omit<Evento, 'id' | 'tenantId' | 'recordatorioEnviado'>

export async function createEvento(tenantId: string, data: CreateEventoData): Promise<string> {
  const ref = await addDoc(collection(db, `tenants/${tenantId}/eventos`), {
    ...data,
    tenantId,
    recordatorioEnviado: false,
    creadoEn: serverTimestamp(),
  })
  return ref.id
}

export async function updateEvento(tenantId: string, eventoId: string, data: Partial<CreateEventoData>): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/eventos/${eventoId}`), {
    ...data,
    actualizadoEn: serverTimestamp(),
  })
}

export async function deleteEvento(tenantId: string, eventoId: string): Promise<void> {
  await deleteDoc(doc(db, `tenants/${tenantId}/eventos/${eventoId}`))
}
