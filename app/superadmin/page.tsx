'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserClaims, logout } from '@/lib/auth'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  Shield, School, Users, LogOut, Plus, Search, ChevronRight
} from 'lucide-react'

interface TenantRow {
  id: string
  name: string
  slug: string
  active: boolean
}

export default function SuperadminDashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/superadmin/login')
        return
      }
      const claims = await getUserClaims(user)
      if (claims?.role !== 'superadmin') {
        router.replace('/superadmin/login')
        return
      }
      setUserName(user.displayName ?? user.email?.split('@')[0] ?? 'Superadmin')
      setChecking(false)
    })
    return unsubscribe
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/superadmin/login')
  }

  if (checking) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus size={16} />
            Nueva institución
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Instituciones activas', value: '—', icon: School },
            { label: 'Total de usuarios', value: '—', icon: Users },
            { label: 'Alumnos registrados', value: '—', icon: Users },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <Icon size={20} className="text-indigo-400 mb-3" />
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Tabla de tenants */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar institución..."
              className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1"
            />
          </div>
          <div className="p-8 text-center text-slate-500 text-sm">
            Los tenants se cargarán cuando se conecte Firestore.
          </div>
        </div>
      </main>
    </div>
  )
}
