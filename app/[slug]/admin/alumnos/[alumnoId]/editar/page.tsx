'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, Loader2, CheckCircle2, Save, Plus } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useSalas } from '@/hooks/useSalas'
import { useAlumno } from '@/hooks/useAlumnos'
import { updateAlumno } from '@/lib/services/alumnos.service'
import { PhotoUpload } from '@/components/ui/PhotoUpload'
import { SectionHeader } from '@/components/ui/PageHeader'
import { ContactoEmergencia, AutorizadoRetiro, AlumnoDocumento } from '@/lib/types'
import { DocumentUpload } from '@/components/ui/DocumentUpload'
import { calcularEdadDetalle } from '@/lib/utils'

const TABS = ['Datos personales', 'Datos médicos', 'Contactos', 'Autorizados'] as const
type Tab = typeof TABS[number]

const EMPTY_CONTACTO: ContactoEmergencia = { nombre: '', relacion: '', telefono: '', email: '' }
const EMPTY_AUTORIZADO: AutorizadoRetiro = { nombre: '', relacion: '', telefono: '', foto: null, dni: '' }

export default function EditarAlumnoPage() {
  const { tenant } = useTenant()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const alumnoId = params.alumnoId as string
  
  const { alumno, loading: loadingAlumno } = useAlumno(tenant.id, alumnoId)
  const { salas } = useSalas(tenant.id)

  const [tab, setTab] = useState<Tab>('Datos personales')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Datos personales
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [dni, setDni] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [salaId, setSalaId] = useState('')
  const [turnoId, setTurnoId] = useState('')

  // Datos médicos
  const [alergias, setAlergias] = useState('')
  const [medicacion, setMedicacion] = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [pediatraNombre, setPediatraNombre] = useState('')
  const [pediatraTelefono, setPediatraTelefono] = useState('')
  const [documentosMedicos, setDocumentosMedicos] = useState<AlumnoDocumento[]>([])

  // Contactos
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([])

  // Autorizados
  const [autorizados, setAutorizados] = useState<AutorizadoRetiro[]>([])

  // Cargar datos cuando el alumno esté listo
  useEffect(() => {
    if (alumno) {
      setNombre(alumno.datosPersonales.nombre)
      setApellido(alumno.datosPersonales.apellido)
      setFechaNacimiento(alumno.datosPersonales.fechaNacimiento || '')
      setDni(alumno.datosPersonales.dni || '')
      setFoto(alumno.datosPersonales.foto)
      setSalaId(alumno.salaActualId || '')
      setTurnoId(alumno.turnoId || '')
      
      setAlergias(alumno.datosMedicos.alergias || '')
      setMedicacion(alumno.datosMedicos.medicacionHabitual || '')
      setObraSocial(alumno.datosMedicos.obraSocial || '')
      setPediatraNombre(alumno.datosMedicos.pediatraNombre || '')
      setPediatraTelefono(alumno.datosMedicos.pediatraTelefono || '')
      setDocumentosMedicos(alumno.datosMedicos.documentos || [])
      
      setContactos(alumno.contactosEmergencia?.length > 0 ? alumno.contactosEmergencia : [{ ...EMPTY_CONTACTO }])
      setAutorizados(alumno.autorizados || [])
    }
  }, [alumno])

  function addContacto() { setContactos([...contactos, { ...EMPTY_CONTACTO }]) }
  function removeContacto(i: number) { setContactos(contactos.filter((_, idx) => idx !== i)) }
  function updateContacto(i: number, field: keyof ContactoEmergencia, value: string) {
    const next = [...contactos]
    next[i] = { ...next[i], [field]: value }
    setContactos(next)
  }

  function addAutorizado() { setAutorizados([...autorizados, { ...EMPTY_AUTORIZADO }]) }
  function removeAutorizado(i: number) { setAutorizados(autorizados.filter((_, idx) => idx !== i)) }
  function updateAutorizado(i: number, field: keyof AutorizadoRetiro, value: string | null) {
    const next = [...autorizados]
    next[i] = { ...next[i], [field]: value }
    setAutorizados(next)
  }

  async function handleGuardar() {
    if (!nombre.trim() || !apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      setTab('Datos personales')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateAlumno(tenant.id, alumnoId, {
        datosPersonales: { nombre: nombre.trim(), apellido: apellido.trim(), fechaNacimiento, dni, foto },
        datosMedicos: { 
          alergias, 
          medicacionHabitual: medicacion, 
          obraSocial, 
          pediatraNombre, 
          pediatraTelefono,
          documentos: documentosMedicos 
        },
        contactosEmergencia: contactos.filter((c) => c.nombre.trim()),
        autorizados: autorizados.filter((a) => a.nombre.trim()),
        salaActualId: salaId || null,
        turnoId: turnoId || '',
      })
      setSaved(true)
      setTimeout(() => router.push(`/${slug}/admin/alumnos/${alumnoId}`), 1500)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loadingAlumno) {
    return (
      <div className="flex justify-center items-center min-h-screen font-black text-gray-300">
        <Loader2 size={28} className="animate-spin" />
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-xl font-bold text-gray-900">¡Cambios guardados!</h2>
          <p className="text-gray-500 text-sm mt-1">Redirigiendo al perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar alumno</h1>
          <p className="text-sm text-gray-500">Modificá los datos de {nombre}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-w-max py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {/* ---- Datos personales ---- */}
        {tab === 'Datos personales' && (
          <div className="space-y-5">
            <div className="flex items-start gap-6">
              <PhotoUpload
                value={foto}
                onChange={setFoto}
                storagePath={`tenants/${tenant.id}/alumnos/${alumnoId}/foto`}
                label="Foto"
                size="lg"
              />
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                    <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido *</label>
                    <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="García" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Fecha de nacimiento
                      {fechaNacimiento && (
                        <span className="ml-2 text-indigo-500 font-bold">
                          ({calcularEdadDetalle(fechaNacimiento)})
                        </span>
                      )}
                    </label>
                    <input type="date" className="input" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
                    <input className="input" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12.345.678" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sala asignada</label>
                <p className="text-[10px] text-amber-600 mb-2 font-bold uppercase tracking-widest">
                  Nota: El cambio de sala genera un registro en el historial.
                </p>
                <select className="input" value={salaId} onChange={(e) => setSalaId(e.target.value)}>
                  <option value="">Sin sala por ahora</option>
                  {salas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre} — {s.nivel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jornada / Turno</label>
                <p className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">
                  Turno configurado en la institución
                </p>
                <select className="input" value={turnoId} onChange={(e) => setTurnoId(e.target.value)}>
                  <option value="">Sin turno asignado</option>
                  {(tenant?.configuracion?.turnos ?? []).map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.inicio}–{t.fin})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ---- Datos médicos ---- */}
        {tab === 'Datos médicos' && (
          <div className="space-y-4">
            <SectionHeader titulo="Información médica" descripcion="Esta información es confidencial y solo visible para el equipo de la institución." />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alergias</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ej: Polen, mariscos, penicilina..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Medicación habitual</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={medicacion}
                onChange={(e) => setMedicacion(e.target.value)}
                placeholder="Ej: Ritalin 10mg por la mañana..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Obra social</label>
                <input className="input" value={obraSocial} onChange={(e) => setObraSocial(e.target.value)} placeholder="OSDE, IOMA..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pediatra</label>
                <input className="input" value={pediatraNombre} onChange={(e) => setPediatraNombre(e.target.value)} placeholder="Dr. Rodríguez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tel. Pediatra</label>
                <input className="input" value={pediatraTelefono} onChange={(e) => setPediatraTelefono(e.target.value)} placeholder="+54 11..." />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3 font-bold uppercase tracking-wider text-[10px]">Documentación médica</label>
              <DocumentUpload 
                documentos={documentosMedicos} 
                onChange={setDocumentosMedicos}
                storagePath={`tenants/${tenant.id}/alumnos/${alumnoId}/medicos`}
              />
            </div>
          </div>
        )}

        {/* ---- Contactos de emergencia ---- */}
        {tab === 'Contactos' && (
          <div className="space-y-4">
            <SectionHeader titulo="Contactos de emergencia" descripcion="Personas a las que llamar en caso de urgencia." />
            {contactos.map((c, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Contacto {i + 1}</span>
                  {contactos.length > 1 && (
                    <button onClick={() => removeContacto(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input className="input" placeholder="Nombre *" value={c.nombre}
                    onChange={(e) => updateContacto(i, 'nombre', e.target.value)} />
                  <input className="input" placeholder="Relación (madre, padre...)" value={c.relacion}
                    onChange={(e) => updateContacto(i, 'relacion', e.target.value)} />
                  <input className="input" placeholder="Teléfono" value={c.telefono}
                    onChange={(e) => updateContacto(i, 'telefono', e.target.value)} />
                  <div className="sm:col-span-3">
                    <input className="input" type="email" placeholder="Email para comunicaciones" value={c.email || ''}
                      onChange={(e) => updateContacto(i, 'email', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addContacto} className="btn-secondary w-full py-2.5">
              <Plus size={15} /> Agregar contacto
            </button>
          </div>
        )}

        {/* ---- Autorizados a retirar ---- */}
        {tab === 'Autorizados' && (
          <div className="space-y-4">
            <SectionHeader titulo="Autorizados a retirar" descripcion="Personas que pueden retirar al alumno de la institución." />
            {autorizados.map((a, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500">Autorizado {i + 1}</span>
                  <button onClick={() => removeAutorizado(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-4 items-start">
                  <PhotoUpload
                    value={a.foto}
                    onChange={(url) => updateAutorizado(i, 'foto', url)}
                    storagePath={`tenants/${tenant.id}/alumnos/${alumnoId}/autorizados/${i}`}
                    size="sm"
                    shape="circle"
                    label="Foto"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input className="input" placeholder="Nombre *" value={a.nombre}
                      onChange={(e) => updateAutorizado(i, 'nombre', e.target.value)} />
                    <input className="input" placeholder="Relación" value={a.relacion}
                      onChange={(e) => updateAutorizado(i, 'relacion', e.target.value)} />
                    <input className="input" placeholder="Teléfono" value={a.telefono}
                      onChange={(e) => updateAutorizado(i, 'telefono', e.target.value)} />
                    <input className="input" placeholder="DNI" value={a.dni}
                      onChange={(e) => updateAutorizado(i, 'dni', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addAutorizado} className="btn-secondary w-full py-2.5">
              <Plus size={15} /> Agregar autorizado
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.back()}
          className="btn-secondary px-5 py-2.5"
        >
          Cancelar
        </button>
        <div className="flex gap-3">
          {tab !== 'Datos personales' && (
            <button
              onClick={() => setTab(TABS[TABS.indexOf(tab) - 1])}
              className="btn-secondary px-4 py-2.5"
            >
              ← Anterior
            </button>
          )}
          {tab !== 'Autorizados' ? (
            <button
              onClick={() => setTab(TABS[TABS.indexOf(tab) + 1])}
              className="btn-primary px-5 py-2.5"
            >
              Siguiente →
            </button>
          ) : (
            <button onClick={handleGuardar} disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar cambios
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
