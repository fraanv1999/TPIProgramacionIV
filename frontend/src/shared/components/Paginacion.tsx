import { Button } from '../ui/Button'

interface PaginacionProps {
  /** Página actual, empezando en 0. */
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
  total?: number
}

export function Paginacion({ pagina, totalPaginas, onChange, total }: PaginacionProps) {
  if (totalPaginas <= 1) {
    return total !== undefined ? <p className="text-sm text-stone-500">{total} resultado(s)</p> : null
  }
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Paginación">
      <p className="text-sm text-stone-500">
        Página {pagina + 1} de {totalPaginas}
        {total !== undefined && ` · ${total} resultado(s)`}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={pagina === 0} onClick={() => onChange(pagina - 1)}>
          ← Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={pagina >= totalPaginas - 1}
          onClick={() => onChange(pagina + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </nav>
  )
}
