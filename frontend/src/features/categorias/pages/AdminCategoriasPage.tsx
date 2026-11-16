import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { AlertaError, EstadoError } from '../../../shared/components/EstadoError'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { PageHeader } from '../../../shared/layout/MainLayout'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types'

type Dialogo = { tipo: 'crear' } | { tipo: 'editar'; categoria: Categoria } | { tipo: 'eliminar'; categoria: Categoria } | null

export function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

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

  const columns = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-stone-500">{row.original.descripcion ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => abrir({ tipo: 'editar', categoria: row.original })}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => abrir({ tipo: 'eliminar', categoria: row.original })}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader titulo="Categorías" subtitulo="Cada producto pertenece a una categoría.">
        <Button onClick={() => abrir({ tipo: 'crear' })}>+ Nueva categoría</Button>
      </PageHeader>

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError error={categorias.error} onRetry={() => void categorias.refetch()} />
      ) : (
        <DataTable data={categorias.data} columns={columns} buscador vacio="No hay categorías" />
      )}

      <Modal
        open={dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar'}
        title={dialogo?.tipo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        onClose={cerrar}
      >
        {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
          <CategoriaForm
            key={dialogo.tipo === 'editar' ? dialogo.categoria.id : 'nueva'}
            inicial={dialogo.tipo === 'editar' ? dialogo.categoria : undefined}
            error={error}
            onCancel={cerrar}
            onSubmit={(valores: CategoriaCreate) =>
              ejecutar(() =>
                dialogo.tipo === 'editar'
                  ? actualizar.mutateAsync({ id: dialogo.categoria.id, payload: valores })
                  : crear.mutateAsync(valores),
              )
            }
          />
        )}
      </Modal>

      <Modal open={dialogo?.tipo === 'eliminar'} title="Eliminar categoría" onClose={cerrar}>
        {dialogo?.tipo === 'eliminar' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-stone-600">
              ¿Dar de baja <strong>{dialogo.categoria.nombre}</strong>? El nombre seguirá reservado y sus productos
              <strong> no </strong>se ocultan: para retirarlos del catálogo, dalos de baja también.
            </p>
            <AlertaError mensaje={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={eliminar.isPending}
                onClick={() => void ejecutar(() => eliminar.mutateAsync(dialogo.categoria.id))}
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
