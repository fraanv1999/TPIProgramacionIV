import { useDeferredValue, useState } from 'react'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { Skeleton } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input, Select } from '../../../shared/ui/Input'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const LIMIT = 8

function CatalogoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Cargando productos">
      {Array.from({ length: LIMIT }, (_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const search = useDeferredValue(busqueda.trim())

  const categorias = useCategorias()
  const productos = useProductos({
    skip: pagina * LIMIT, // paginado en el servidor
    limit: LIMIT,
    search: search || undefined,
    categoria_id: categoriaId,
  })

  const totalPaginas = productos.data ? Math.ceil(productos.data.total / LIMIT) : 0
  const hayFiltros = !!search || categoriaId !== undefined

  return (
    <div>
      <PageHeader titulo="Catálogo" subtitulo="Elegí tus comidas favoritas y armá tu pedido." />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input
          type="search"
          placeholder="Buscar por nombre…"
          aria-label="Buscar productos"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(0)
          }}
        />
        <Select
          aria-label="Filtrar por categoría"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
            setPagina(0)
          }}
        >
          <option value="">Todas las categorías</option>
          {categorias.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      {productos.isPending ? (
        <CatalogoSkeleton />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onRetry={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🔍"
          titulo="No encontramos productos"
          mensaje={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
          accion={
            hayFiltros && (
              <Button
                variant="secondary"
                onClick={() => {
                  setBusqueda('')
                  setCategoriaId(undefined)
                  setPagina(0)
                }}
              >
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <div className={`flex flex-col gap-6 transition-opacity ${productos.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productos.data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} total={productos.data.total} />
        </div>
      )}
    </div>
  )
}
