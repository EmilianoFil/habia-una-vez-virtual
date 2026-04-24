import {
  collection, doc, writeBatch, arrayUnion, arrayRemove,
  serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Alumno, DatosPersonales, DatosMedicos, ContactoEmergencia, AutorizadoRetiro } from '@/lib/types'

export interface CreateAlumnoData {
  datosPersonales: DatosPersonales
  datosMedicos: DatosMedicos
  contactosEmergencia: ContactoEmergencia[]
  autorizados: AutorizadoRetiro[]
  salaActualId: string | null
  salaNombre?: string
}

export async function createAlumno(
  tenantId: string,
  data: CreateAlumnoData
): Promise<string> {
  const alumnosRef = collection(db, `tenants/${tenantId}/alumnos`)
  const alumnoRef = doc(alumnosRef)

  const historialSalas = data.salaActualId
    ? [{
        salaId: data.salaActualId,
        salaNombre: data.salaNombre ?? '',
        cuadernoId: '',
        desde: new Date().toISOString(),
        hasta: null,
      }]
    : []

  const batch = writeBatch(db)

  batch.set(alumnoRef, {
    datosPersonales: data.datosPersonales,
    datosMedicos: data.datosMedicos,
    contactosEmergencia: data.contactosEmergencia,
    autorizados: data.autorizados,
    tutorIds: [],
    salaActualId: data.salaActualId,
    historialSalas,
    activo: true,
    tenantId,
    creadoEn: serverTimestamp(),
  })

  if (data.salaActualId) {
    batch.update(doc(db, `tenants/${tenantId}/salas/${data.salaActualId}`), {
      alumnoIds: arrayUnion(alumnoRef.id),
    })
  }

  await batch.commit()
  return alumnoRef.id
}

export async function updateAlumno(
  tenantId: string,
  alumnoId: string,
  data: Partial<Omit<Alumno, 'id' | 'tenantId'>>
): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/alumnos/${alumnoId}`), {
    ...data,
    actualizadoEn: serverTimestamp(),
  })
}

export async function cambiarSalaAlumno(
  tenantId: string,
  alumnoId: string,
  salaAnteriorId: string | null,
  salaNuevaId: string | null,
  salaNuevaNombre: string
): Promise<void> {
  const batch = writeBatch(db)
  const alumnoRef = doc(db, `tenants/${tenantId}/alumnos/${alumnoId}`)

  // Cerrar sala anterior en historial
  if (salaAnteriorId) {
    batch.update(doc(db, `tenants/${tenantId}/salas/${salaAnteriorId}`), {
      alumnoIds: arrayRemove(alumnoId),
    })
  }

  // Agregar a sala nueva
  if (salaNuevaId) {
    batch.update(doc(db, `tenants/${tenantId}/salas/${salaNuevaId}`), {
      alumnoIds: arrayUnion(alumnoId),
    })
  }

  batch.update(alumnoRef, {
    salaActualId: salaNuevaId,
    historialSalas: arrayUnion({
      salaId: salaNuevaId ?? '',
      salaNombre: salaNuevaNombre,
      cuadernoId: '',
      desde: new Date().toISOString(),
      hasta: null,
    }),
    actualizadoEn: serverTimestamp(),
  })

  await batch.commit()
}

export async function deactivateAlumno(tenantId: string, alumnoId: string): Promise<void> {
  await updateDoc(doc(db, `tenants/${tenantId}/alumnos/${alumnoId}`), { activo: false })
}

/**
 * Vincula un tutor (usuario con rol padre) a un alumno y crea su registro de tutor si no existe
 */
export async function vincularTutorAlumno(
  tenantId: string,
  alumnoId: string,
  uid: string,
  tutorData: { nombre: string, email: string }
): Promise<void> {
  const batch = writeBatch(db)
  
  // 1. Agregar UID al alumno
  const alumnoRef = doc(db, `tenants/${tenantId}/alumnos/${alumnoId}`)
  batch.update(alumnoRef, {
    tutorIds: arrayUnion(uid)
  })

  // 2. Crear o actualizar el perfil del Tutor
  const tutorRef = doc(db, `tenants/${tenantId}/tutores/${uid}`)
  batch.set(tutorRef, {
    id: uid,
    uid,
    tenantId,
    nombre: tutorData.nombre,
    email: tutorData.email,
    alumnoIds: arrayUnion(alumnoId),
    activo: true,
    actualizadoEn: serverTimestamp()
  }, { merge: true })

  await batch.commit()
}
