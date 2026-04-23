// ============================================================
// Typado global del proyecto Había una vez Virtual
// ============================================================

// --- Tenant / Institución ---

export interface TenantConfig {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  secondaryColor: string
  contactInfo?: {
    email?: string
    phone?: string
    address?: string
    website?: string
  }
}

export interface TenantFirestoreData {
  config: Omit<TenantConfig, 'id'>
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
  active: boolean
}

// --- Roles ---

export type UserRole = 'superadmin' | 'admin' | 'docente' | 'padre'

export interface UserCustomClaims {
  role: UserRole
  tenantId?: string // undefined para superadmin
}

// --- Sala ---

export interface Sala {
  id: string
  nombre: string
  turno: 'mañana' | 'tarde' | 'vespertino' | 'completo'
  nivel: string // "Jardín 3 años", "1° grado", etc.
  cupo: number
  docenteIds: string[]
  alumnoIds: string[]
  activa: boolean
  tenantId: string
}

// --- Alumno ---

export interface DatosPersonales {
  nombre: string
  apellido: string
  fechaNacimiento: string // ISO date string
  dni: string
  foto: string | null
}

export interface DatosMedicos {
  alergias: string
  medicacionHabitual: string
  obraSocial: string
  pediatraNombre: string
  pediatraTelefono: string
}

export interface ContactoEmergencia {
  nombre: string
  relacion: string
  telefono: string
}

export interface AutorizadoRetiro {
  nombre: string
  relacion: string
  telefono: string
  foto: string | null
  dni: string
}

export interface HistorialSala {
  salaId: string
  salaNombre: string
  cuadernoId: string
  desde: string // ISO date
  hasta: string | null // null si es la sala actual
}

export interface Alumno {
  id: string
  tenantId: string
  datosPersonales: DatosPersonales
  datosMedicos: DatosMedicos
  contactosEmergencia: ContactoEmergencia[]
  autorizados: AutorizadoRetiro[]
  tutorIds: string[]
  salaActualId: string | null
  historialSalas: HistorialSala[]
  activo: boolean
}

// --- Docente ---

export interface Docente {
  id: string
  tenantId: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
  turno: {
    nombre: string
    horarioIngreso: string // "08:00"
    horarioEgreso: string  // "12:00"
  }
  salasIds: string[]
  uid: string | null // Firebase Auth UID, null si no tiene login aún
  activo: boolean
}

// --- Tutor / Padre ---

export interface Tutor {
  id: string
  tenantId: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
  alumnoIds: string[]
  uid: string | null
  activo: boolean
}

// --- Cuaderno de Comunicaciones ---

export type TipoNota = 'general' | 'tarea' | 'recordatorio' | 'urgente' | 'autorizacion'

export interface AcuseRecibo {
  tutorId: string
  tutorNombre: string
  alumnoId: string
  fecha: string // ISO
}

export interface NotaAdjunto {
  nombre: string
  url: string
  tipo: string // MIME type
  tamaño: number // bytes
}

/**
 * NotaCuaderno — publicación de un admin o docente para una sala.
 * Estructura Firestore: /tenants/{tid}/salas/{sid}/notas/{nid}
 */
export interface NotaCuaderno {
  id: string
  titulo: string
  contenido: string
  tipo: TipoNota
  adjuntos: NotaAdjunto[]
  autorId: string
  autorNombre: string
  autorRol: 'admin' | 'docente'
  salaId: string
  tenantId: string
  creadaEn: any // Firestore Timestamp | null durante write pending
  acusesRecibo: AcuseRecibo[]
  alumnosDestino: string[] // vacío = todos en la sala
  visible: boolean
}

// Alias legacy
export type Nota = NotaCuaderno

// --- Solicitud de Archivos ---

export type EstadoSolicitud = 'pendiente' | 'entregado' | 'vencido'

export interface SolicitudArchivo {
  id: string
  tenantId: string
  titulo: string
  descripcion: string
  alumnoId: string
  alumnoNombre: string
  salaId: string
  fechaLimite: string | null
  vencimiento: string | null
  estado: EstadoSolicitud
  archivoUrl: string | null
  archivoNombre: string | null
  creadaPorId: string
  creadaPorNombre: string
  creadaEn: any // Firestore Timestamp
  entregadaEn: any | null // Firestore Timestamp
}

// --- Comunicaciones Masivas ---

export interface Comunicacion {
  id: string
  tenantId: string
  asunto: string
  cuerpo: string // HTML
  destinatarios: {
    tipo: 'institucion' | 'sala' | 'turno' | 'seleccion'
    salaId?: string
    turno?: string
    tutorIds?: string[]
  }
  programadaPara: string | null // null = enviar inmediatamente
  enviadaEn: string | null
  estado: 'borrador' | 'programada' | 'enviada' | 'error'
  creadaPorId: string
}

// --- Eventos / Calendario ---

export interface Evento {
  id: string
  tenantId: string
  nombre: string
  fecha: string // ISO datetime
  descripcion: string
  alcance: {
    tipo: 'institucion' | 'sala'
    salaId?: string
  }
  recordatorioDias: number // días antes para enviar el recordatorio
  recordatorioEnviado: boolean
}

// --- Asistencia ---

export type EstadoAsistencia = 'presente' | 'ausente' | 'tarde'

export interface RegistroAsistenciaAlumno {
  estado: EstadoAsistencia
  nota?: string
}

/**
 * AsistenciaDia — registro diario de una sala
 * Estructura: /tenants/{tenantId}/salas/{salaId}/asistencias/{YYYY-MM-DD}
 */
export interface AsistenciaDia {
  id: string // YYYY-MM-DD
  tenantId: string
  salaId: string
  fecha: string // ISO date (solo YYYY-MM-DD para queries)
  registros: Record<string, RegistroAsistenciaAlumno> // userId -> registro
  registradaPorId: string
  registradaPorNombre: string
  actualizadaEn: any // Firestore Timestamp
}

// --- Utilidades ---

// Timestamp de Firestore (simplificado para compatibilidad)
export type FirestoreTimestamp = {
  seconds: number
  nanoseconds: number
}

// API Response genérico
export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}
