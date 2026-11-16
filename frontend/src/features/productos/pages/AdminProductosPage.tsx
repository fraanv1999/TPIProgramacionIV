import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { formatPrecio } from '../../../shared/utils/format'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { ProductoImagen } from '../components/ProductoImagen'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }
  | null

export function AdminProductosPage() {
  // El panel pide limit=100 y pagina del lado del cliente con TanStack Table.
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const stock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [error, setError] = useState<string | null>(null)

  const abrir = (d: Dialogo) => {
    setError(null)
    setDialogo(d)
  }
  const cerrar = () => setDialogo(null)

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setError(null)
    try {
      await accion()
      cerrar()
    } catch (e) {
      setError(handleApiError(e))
    }
  }

  const columns = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: 'imagen',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <ProductoImagen src={row.original.imagen_url} alt={row.original.nombre} className="h-10 w-10 rounded-md text-lg" />
        ),
      },
      { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      { id: 'categoria', accessorFn: (p) => p.categoria.nombre, header: 'Categoría' },
      { accessorKey: 'precio_base', header: 'Precio', cell: ({ row }) => formatPrecio(row.original.precio_base) },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? 'font-semibold text-red-600' : ''}>{row.original.stock}</span>
        ),
      },
      {
        accessorKey: 'disponible',
        header: 'Disponible',
        cell: ({ row }) =>
          row.original.disponible ? (
            <span className="text-emerald-700">Sí</span>
          ) : (
            <span className="text-stone-500">No</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button size="sm" variant="secondary" onClick={() => abrir({ tipo: 'editar', producto: row.original })}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => abrir({ tipo: 'eliminar', producto: row.original })}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const sinCategorias = categorias.data !== undefined && categorias.data.length === 0

  return (
    <div>
      <PageHeader titulo="Productos" subtitulo="Alta, edición, stock y baja lógica de productos.">
        <Button onClick={() => abrir({ tipo: 'crear' })} disabled={!categorias.data || sinCategorias}>
          + Nuevo producto
        </Button>
      </PageHeader>
      {sinCategorias && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Creá al menos una categoría antes de cargar productos.
        </p>
      )}

      {productos.isPending ? (
        <SkeletonFilas filas={8} />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onRetry={() => void productos.refetch()} />
      ) : (
        <DataTable data={productos.data.items} columns={columns} buscador vacio="No hay productos cargados" />
      )}

      <Modal
        open={dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'}
        title={dialogo?.tipo === 'editar' ? 'Editar producto' : 'Nuevo producto'}
        onClose={cerrar}
      >
        {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && categorias.data && (
          <ProductoForm
            key={dialogo.tipo === 'editar' ? dialogo.producto.id : 'nuevo'}
            inicial={dialogo.tipo === 'editar' ? dialogo.producto : undefined}
            categorias={categorias.data}
            error={error}
            onCancel={cerrar}
            onSubmit={(valores: ProductoCreate) =>
              ejecutar(() =>
                dialogo.tipo === 'editar'
                  ? actualizar.mutateAsync({ id: dialogo.producto.id, payload: valores })
                  : crear.mutateAsync(valores),
              )
            }
          />
        )}
      </Modal>

      <Modal open={dialogo?.tipo === 'stock'} title="Stock y disponibilidad" onClose={cerrar}>
        {dialogo?.tipo === 'stock' && (
          <StockForm
            key={dialogo.producto.id}
            producto={dialogo.producto}
            error={error}
            onCancel={cerrar}
            onSubmit={(valores: ProductoStockUpdate) =>
              ejecutar(() => stock.mutateAsync({ id: dialogo.producto.id, payload: valores }))
            }
          />
        )}
      </Modal>

      <Modal open={dialogo?.tipo === 'eliminar'} title="Eliminar producto" onClose={cerrar}>
        {dialogo?.tipo === 'eliminar' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-stone-600">
              ¿Dar de baja <strong>{dialogo.producto.nombre}</strong>? Dejará de aparecer en el catálogo. Los pedidos
              existentes conservan su nombre y precio.
            </p>
            <AlertaError mensaje={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={eliminar.isPending}
                onClick={() => void ejecutar(() => eliminar.mutateAsync(dialogo.producto.id))}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
