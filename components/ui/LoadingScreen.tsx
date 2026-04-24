import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center animate-pulse">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Cargando...
          </p>
        </div>
      </div>
    </div>
  )
}
