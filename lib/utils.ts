import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma segura, resolviendo conflictos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha ISO a formato argentino: "23 de abril de 2026"
 */
export function formatFecha(
  isoDate: string,
  opciones?: Intl.DateTimeFormatOptions
): string {
  return new Date(isoDate).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opciones,
  })
}

/**
 * Formatea una fecha y hora ISO a formato argentino corto: "23/04/2026 15:30"
 */
export function formatFechaHora(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calcula la edad a partir de una fecha de nacimiento ISO.
 */
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const mes = hoy.getMonth() - nac.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
    edad--
  }
  return edad
}

/**
 * Calcula la edad detallada: "3 años y 2 meses"
 */
export function calcularEdadDetalle(fechaNacimiento: string): string {
  if (!fechaNacimiento) return ''
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  
  let years = hoy.getFullYear() - nac.getFullYear()
  let months = hoy.getMonth() - nac.getMonth()
  let days = hoy.getDate() - nac.getDate()

  if (days < 0) {
    months--
  }
  if (months < 0) {
    years--
    months += 12
  }

  const yPart = years === 1 ? '1 año' : `${years} años`
  const mPart = months === 1 ? '1 mes' : `${months} meses`

  if (years === 0) return mPart
  if (months === 0) return yPart
  return `${yPart} y ${mPart}`
}

/**
 * Convierte un color hex a componentes RGB.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Determina si un color de fondo requiere texto oscuro o claro.
 * Usa luminancia relativa según WCAG.
 */
export function textColorForBackground(hexBg: string): 'dark' | 'light' {
  const rgb = hexToRgb(hexBg)
  if (!rgb) return 'dark'
  // Fórmula de luminancia WCAG
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? 'dark' : 'light'
}

/**
 * Iniciales a partir de nombre y apellido (ej: "Juan Pérez" → "JP").
 */
export function getIniciales(nombre: string, apellido?: string): string {
  const n = nombre.charAt(0).toUpperCase()
  const a = apellido ? apellido.charAt(0).toUpperCase() : ''
  return n + a
}

/**
 * Tiempo relativo para feeds: "Hace 5 min", "Ayer", "23 de abr"
 */
export function formatRelativo(ts: any): string {
  if (!ts) return ''
  let date: Date
  if (typeof ts === 'string') {
    date = new Date(ts)
  } else if (ts && typeof ts.toDate === 'function') {
    date = ts.toDate()
  } else {
    return ''
  }
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
