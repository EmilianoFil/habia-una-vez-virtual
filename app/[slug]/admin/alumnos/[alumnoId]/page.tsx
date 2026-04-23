'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Heart, Users, Shield, Loader2, BookOpen } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useAlumno } from '@/hooks/useAlumnos'
import { useSalas } from '@/hooks/useSalas'
import { formatFecha, calcularEdad, getIniciales } from '@/lib/utils'
import { TurnoBadge } from '@/components/ui/Badge'

export default function AlumnoDetailPage() {
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const alumnoId = params.alumnoId as string
  const slug = params.slug as string

  const { alumno, loading } = useAlumno(tenant.id, alumnoId)
  const { salas } = useSalas(tenant.id)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold text-gray-900">Alumno no encontrado</h2>
        <button onClick={() => router.back()} className="btn-secondary">← Volver</button>
      </div>
    )
  }

  const dp = alumno.datosPersonales
  const dm = alumno.datosMedicos
  const sala = salas.find((s) => s.id === alumno.salaActualId)
  const iniciales = getIniciales(dp?.nombre ?? '?', dp?.apellido)

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Perfil del alumno</h1>
      </div>

      {/* Hero card */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row gap-6">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {dp?.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dp.foto} alt={dp.nombre} className="w-full h-full object-cover" />
          ) : iniciales}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{dp?.apellido}, {dp?.nombre}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {dp?.fechaNacimiento && (
              <span className="text-sm text-gray-500">
                {calcularEdad(dp.fechaNacimiento)} años — {formatFecha(dp.fechaNacimiento)}
              </span>
            )}
            {dp?.dni && <span className="text-sm text-gray-400">DNI {dp.dni}</span>}
          </div>
          {sala && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium text-gray-700">{sala.nombre}</span>
              <TurnoBadge turno={sala.turno} />
            </div>
          )}
        </div>
        <button className="btn-primary self-start">Editar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos médicos */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Datos médicos</h3>
          </div>
          <dl className="space-y-2.5">
            <InfoRow label="Alergias" value={dm?.alergias} />
            <InfoRow label="Medicación" value={dm?.medicacionHabitual} />
            <InfoRow label="Obra social" value={dm?.obraSocial} />
            <InfoRow label="Pediatra" value={dm?.pediatraNombre} />
            <InfoRow label="Tel. Pediatra" value={dm?.pediatraTelefono} />
          </dl>
        </div>

        {/* Contactos */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Contactos de emergencia</h3>
          </div>
          {alumno.contactosEmergencia?.length > 0 ? (
            <div className="space-y-3">
              {alumno.contactosEmergencia.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-400">{c.relacion}</p>
                  </div>
                  <a href={`tel:${c.telefono}`} className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {c.telefono}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin contactos cargados</p>
          )}
        </div>

        {/* Autorizados */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Autorizados a retirar</h3>
          </div>
          {alumno.autorizados?.length > 0 ? (
            <div className="space-y-3">
              {alumno.autorizados.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  >
                    {a.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.foto} alt={a.nombre} className="w-full h-full object-cover" />
                    ) : getIniciales(a.nombre)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                    <p className="text-xs text-gray-400">{a.relacion} — DNI {a.dni || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin autorizados cargados</p>
          )}
        </div>

        {/* Historial de salas */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold text-gray-900">Historial de salas</h3>
          </div>
          {alumno.historialSalas?.length > 0 ? (
            <div className="space-y-2">
              {alumno.historialSalas.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{h.salaNombre}</p>
                  <p className="text-xs text-gray-400">{formatFecha(h.desde)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin historial</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-700">{value?.trim() || <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}
