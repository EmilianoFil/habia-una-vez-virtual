'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { getUserClaims, logout } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  Shield, School, Users, LogOut, Plus, Search, ChevronRight, ExternalLink, Settings, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'

interface TenantRow {
  id: string
  name: string
  slug: string
  active: boolean
  primaryColor: string
}

export default function SuperadminDashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [userName, setUserName] = useState('')
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Modal para invitar admin
  const [inviteModal, setInviteModal] = useState<{ open: boolean; tenantId: string; tenantName: string }>({
    open: false,
    tenantId: '',
    tenantName: ''
  })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // Solo redirigir si no hay cookie __claims: si existe, Firebase aún está
          // inicializando el estado de auth y redirigir causaría un loop con el login.
          const hasClaimsCookie = document.cookie.includes('__claims=')
          if (!hasClaimsCookie) {
            router.replace('/superadmin/login')
          }
          setChecking(false)
          return
        }

        const claims = await getUserClaims(user)

        if (claims?.role !== 'superadmin') {
          window.location.href = '/superadmin/login'
          setChecking(false)
          return
        }

        setUserName(user.displayName ?? user.email?.split('@')[0] ?? 'Superadmin')

        const q = query(collection(db, 'tenants'), orderBy('config.name'), limit(200))
        const querySnapshot = await getDocs(q)

        const loadedTenants: TenantRow[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          loadedTenants.push({
            id: doc.id,
            name: data.config?.name || 'Sin nombre',
            slug: data.config?.slug || doc.id,
            active: data.active ?? true,
            primaryColor: data.config?.primaryColor || '#4f46e5'
          })
        })
        setTenants(loadedTenants.sort((a,b) => a.name.localeCompare(b.name)))
      } catch (error) {
        console.error('[Superadmin] Error en verificación:', error)
      } finally {
        setChecking(false)
      }
    })
    return unsubscribe
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/superadmin/login')
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    try {
      const resp = await fetch('/api/superadmin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'admin',
          tenantId: inviteModal.tenantId
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al invitar')
      setInviteMsg({ type: 'success', text: data.message })
      setInviteEmail('')
      // Podríamos cerrar el modal después de un tiempo
      setTimeout(() => setInviteModal(prev => ({ ...prev, open: false })), 2000)
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message })
    } finally {
      setInviting(false)
    }
  }

  if (checking) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Modales */}
      <Modal
        open={inviteModal.open}
        onClose={() => setInviteModal({ ...inviteModal, open: false })}
        title={`Asignar Admin - ${inviteModal.tenantName}`}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setInviteModal({ ...inviteModal, open: false })} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
            <button 
              onClick={handleInviteAdmin} 
              disabled={inviting || !inviteEmail} 
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              {inviting && <Loader2 size={16} className="animate-spin" />}
              Asignar como Admin
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {inviteMsg && (
            <div className={`p-3 rounded-lg text-xs ${inviteMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {inviteMsg.text}
            </div>
          )}
          <p className="text-sm text-slate-400">
            Ingresá el email del usuario que se registró (o se registrará) en la plataforma para otorgarle permisos de administrador en esta institución.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email del Administrador</label>
            <input 
              type="email" 
              placeholder="admin@email.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </Modal>

      <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield size={16} />
          </div>
          <span className="font-bold text-slate-200">Superadmin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{userName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Instituciones</h1>
            <p className="text-slate-400 text-sm mt-1">Gestión de tenants de la plataforma</p>
          </div>
          <Link 
            href="/superadmin/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Nueva institución
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <School size={20} className="text-indigo-400 mb-3" />
            <p className="text-3xl font-bold text-white">{tenants.length}</p>
            <p className="text-sm text-slate-400 mt-1">Instituciones activas</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 opacity-50">
            <Users size={20} className="text-indigo-400 mb-3" />
            <p className="text-3xl font-bold text-white">—</p>
            <p className="text-sm text-slate-400 mt-1">Total de usuarios (Próximamente)</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 opacity-50">
            <Users size={20} className="text-indigo-400 mb-3" />
            <p className="text-3xl font-bold text-white">—</p>
            <p className="text-sm text-slate-400 mt-1">Alumnos registrados (Próximamente)</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar institución..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1"
            />
          </div>
          
          <div className="divide-y divide-slate-800">
            {filteredTenants.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No se encontraron instituciones.
              </div>
            ) : (
              filteredTenants.map(tenant => (
                <div key={tenant.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: tenant.primaryColor }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{tenant.name}</h3>
                      <p className="text-sm text-slate-400">/{tenant.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 mr-2 rounded-full text-xs font-medium ${tenant.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tenant.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <button 
                      onClick={() => {
                        setInviteMsg(null)
                        setInviteEmail('')
                        setInviteModal({ open: true, tenantId: tenant.id, tenantName: tenant.name })
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                      title="Asignar Admin"
                    >
                      <Users size={18} />
                    </button>
                    <Link 
                      href={`/superadmin/editar/${tenant.slug}`} 
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                      title="Editar institución"
                    >
                      <Settings size={18} />
                    </Link>
                    <Link 
                      href={`/${tenant.slug}/login`} 
                      target="_blank"
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                      title="Abrir tenant"
                    >
                      <ExternalLink size={18} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
