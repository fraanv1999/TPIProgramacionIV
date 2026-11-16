import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { DataTable } from '../../../shared/components/DataTable'
import { BadgeEstado, etiquetaEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import type { EstadoPedido, Pedido } from '../types'
import { TRANSICIONES } from '../types'

interface PedidosTableProps {
  pedidos: Pedido[]
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
  procesandoId: number | null
}

/** Tabla de pedidos del panel: los botones salen de la máquina de estados (RN-02). */
export function PedidosTable({ pedidos, onVer, onCambiarEstado, procesandoId }: PedidosTableProps) {
  const columns = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { accessorKey: 'id', header: '#', cell: ({ row }) => <span className="font-semibold">#{row.original.id}</span> },
      { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => formatFecha(row.original.created_at) },
      { accessorKey: 'usuario_id', header: 'Cliente (ID)' },
      {
        accessorKey: 'direccion_entrega',
        header: 'Dirección',
        cell: ({ row }) => (
          <span className="block max-w-48 truncate" title={row.original.direccion_entrega}>
            {row.original.direccion_entrega}
          </span>
        ),
      },
      { accessorKey: 'forma_pago', header: 'Pago' },
      { accessorKey: 'total', header: 'Total', cell: ({ row }) => formatPrecio(row.original.total) },
      { accessorKey: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => onVer(p)}>
                Ver
              </Button>
              {TRANSICIONES[p.estado].map((destino) => (
                <Button
                  key={destino}
                  size="sm"
                  variant={destino === 'CANCELADO' ? 'ghost' : 'primary'}
                  className={destino === 'CANCELADO' ? 'text-red-600' : ''}
                  disabled={procesandoId === p.id}
                  onClick={() => onCambiarEstado(p, destino)}
                >
                  {destino === 'CANCELADO' ? 'Cancelar' : `→ ${etiquetaEstado(destino)}`}
                </Button>
              ))}
            </div>
          )
        },
      },
    ],
    [onVer, onCambiarEstado, procesandoId],
  )

  return <DataTable data={pedidos} columns={columns} buscador vacio="No hay pedidos con ese filtro" />
}
