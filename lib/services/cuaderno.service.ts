import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { NotaCuaderno, TipoNota, AcuseRecibo, NotaAdjunto } from '@/lib/types'

// ============================================================
// Config visual por tipo de nota — fuente única de verdad
// ============================================================

export const TIPO_NOTA_CONFIG: Record<
  TipoNota,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  general: {
    label: 'General',
    emoji: '📢',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
  },
  tarea: {
    label: 'Tarea',
    emoji: '📝',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  recordatorio: {
    label: 'Recordatorio',
    emoji: '🔔',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
  },
  urgente: {
    label: 'Urgente',
    emoji: '🚨',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
  },
  autorizacion: {
    label: 'Autorización',
    emoji: '✍️',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
}

// ============================================================
// Crear nota (con upload de adjuntos)
// ============================================================

export interface CreateNotaData {
  titulo: string
  contenido: string
  tipo: TipoNota
  files: File[]
  autorId: string
  autorNombre: string
  autorRol: 'admin' | 'docente'
  alumnosDestino?: string[]
}

export async function createNota(
  tenantId: string,
  salaId: string,
  data: CreateNotaData
): Promise<string> {
  // Crear referencia primero para tener ID antes de subir archivos
  const notaRef = doc(collection(db, `tenants/${tenantId}/salas/${salaId}/notas`))

  // Subir adjuntos a Storage
  const adjuntos: NotaAdjunto[] = []
  for (const file of data.files) {
    try {
      const storageRef = ref(
        storage,
        `tenants/${tenantId}/salas/${salaId}/notas/${notaRef.id}/${file.name}`
      )
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      adjuntos.push({ nombre: file.name, url, tipo: file.type, tamaño: file.size })
    } catch (err) {
      console.error('[Cuaderno] Error subiendo adjunto:', file.name, err)
    }
  }

  await setDoc(notaRef, {
    titulo: data.titulo,
    contenido: data.contenido,
    tipo: data.tipo,
    adjuntos,
    autorId: data.autorId,
    autorNombre: data.autorNombre,
    autorRol: data.autorRol,
    salaId,
    tenantId,
    acusesRecibo: [],
    alumnosDestino: data.alumnosDestino ?? [],
    visible: true,
    creadaEn: serverTimestamp(),
  })

  return notaRef.id
}

// ============================================================
// Acusar recibo
// ============================================================

export async function acusarRecibo(
  tenantId: string,
  salaId: string,
  notaId: string,
  acuse: AcuseRecibo
): Promise<void> {
  await updateDoc(
    doc(db, `tenants/${tenantId}/salas/${salaId}/notas/${notaId}`),
    { acusesRecibo: arrayUnion(acuse) }
  )
}

// ============================================================
// Ocultar / mostrar nota
// ============================================================

export async function toggleVisibilidadNota(
  tenantId: string,
  salaId: string,
  notaId: string,
  visible: boolean
): Promise<void> {
  await updateDoc(
    doc(db, `tenants/${tenantId}/salas/${salaId}/notas/${notaId}`),
    { visible }
  )
}
