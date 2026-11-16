export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} aria-hidden="true" />
}

/** Varias filas de skeleton, para tablas y listas mientras cargan. */
export function SkeletonFilas({ filas = 5 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
