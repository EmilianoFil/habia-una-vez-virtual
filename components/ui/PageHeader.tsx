import { cn } from '@/lib/utils'

interface PageHeaderProps {
  titulo: string
  descripcion?: string
  accion?: {
    label: string
    onClick: () => void
    icon?: React.ElementType
  }
  children?: React.ReactNode
}

export function PageHeader({ titulo, descripcion, accion, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        {descripcion && <p className="text-gray-500 text-sm mt-1">{descripcion}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {accion && (
          <button onClick={accion.onClick} className="btn-primary shrink-0">
            {accion.icon && <accion.icon size={16} />}
            {accion.label}
          </button>
        )}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  titulo: string
  descripcion?: string
}
export function SectionHeader({ titulo, descripcion }: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-gray-800 text-base">{titulo}</h2>
      {descripcion && <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>}
    </div>
  )
}
