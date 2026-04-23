import { collection, doc, writeBatch, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { SolicitudArchivo } from '@/lib/types'

export interface CreateSolicitudMasivaData {
  titulo: string
  descripcion: string
  salaId: string
  fechaLimite: string | null
  creadaPorId: string
  creadaPorNombre: string
  alumnos: Array<{ id: string, nombre: string }>
}

/**
 * Crea solicitudes de forma masiva para todos los alumnos seleccionados de una sala
 */
export async function createSolicitudMasiva(
  tenantId: string, 
  data: CreateSolicitudMasivaData
): Promise<void> {
  const batch = writeBatch(db)

  data.alumnos.forEach((al) => {
    const docRef = doc(collection(db, `tenants/${tenantId}/solicitudes`))
    batch.set(docRef, {
      tenantId,
      titulo: data.titulo,
      descripcion: data.descripcion,
      alumnoId: al.id,
      alumnoNombre: al.nombre,
      salaId: data.salaId,
      fechaLimite: data.fechaLimite,
      estado: 'pendiente',
      archivoUrl: null,
      archivoNombre: null,
      creadaPorId: data.creadaPorId,
      creadaPorNombre: data.creadaPorNombre,
      creadaEn: serverTimestamp(),
      entregadaEn: null
    })
  })

  await batch.commit()
}

/**
 * Se ejecuta cuando un padre sube el archivo solicitado
 */
export async function entregarArchivo(
  tenantId: string,
  solicitudId: string,
  file: File
): Promise<void> {
  // Primero subir a Storage
  const storageRef = ref(storage, `tenants/${tenantId}/solicitudes/${solicitudId}/${file.name}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)

  // Luego actualizar el documento
  await updateDoc(doc(db, `tenants/${tenantId}/solicitudes/${solicitudId}`), {
    estado: 'entregado',
    archivoUrl: url,
    archivoNombre: file.name,
    entregadaEn: serverTimestamp()
  })
}

/**
 * Un Admin/Docente puede desvincular el archivo si el padre subió algo erróneo, 
 * devolviéndolo a estado Pendiente.
 */
export async function rechazarArchivo(tenantId: string, solicitudId: string): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/solicitudes/${solicitudId}`), {
    estado: 'pendiente',
    archivoUrl: null,
    archivoNombre: null,
    entregadaEn: null
  })
}

/**
 * Elimina una solicitud completamente
 */
export async function deleteSolicitud(tenantId: string, solicitudId: string): Promise<void> {
  await deleteDoc(doc(db, `tenants/${tenantId}/solicitudes/${solicitudId}`))
}
