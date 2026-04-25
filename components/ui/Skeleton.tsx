import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-gray-100', className)} />
  )
}

/** Fila de skeleton para listas de items (ej: alumnos, docentes) */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {lines > 2 && <Skeleton className="h-3 w-full" />}
      {lines > 3 && <Skeleton className="h-3 w-4/5" />}
    </div>
  )
}

/** Grid de skeleton cards */
export function SkeletonGrid({ count = 6, cols = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' }: { count?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Skeleton para vista de lista (tabla o stack vertical) */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}
