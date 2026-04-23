interface EmptyStateProps {
  icon?: string
  titulo: string
  descripcion?: string
  accion?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📭', titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 text-lg mb-2">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{descripcion}</p>
      )}
      {accion && (
        <button onClick={accion.onClick} className="btn-primary mt-6">
          {accion.label}
        </button>
      )}
    </div>
  )
}
