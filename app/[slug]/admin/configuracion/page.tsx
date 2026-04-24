'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, Clock, Users, Loader2, CheckCircle2, Mail, ShieldAlert } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { updateTenantConfig } from '@/lib/services/tenant.service'
import { TurnoConfig, EmailSettings } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeader } from '@/components/ui/PageHeader'
import { PhotoUpload } from '@/components/ui/PhotoUpload'
import { updateTenantData } from '@/lib/services/tenant.service'

const DEFAULT_TURNO: TurnoConfig = {
  id: '',
  nombre: '',
  inicio: '08:00',
  fin: '12:00'
}

export default function ConfiguracionPage() {
  const { tenant } = useTenant()
  const [turnos, setTurnos] = useState<TurnoConfig[]>(tenant.configuracion?.turnos ?? [])
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(tenant.configuracion?.emailSettings ?? {
    enabled: false,
    provider: 'gmail',
    email: '',
    appPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tenant.configuracion?.turnos) {
      setTurnos(tenant.configuracion.turnos)
    }
  }, [tenant.configuracion?.turnos])

  const addTurno = () => {
    const newTurno = { ...DEFAULT_TURNO, id: `turno-${Date.now()}` }
    setTurnos([...turnos, newTurno])
  }

  const removeTurno = (id: string) => {
    setTurnos(turnos.filter(t => t.id !== id))
  }

  const updateTurno = (id: string, field: keyof TurnoConfig, value: any) => {
    setTurnos(turnos.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateTenantConfig(tenant.id, { turnos, emailSettings })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpdate(url: string | null) {
    try {
      await updateTenantData(tenant.id, { logo: url })
    } catch (err: any) {
      console.error('Error al actualizar logo:', err)
      alert('No se pudo actualizar el logo: ' + err.message)
    }
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <PageHeader 
        titulo="Configuración" 
        descripcion="Gestioná los parámetros generales de la institución."
      />

      <div className="space-y-8">
        {/* Branding / Logo */}
        <div className="card p-6 border-amber-100 bg-amber-50/5">
          <SectionHeader 
            titulo="Identidad de la Institución" 
            descripcion="Subí el logo de tu jardín. Este se usará en el sidebar, las comunicaciones y como icono de la aplicación."
          />
          
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-2xl border border-amber-100/50">
            <PhotoUpload 
              value={tenant.logo} 
              onChange={handleLogoUpdate}
              storagePath={`tenants/${tenant.id}/branding/logo`}
              label="Cambiar logo"
            />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-sm font-bold text-gray-900">Logo del Jardín</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Se recomienda usar una imagen cuadrada (1:1) con fondo transparente (.png).
                Tamaño ideal: 512x512 px.
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Turnos */}
        <div className="card p-6">
          <SectionHeader 
            titulo="Turnos y Horarios" 
            descripcion="Definí los turnos disponibles para las salas. Estos horarios se usarán para el control de asistencia y vacantes."
          />

          <div className="mt-6 space-y-4">
            {turnos.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <Clock size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No hay turnos configurados aún.</p>
              </div>
            )}

            {turnos.map((turno) => (
              <div key={turno.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group animate-slide-up">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre del Turno</label>
                        <input 
                          className="input py-2" 
                          value={turno.nombre} 
                          onChange={(e) => updateTurno(turno.id, 'nombre', e.target.value)}
                          placeholder="Ej: Mañana"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hora Inicio</label>
                        <input 
                          type="time"
                          className="input py-2" 
                          value={turno.inicio} 
                          onChange={(e) => updateTurno(turno.id, 'inicio', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hora Fin</label>
                        <input 
                          type="time"
                          className="input py-2" 
                          value={turno.fin} 
                          onChange={(e) => updateTurno(turno.id, 'fin', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeTurno(turno.id)}
                    className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all sm:self-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={addTurno}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Agregar nuevo turno
            </button>
          </div>
        </div>

        {/* Sección: Email */}
        <div className="card p-6 border-indigo-100 bg-indigo-50/5">
          <SectionHeader 
            titulo="Configuración de Mails" 
            descripcion="Configurá desde qué cuenta se enviarán las notificaciones y accesos de familiares."
          />

          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${emailSettings.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Activar envíos automáticos</p>
                  <p className="text-xs text-gray-500">Mandar mails de bienvenida y cambio de clave.</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailSettings({ ...emailSettings, enabled: !emailSettings.enabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${emailSettings.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailSettings.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {emailSettings.enabled && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Proveedor</label>
                    <select 
                      className="input py-2 text-sm"
                      value={emailSettings.provider}
                      onChange={(e) => setEmailSettings({ ...emailSettings, provider: e.target.value as any })}
                    >
                      <option value="gmail">Gmail (Recomendado)</option>
                      <option value="smtp">Otro SMTP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email emisor</label>
                    <input 
                      className="input py-2 text-sm" 
                      placeholder="ejemplo@gmail.com"
                      value={emailSettings.email}
                      onChange={(e) => setEmailSettings({ ...emailSettings, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña de Aplicación</label>
                  <input 
                    type="password"
                    className="input py-2 text-sm" 
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={emailSettings.appPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, appPassword: e.target.value })}
                  />
                  <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Si usás Gmail, debés generar una <strong>Contraseña de Aplicación</strong> en tu Cuenta de Google (Seguridad → Verificación en 2 pasos). No uses tu clave normal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón Guardar Flotante / Sticky */}
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-lg sticky bottom-6 z-20">
          <div className="flex items-center gap-3">
            {success && (
              <div className="flex items-center gap-2 text-emerald-600 animate-fade-in">
                <CheckCircle2 size={18} />
                <span className="text-sm font-bold">Cambios guardados</span>
              </div>
            )}
            {error && <span className="text-sm font-bold text-red-500 animate-fade-in">{error}</span>}
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-3 flex items-center gap-2 shadow-indigo-200 shadow-xl"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
