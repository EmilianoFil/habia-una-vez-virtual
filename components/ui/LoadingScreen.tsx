export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div
        className="w-12 h-12 rounded-full border-4 animate-spin"
        style={{
          borderColor: 'var(--color-primary-light)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
      <p className="text-sm font-medium text-gray-400">Cargando...</p>
    </div>
  )
}
